// Search results component
import React from 'react';
import {Box, Text} from 'ink';
import type {SearchResult, Track} from '../../types/youtube-music.types.ts';
import {useTheme} from '../../hooks/useTheme.ts';
import {useNavigation} from '../../hooks/useNavigation.ts';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {usePlaylist} from '../../hooks/usePlaylist.ts';
import {KEYBINDINGS} from '../../utils/constants.ts';
import {truncate} from '../../utils/format.ts';
import {useCallback, useRef, useEffect} from 'react';
import {logger} from '../../services/logger/logger.service.ts';
import {useTerminalSize} from '../../hooks/useTerminalSize.ts';
import {getMusicService} from '../../services/youtube-music/api.ts';

// Generate unique component instance ID
let instanceCounter = 0;

type Props = {
	results: SearchResult[];
	selectedIndex: number;
	isActive?: boolean;
	onMixCreated?: (message: string) => void;
};

function SearchResults({
	results,
	selectedIndex,
	isActive = true,
	onMixCreated,
}: Props) {
	const {theme} = useTheme();
	const {dispatch} = useNavigation();
	const {play, dispatch: playerDispatch} = usePlayer();
	const {columns} = useTerminalSize();
	const musicService = getMusicService();
	const {createPlaylist} = usePlaylist();
	const mixCreatedRef = useRef<Props['onMixCreated']>(onMixCreated);
	mixCreatedRef.current = onMixCreated;

	// Track component instance and last action time for debouncing
	const instanceIdRef = useRef(++instanceCounter);
	const lastSelectTime = useRef<number>(0);
	const SELECT_DEBOUNCE_MS = 300; // Prevent duplicate triggers within 300ms

	useEffect(() => {
		const instanceId = instanceIdRef.current;
		logger.debug('SearchResults', 'Component mounted', {instanceId});
		return () => {
			logger.debug('SearchResults', 'Component unmounted', {instanceId});
		};
	}, []);

	// Navigate results with arrow keys
	const navigateUp = useCallback(() => {
		if (!isActive) return;
		if (selectedIndex > 0) {
			dispatch({category: 'SET_SELECTED_RESULT', index: selectedIndex - 1});
		}
	}, [selectedIndex, dispatch, isActive]);

	const navigateDown = useCallback(() => {
		if (!isActive) return;
		if (selectedIndex < results.length - 1) {
			dispatch({category: 'SET_SELECTED_RESULT', index: selectedIndex + 1});
		}
	}, [selectedIndex, results.length, dispatch, isActive]);

	// Play selected result
	const playSelected = useCallback(async () => {
		logger.debug('SearchResults', 'playSelected called', {
			isActive,
			selectedIndex,
			resultsLength: results.length,
		});
		if (!isActive) return;
		const selected = results[selectedIndex];
		logger.info('SearchResults', 'Playing selected track', {
			type: selected?.type,
			title: selected?.type === 'song' ? (selected.data as Track).title : 'N/A',
		});
		if (selected && selected.type === 'song') {
			// Clear queue when playing from search results to ensure indices match
			play(selected.data as Track, {clearQueue: true});
		} else if (selected && selected.type === 'artist') {
			const artistName =
				'name' in selected.data ? (selected.data as {name: string}).name : '';
			if (!artistName) {
				logger.warn(
					'SearchResults',
					'Artist name missing, cannot search songs',
				);
				return;
			}

			try {
				const response = await musicService.search(artistName, {
					type: 'songs',
					limit: 20,
				});
				const tracks = response.results
					.filter(result => result.type === 'song')
					.map(result => result.data as Track);

				if (tracks.length === 0) {
					logger.warn('SearchResults', 'No songs found for artist', {
						artistName,
					});
					return;
				}

				// Replace queue with artist songs and start playback
				playerDispatch({category: 'CLEAR_QUEUE'});
				playerDispatch({category: 'SET_QUEUE', queue: tracks});
				playerDispatch({category: 'PLAY', track: tracks[0]!});
			} catch (error) {
				logger.error('SearchResults', 'Failed to play artist songs', {
					error,
				});
			}
		} else {
			logger.warn('SearchResults', 'Selected item is not playable', {
				type: selected?.type,
			});
		}
	}, [selectedIndex, results, play, isActive, musicService, playerDispatch]);

	// Play selected result handler (memoized to prevent duplicate registrations)
	const handleSelect = useCallback(() => {
		const now = Date.now();
		const timeSinceLastSelect = now - lastSelectTime.current;
		const instanceId = instanceIdRef.current;

		if (!isActive) {
			logger.debug('SearchResults', 'SELECT ignored, not active', {instanceId});
			return;
		}

		// Debounce to prevent double-triggers
		if (timeSinceLastSelect < SELECT_DEBOUNCE_MS) {
			logger.warn('SearchResults', 'SELECT debounced (duplicate trigger)', {
				instanceId,
				timeSinceLastSelect,
				debounceMs: SELECT_DEBOUNCE_MS,
			});
			return;
		}

		lastSelectTime.current = now;
		logger.debug('SearchResults', 'SELECT key pressed', {isActive, instanceId});
		playSelected();
	}, [isActive, playSelected]);

	const createMixPlaylist = useCallback(async () => {
		if (!isActive) return;
		const selected = results[selectedIndex];
		if (!selected) {
			logger.warn('SearchResults', 'No result selected for mix');
			return;
		}

		let playlistName = 'Dynamic mix';
		const collectedTracks: Track[] = [];

		if (selected.type === 'song') {
			const selectedTrack = selected.data as Track;
			const title = selectedTrack.title || 'selected track';
			playlistName = `Mix for ${title}`;
			collectedTracks.push(selectedTrack);

			try {
				const suggestions = await musicService.getSuggestions(
					selectedTrack.videoId,
				);
				collectedTracks.push(...suggestions);
			} catch (error) {
				logger.error('SearchResults', 'Failed to fetch song suggestions', {
					error,
				});
			}
		} else if (selected.type === 'artist') {
			const artistName =
				'name' in selected.data ? (selected.data as {name: string}).name : '';
			if (!artistName) {
				logger.warn('SearchResults', 'Artist name missing for mix');
				mixCreatedRef.current?.(
					'Artist information is missing, cannot create mix.',
				);
				return;
			}

			playlistName = `${artistName} mix`;

			try {
				const response = await musicService.search(artistName, {
					type: 'songs',
					limit: 25,
				});
				const artistTracks = response.results
					.filter(result => result.type === 'song')
					.map(result => result.data as Track);
				collectedTracks.push(...artistTracks);
			} catch (error) {
				logger.error('SearchResults', 'Failed to fetch artist songs for mix', {
					error,
				});
			}
		} else {
			logger.warn('SearchResults', 'Mix creation unsupported result type', {
				type: selected.type,
			});
			mixCreatedRef.current?.(
				'Mix creation is only supported for songs and artists.',
			);
			return;
		}

		const uniqueTracks: Track[] = [];
		const seenVideoIds = new Set<string>();
		for (const track of collectedTracks) {
			if (!track?.videoId || seenVideoIds.has(track.videoId)) continue;
			seenVideoIds.add(track.videoId);
			uniqueTracks.push(track);
		}

		if (uniqueTracks.length === 0) {
			mixCreatedRef.current?.('No similar tracks were found to create a mix.');
			return;
		}

		const playlist = createPlaylist(playlistName, uniqueTracks);
		logger.info('SearchResults', 'Mix playlist created', {
			name: playlist.name,
			trackCount: uniqueTracks.length,
		});

		mixCreatedRef.current?.(
			`Created mix "${playlist.name}" with ${uniqueTracks.length} tracks.`,
		);
	}, [createPlaylist, isActive, musicService, results, selectedIndex]);

	useKeyBinding(KEYBINDINGS.UP, navigateUp);
	useKeyBinding(KEYBINDINGS.DOWN, navigateDown);
	useKeyBinding(KEYBINDINGS.SELECT, handleSelect);
	useKeyBinding(KEYBINDINGS.CREATE_MIX, () => {
		void createMixPlaylist();
	});

	// Note: Removed redundant useEffect that was syncing selectedIndex to dispatch
	// This was causing unnecessary re-renders. The selectedIndex is already managed
	// by the parent component (SearchLayout) and passed down as a prop.

	if (results.length === 0) {
		return null;
	}

	// Calculate responsive truncation
	const maxTitleWidth = Math.max(20, Math.floor(columns * 0.4));

	return (
		<Box flexDirection="column" gap={1}>
			<Text color={theme.colors.dim} bold>
				Results ({results.length})
			</Text>

			{/* Table header */}
			<Box paddingX={1}>
				<Text color={theme.colors.dim} bold>
					{'#'.padEnd(6)} {'Type'.padEnd(10)} {'Title'.padEnd(maxTitleWidth)}
				</Text>
			</Box>

			{/* Results list */}
			{results.map((result, index) => {
				const isSelected = index === selectedIndex;
				const data = result.data;

				const title =
					'title' in data ? data.title : 'name' in data ? data.name : 'Unknown';

				return (
					<Box
						key={index}
						paddingX={1}
						borderStyle={isSelected ? 'double' : undefined}
						borderColor={isSelected ? theme.colors.primary : undefined}
					>
						<Text
							color={isSelected ? theme.colors.primary : theme.colors.dim}
							bold={isSelected}
						>
							{(isSelected ? '> ' : '  ') + (index + 1).toString().padEnd(4)}
						</Text>

						<Text
							color={isSelected ? theme.colors.primary : theme.colors.dim}
							bold={isSelected}
						>
							{result.type.toUpperCase().padEnd(10)}
						</Text>

						<Text
							color={isSelected ? theme.colors.primary : theme.colors.text}
							bold={isSelected}
						>
							{truncate(title, maxTitleWidth)}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}

export default React.memo(SearchResults);
