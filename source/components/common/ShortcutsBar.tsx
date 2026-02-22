// Shortcuts bar component
import {Box, Text} from 'ink';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {useTheme} from '../../hooks/useTheme.ts';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS} from '../../utils/constants.ts';
import {ICONS} from '../../utils/icons.ts';

export default function ShortcutsBar() {
	const {theme} = useTheme();
	const {
		state: playerState,
		pause,
		resume,
		next,
		previous,
		volumeUp,
		volumeDown,
		volumeFineUp,
		volumeFineDown,
		toggleShuffle,
		toggleRepeat,
	} = usePlayer();

	// Register key bindings globally
	const handlePlayPause = () => {
		if (playerState.isPlaying) {
			pause();
		} else {
			resume();
		}
	};

	useKeyBinding(KEYBINDINGS.PLAY_PAUSE, handlePlayPause);
	useKeyBinding(KEYBINDINGS.NEXT, next);
	useKeyBinding(KEYBINDINGS.PREVIOUS, previous);
	useKeyBinding(KEYBINDINGS.VOLUME_UP, volumeUp);
	useKeyBinding(KEYBINDINGS.VOLUME_DOWN, volumeDown);
	useKeyBinding(KEYBINDINGS.VOLUME_FINE_UP, volumeFineUp);
	useKeyBinding(KEYBINDINGS.VOLUME_FINE_DOWN, volumeFineDown);
	useKeyBinding(KEYBINDINGS.SHUFFLE, toggleShuffle);
	useKeyBinding(KEYBINDINGS.REPEAT, toggleRepeat);
	// Note: SETTINGS keybinding handled by MainLayout to avoid double-dispatch

	return (
		<Box
			borderStyle="single"
			borderColor={theme.colors.dim}
			paddingX={1}
			justifyContent="space-between"
		>
			{/* Left: Navigation shortcuts */}
			<Text color={theme.colors.dim}>
				<Text color={theme.colors.text}>
					{ICONS.PLAY_PAUSE_ON}/{ICONS.PAUSE} [Space]
				</Text>{' '}
				| <Text color={theme.colors.text}>{ICONS.PREV} [B/←]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.NEXT} [N/→]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.SHUFFLE} [Shift+S]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.REPEAT_ALL} [R]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.PLAYLIST} [Shift+P]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.DOWNLOAD} [Shift+D]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.SEARCH} [/]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.HELP} [?]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.BG_PLAY} [Shift+Q]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.RESUME} [Shift+R]</Text> |{' '}
				<Text color={theme.colors.text}>{ICONS.QUIT} [Q]</Text>
			</Text>

			{/* Right: Playback mode + volume indicator */}
			<Text color={theme.colors.text}>
				<Text
					color={playerState.shuffle ? theme.colors.primary : theme.colors.dim}
				>
					{ICONS.SHUFFLE}
				</Text>{' '}
				<Text
					color={
						playerState.repeat === 'off'
							? theme.colors.dim
							: theme.colors.secondary
					}
				>
					{playerState.repeat === 'one' ? ICONS.REPEAT_ONE : ICONS.REPEAT_ALL}
				</Text>{' '}
				<Text color={theme.colors.dim}>{ICONS.VOLUME} [=/-]</Text>{' '}
				<Text color={theme.colors.primary}>{playerState.volume}%</Text>
			</Text>
		</Box>
	);
}
