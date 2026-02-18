// Shortcuts bar component
import {Box, Text} from 'ink';
import {useCallback} from 'react';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {useNavigation} from '../../hooks/useNavigation.ts';
import {useTheme} from '../../hooks/useTheme.ts';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS} from '../../utils/constants.ts';

export default function ShortcutsBar() {
	const {theme} = useTheme();
	const {dispatch: navDispatch} = useNavigation();
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
	} = usePlayer();

	// Register key bindings globally
	const handlePlayPause = () => {
		if (playerState.isPlaying) {
			pause();
		} else {
			resume();
		}
	};

	const goConfig = useCallback(() => {
		navDispatch({category: 'NAVIGATE', view: 'config'});
	}, [navDispatch]);

	useKeyBinding(KEYBINDINGS.PLAY_PAUSE, handlePlayPause);
	useKeyBinding(KEYBINDINGS.NEXT, next);
	useKeyBinding(KEYBINDINGS.PREVIOUS, previous);
	useKeyBinding(KEYBINDINGS.VOLUME_UP, volumeUp);
	useKeyBinding(KEYBINDINGS.VOLUME_DOWN, volumeDown);
	useKeyBinding(KEYBINDINGS.VOLUME_FINE_UP, volumeFineUp);
	useKeyBinding(KEYBINDINGS.VOLUME_FINE_DOWN, volumeFineDown);
	useKeyBinding(KEYBINDINGS.SETTINGS, goConfig);

	return (
		<Box
			borderStyle="single"
			borderColor={theme.colors.dim}
			paddingX={1}
			justifyContent="space-between"
		>
			{/* Left: Navigation shortcuts */}
			<Text color={theme.colors.dim}>
				Shortcuts: <Text color={theme.colors.text}>Space</Text> Play/Pause |{' '}
				<Text color={theme.colors.text}>n</Text> Next |{' '}
				<Text color={theme.colors.text}>p</Text> Previous |{' '}
				<Text color={theme.colors.text}>/</Text> Search |{' '}
				<Text color={theme.colors.text}>,</Text> Settings |{' '}
				<Text color={theme.colors.text}>?</Text> Help |{' '}
				<Text color={theme.colors.text}>q</Text> Quit
			</Text>

			{/* Right: Volume indicator */}
			<Text color={theme.colors.text}>
				<Text color={theme.colors.dim}>[=/</Text>-
				<Text color={theme.colors.dim}>]</Text> Vol:{' '}
				<Text color={theme.colors.primary}>{playerState.volume}%</Text>
			</Text>
		</Box>
	);
}
