import {usePlayer} from '../../hooks/usePlayer.ts';
import NowPlaying from '../player/NowPlaying.tsx';
import ProgressBar from '../player/ProgressBar.tsx';
import QueueList from '../player/QueueList.tsx';
import {Box} from 'ink';

export default function PlayerLayout() {
	const {state: playerState} = usePlayer();

	return (
		<Box flexDirection="column" gap={1}>
			<NowPlaying />

			<ProgressBar />

			{playerState.queue.length > 0 && <QueueList />}
		</Box>
	);
}
