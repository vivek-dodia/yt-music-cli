// Player controls component
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS} from '../../utils/constants.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {useTheme} from '../../hooks/useTheme.ts';
import {Box, Text} from 'ink';
import {useEffect} from 'react';
import {logger} from '../../services/logger/logger.service.ts';

let mountCount = 0;

export default function PlayerControls() {
	const instanceId = ++mountCount;

	useEffect(() => {
		logger.debug('PlayerControls', 'Component mounted', {instanceId});
		return () => {
			logger.debug('PlayerControls', 'Component unmounted', {instanceId});
		};
	}, [instanceId]);

	const {theme} = useTheme();
	const {
		state: playerState,
		pause,
		resume,
		next,
		previous,
		volumeUp,
		volumeDown,
	} = usePlayer();

	// DEBUG: Log when callbacks change (detect instability)
	useEffect(() => {
		// Temporarily output to stderr to debug without triggering Ink re-render
		process.stderr.write(
			`[PlayerControls] volumeUp callback: ${typeof volumeUp}\n`,
		);
	}, [volumeUp, instanceId]);

	const handlePlayPause = () => {
		if (playerState.isPlaying) {
			pause();
		} else {
			resume();
		}
	};

	// Keyboard bindings
	useKeyBinding(KEYBINDINGS.PLAY_PAUSE, handlePlayPause);
	useKeyBinding(KEYBINDINGS.NEXT, next);
	useKeyBinding(KEYBINDINGS.PREVIOUS, previous);
	useKeyBinding(KEYBINDINGS.VOLUME_UP, volumeUp);
	useKeyBinding(KEYBINDINGS.VOLUME_DOWN, volumeDown);

	return (
		<Box
			flexDirection="row"
			justifyContent="space-between"
			paddingX={2}
			borderStyle="classic"
			borderColor={theme.colors.dim}
		>
			{/* Previous */}
			<Text color={theme.colors.text}>
				[<Text color={theme.colors.dim}>b</Text>] Prev
			</Text>

			{/* Play/Pause */}
			<Text color={theme.colors.primary}>
				{playerState.isPlaying ? (
					<Text>
						[<Text color={theme.colors.dim}>Space</Text>] Pause
					</Text>
				) : (
					<Text>
						[<Text color={theme.colors.dim}>Space</Text>] Play
					</Text>
				)}
			</Text>

			{/* Next */}
			<Text color={theme.colors.text}>
				[<Text color={theme.colors.dim}>n</Text>] Next
			</Text>

			{/* Volume */}
			<Text color={theme.colors.text}>
				[<Text color={theme.colors.dim}>+/-</Text>] Vol: {playerState.volume}%
			</Text>
		</Box>
	);
}
