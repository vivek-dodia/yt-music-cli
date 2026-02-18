// Settings component
import {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {useTheme} from '../../hooks/useTheme.ts';
import {useNavigation} from '../../hooks/useNavigation.ts';
import {getConfigService} from '../../services/config/config.service.ts';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS, VIEW} from '../../utils/constants.ts';
import {useSleepTimer} from '../../hooks/useSleepTimer.ts';
import {formatTime} from '../../utils/format.ts';
import {useKeyboardBlocker} from '../../hooks/useKeyboardBlocker.tsx';
import type {DownloadFormat} from '../../types/config.types.ts';

const QUALITIES: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
const DOWNLOAD_FORMATS: DownloadFormat[] = ['mp3', 'm4a'];

const SETTINGS_ITEMS = [
	'Stream Quality',
	'Audio Normalization',
	'Notifications',
	'Discord Rich Presence',
	'Downloads Enabled',
	'Download Folder',
	'Download Format',
	'Sleep Timer',
	'Custom Keybindings',
	'Manage Plugins',
] as const;

export default function Settings() {
	const {theme} = useTheme();
	const {dispatch} = useNavigation();
	const config = getConfigService();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [quality, setQuality] = useState(config.get('streamQuality') || 'high');
	const [audioNormalization, setAudioNormalization] = useState(
		config.get('audioNormalization') ?? false,
	);
	const [notifications, setNotifications] = useState(
		config.get('notifications') ?? false,
	);
	const [discordRpc, setDiscordRpc] = useState(
		config.get('discordRichPresence') ?? false,
	);
	const [downloadsEnabled, setDownloadsEnabled] = useState(
		config.get('downloadsEnabled') ?? false,
	);
	const [downloadDirectory, setDownloadDirectory] = useState(
		config.get('downloadDirectory') ?? '',
	);
	const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>(
		config.get('downloadFormat') ?? 'mp3',
	);
	const [isEditingDownloadDirectory, setIsEditingDownloadDirectory] =
		useState(false);
	const {
		isActive,
		activeMinutes,
		remainingSeconds,
		startTimer,
		cancelTimer,
		presets,
	} = useSleepTimer();
	useKeyboardBlocker(isEditingDownloadDirectory);

	const navigateUp = () => {
		setSelectedIndex(prev => Math.max(0, prev - 1));
	};

	const navigateDown = () => {
		setSelectedIndex(prev => Math.min(SETTINGS_ITEMS.length - 1, prev + 1));
	};

	const toggleQuality = () => {
		const currentIndex = QUALITIES.indexOf(quality);
		const nextQuality = QUALITIES[(currentIndex + 1) % QUALITIES.length]!;
		setQuality(nextQuality);
		config.set('streamQuality', nextQuality);
	};

	const toggleNormalization = () => {
		const next = !audioNormalization;
		setAudioNormalization(next);
		config.set('audioNormalization', next);
	};

	const toggleNotifications = () => {
		const next = !notifications;
		setNotifications(next);
		config.set('notifications', next);
	};

	const toggleDiscordRpc = () => {
		const next = !discordRpc;
		setDiscordRpc(next);
		config.set('discordRichPresence', next);
	};

	const toggleDownloadsEnabled = () => {
		const next = !downloadsEnabled;
		setDownloadsEnabled(next);
		config.set('downloadsEnabled', next);
	};

	const cycleDownloadFormat = () => {
		const currentIndex = DOWNLOAD_FORMATS.indexOf(downloadFormat);
		const nextFormat =
			DOWNLOAD_FORMATS[(currentIndex + 1) % DOWNLOAD_FORMATS.length]!;
		setDownloadFormat(nextFormat);
		config.set('downloadFormat', nextFormat);
	};

	const cycleSleepTimer = () => {
		if (isActive) {
			cancelTimer();
			return;
		}
		// Find next preset (start from first if none active)
		const currentPresetIndex = activeMinutes
			? presets.indexOf(activeMinutes as (typeof presets)[number])
			: -1;
		const nextPreset = presets[(currentPresetIndex + 1) % presets.length]!;
		startTimer(nextPreset);
	};

	const handleSelect = () => {
		if (selectedIndex === 0) {
			toggleQuality();
		} else if (selectedIndex === 1) {
			toggleNormalization();
		} else if (selectedIndex === 2) {
			toggleNotifications();
		} else if (selectedIndex === 3) {
			toggleDiscordRpc();
		} else if (selectedIndex === 4) {
			toggleDownloadsEnabled();
		} else if (selectedIndex === 5) {
			setIsEditingDownloadDirectory(true);
		} else if (selectedIndex === 6) {
			cycleDownloadFormat();
		} else if (selectedIndex === 7) {
			cycleSleepTimer();
		} else if (selectedIndex === 8) {
			dispatch({category: 'NAVIGATE', view: VIEW.KEYBINDINGS});
		} else if (selectedIndex === 9) {
			dispatch({category: 'NAVIGATE', view: VIEW.PLUGINS});
		}
	};

	useKeyBinding(KEYBINDINGS.UP, navigateUp);
	useKeyBinding(KEYBINDINGS.DOWN, navigateDown);
	useKeyBinding(KEYBINDINGS.SELECT, handleSelect);

	const sleepTimerLabel =
		isActive && remainingSeconds !== null
			? `Sleep Timer: ${formatTime(remainingSeconds)} remaining (Enter to cancel)`
			: 'Sleep Timer: Off (Enter to set)';

	return (
		<Box flexDirection="column" gap={1}>
			<Box
				borderStyle="double"
				borderColor={theme.colors.secondary}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={theme.colors.primary}>
					Settings
				</Text>
			</Box>

			{/* Stream Quality */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 0 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 0 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 0}
				>
					Stream Quality: {quality.toUpperCase()}
				</Text>
			</Box>

			{/* Audio Normalization */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 1 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 1 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 1}
				>
					Audio Normalization: {audioNormalization ? 'ON' : 'OFF'}
				</Text>
			</Box>

			{/* Notifications */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 2 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 2 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 2}
				>
					Desktop Notifications: {notifications ? 'ON' : 'OFF'}
				</Text>
			</Box>

			{/* Discord Rich Presence */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 3 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 3 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 3}
				>
					Discord Rich Presence: {discordRpc ? 'ON' : 'OFF'}
				</Text>
			</Box>

			{/* Downloads Enabled */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 4 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 4 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 4}
				>
					Download Feature: {downloadsEnabled ? 'ON' : 'OFF'}
				</Text>
			</Box>

			{/* Download Folder */}
			<Box paddingX={1}>
				{isEditingDownloadDirectory && selectedIndex === 5 ? (
					<TextInput
						value={downloadDirectory}
						onChange={setDownloadDirectory}
						onSubmit={value => {
							const normalized = value.trim();
							if (!normalized) {
								setDownloadDirectory(config.get('downloadDirectory') ?? '');
								setIsEditingDownloadDirectory(false);
								return;
							}
							setDownloadDirectory(normalized);
							config.set('downloadDirectory', normalized);
							setIsEditingDownloadDirectory(false);
						}}
						placeholder="Download directory"
						focus
					/>
				) : (
					<Text
						backgroundColor={
							selectedIndex === 5 ? theme.colors.primary : undefined
						}
						color={
							selectedIndex === 5 ? theme.colors.background : theme.colors.text
						}
						bold={selectedIndex === 5}
					>
						Download Folder: {downloadDirectory}
					</Text>
				)}
			</Box>

			{/* Download Format */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 6 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 6 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 6}
				>
					Download Format: {downloadFormat.toUpperCase()}
				</Text>
			</Box>

			{/* Sleep Timer */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 7 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 7
							? theme.colors.background
							: isActive
								? theme.colors.accent
								: theme.colors.text
					}
					bold={selectedIndex === 7}
				>
					{sleepTimerLabel}
				</Text>
			</Box>

			{/* Custom Keybindings */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 8 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 8 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 8}
				>
					Custom Keybindings →
				</Text>
			</Box>

			{/* Manage Plugins */}
			<Box paddingX={1}>
				<Text
					backgroundColor={
						selectedIndex === 9 ? theme.colors.primary : undefined
					}
					color={
						selectedIndex === 9 ? theme.colors.background : theme.colors.text
					}
					bold={selectedIndex === 9}
				>
					Manage Plugins
				</Text>
			</Box>

			{/* Info */}
			<Box marginTop={1}>
				<Text color={theme.colors.dim}>
					Arrows to navigate, Enter to select, Esc/q to go back
				</Text>
			</Box>
		</Box>
	);
}
