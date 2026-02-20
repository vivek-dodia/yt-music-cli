import {useEffect, useState} from 'react';
import {useWebSocket} from './hooks/useWebSocket';
import {
	usePlayerStore,
	type PlayerStore,
	setExternalDispatch,
} from './hooks/usePlayerState';
import NavigationBar from './components/NavigationBar';
import PlayerControls from './components/PlayerControls';
import ProgressBar from './components/ProgressBar';
import QueueList from './components/QueueList';
import type {
	ServerMessage,
	ClientMessage,
	Artist,
	Track,
	SearchResult,
	Config,
} from './types';

function App() {
	const setState = usePlayerStore((state: PlayerStore) => state.setState);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [_config, setConfig] = useState<Config | null>(null);
	const [currentView, setCurrentView] = useState<
		'player' | 'search' | 'settings'
	>('player');

	// Get player state at top level (not conditionally)
	const currentTrack = usePlayerStore(
		(state: PlayerStore) => state.currentTrack,
	);
	const isPlaying = usePlayerStore((state: PlayerStore) => state.isPlaying);
	const progress = usePlayerStore((state: PlayerStore) => state.progress);
	const duration = usePlayerStore((state: PlayerStore) => state.duration);
	const queue = usePlayerStore((state: PlayerStore) => state.queue);
	const queuePosition = usePlayerStore(
		(state: PlayerStore) => state.queuePosition,
	);
	const shuffle = usePlayerStore((state: PlayerStore) => state.shuffle);
	const repeat = usePlayerStore((state: PlayerStore) => state.repeat);
	const isLoading = usePlayerStore((state: PlayerStore) => state.isLoading);
	const _volume = usePlayerStore((state: PlayerStore) => state.volume);

	const {send, isConnected} = useWebSocket(`ws://${window.location.host}/ws`, {
		onMessage: (message: ServerMessage) => {
			if (message.type === 'state-update' && message.state) {
				setState(message.state);
			} else if (message.type === 'search-results' && message.results) {
				setSearchResults(message.results);
				setCurrentView('search');
			} else if (message.type === 'config-update' && message.config) {
				setConfig(prev => ({...prev, ...message.config}) as Config);
			}
		},
	});

	// Set up external dispatch for the store
	useEffect(() => {
		setExternalDispatch((action: ClientMessage['action']) => {
			if (action) {
				send({type: 'command', action});
			}
		});
	}, [send]);

	// Send command to server
	const sendCommand = (action: ClientMessage['action']) => {
		if (action) {
			send({type: 'command', action});
		}
	};

	// Search functionality
	const handleSearch = (
		query: string,
		searchType: 'all' | 'songs' | 'artists' | 'albums' | 'playlists',
	) => {
		send({type: 'search-request', query, searchType});
	};

	// Config update
	const handleConfigUpdate = (key: string, value: unknown) => {
		send({type: 'config-update', config: {[key]: value} as Partial<Config>});
	};

	return (
		<div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
			<NavigationBar
				isConnected={isConnected}
				currentView={currentView}
				onNavigate={setCurrentView}
			/>

			<main
				style={{
					flex: 1,
					padding: '2rem',
					maxWidth: '1200px',
					margin: '0 auto',
					width: '100%',
				}}
			>
				{currentView === 'player' && (
					<>
						{currentTrack ? (
							<div
								style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}
							>
								<div>
									<h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
										{currentTrack.title}
									</h2>
									<p style={{color: 'var(--color-text-dim)'}}>
										{currentTrack.artists.map((a: Artist) => a.name).join(', ')}
									</p>
								</div>

								<ProgressBar
									progress={progress}
									duration={duration}
									onSeek={position => sendCommand({category: 'SEEK', position})}
								/>

								<PlayerControls
									isPlaying={isPlaying}
									isLoading={isLoading}
									shuffle={shuffle}
									repeat={repeat}
									onPlayPause={() =>
										sendCommand({category: isPlaying ? 'PAUSE' : 'RESUME'})
									}
									onNext={() => sendCommand({category: 'NEXT'})}
									onPrevious={() => sendCommand({category: 'PREVIOUS'})}
									onToggleShuffle={() =>
										sendCommand({category: 'TOGGLE_SHUFFLE'})
									}
									onToggleRepeat={() =>
										sendCommand({category: 'TOGGLE_REPEAT'})
									}
								/>

								<QueueList
									queue={queue}
									queuePosition={queuePosition}
									onSelectTrack={index =>
										sendCommand({
											category: 'SET_QUEUE_POSITION',
											position: index,
										})
									}
									onRemoveTrack={index =>
										sendCommand({category: 'REMOVE_FROM_QUEUE', index})
									}
								/>
							</div>
						) : (
							<div style={{textAlign: 'center', padding: '4rem 0'}}>
								<p style={{color: 'var(--color-text-dim)'}}>
									No track playing. Search for music to get started.
								</p>
								<button
									onClick={() => setCurrentView('search')}
									style={{
										padding: '0.75rem 1.5rem',
										borderRadius: '4px',
										border: 'none',
										background: 'var(--color-primary)',
										color: 'white',
										cursor: 'pointer',
									}}
								>
									Go to Search
								</button>
							</div>
						)}
					</>
				)}

				{currentView === 'search' && (
					<div>
						<h2 style={{marginBottom: '1.5rem'}}>Search</h2>
						<form
							onSubmit={e => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								const query = formData.get('query') as string;
								const searchType = formData.get('type') as
									| 'all'
									| 'songs'
									| 'artists'
									| 'albums'
									| 'playlists';
								if (query.trim()) {
									handleSearch(query, searchType);
								}
							}}
							style={{display: 'flex', gap: '0.5rem', marginBottom: '2rem'}}
						>
							<select
								name="type"
								defaultValue="all"
								style={{
									padding: '0.5rem',
									borderRadius: '4px',
									border: '1px solid var(--color-border)',
									background: 'var(--color-bg-secondary)',
									color: 'var(--color-text)',
								}}
							>
								<option value="all">All</option>
								<option value="songs">Songs</option>
								<option value="artists">Artists</option>
								<option value="albums">Albums</option>
								<option value="playlists">Playlists</option>
							</select>
							<input
								type="text"
								name="query"
								placeholder="Search for music..."
								disabled={!isConnected}
								style={{
									flex: 1,
									padding: '0.5rem',
									borderRadius: '4px',
									border: '1px solid var(--color-border)',
									background: 'var(--color-bg-secondary)',
									color: 'var(--color-text)',
								}}
							/>
							<button
								type="submit"
								disabled={!isConnected}
								style={{
									padding: '0.5rem 1rem',
									borderRadius: '4px',
									border: 'none',
									background: 'var(--color-primary)',
									color: 'white',
									cursor: isConnected ? 'pointer' : 'not-allowed',
									opacity: isConnected ? 1 : 0.5,
								}}
							>
								Search
							</button>
						</form>

						{searchResults.length > 0 ? (
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem',
								}}
							>
								{searchResults.map((result, index) => {
									const item = result.data;
									const key = `${result.type}-${index}`;

									if (result.type === 'song') {
										const track = item as {
											title: string;
											artists: Artist[];
											videoId: string;
										};
										return (
											<div
												key={key}
												style={{
													padding: '0.75rem',
													borderRadius: '4px',
													background: 'var(--color-bg-secondary)',
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
												}}
											>
												<div>
													<div style={{fontWeight: 'bold'}}>{track.title}</div>
													<div
														style={{
															fontSize: '0.875rem',
															color: 'var(--color-text-dim)',
														}}
													>
														{track.artists.map(a => a.name).join(', ')}
													</div>
												</div>
												<button
													onClick={() =>
														sendCommand({
															category: 'PLAY',
															track: track as Track,
														})
													}
													style={{
														padding: '0.5rem 1rem',
														borderRadius: '4px',
														border: 'none',
														background: 'var(--color-primary)',
														color: 'white',
														cursor: 'pointer',
													}}
												>
													Play
												</button>
											</div>
										);
									}
									return null;
								})}
							</div>
						) : (
							<p style={{color: 'var(--color-text-dim)', textAlign: 'center'}}>
								No results yet. Search for something above!
							</p>
						)}
					</div>
				)}

				{currentView === 'settings' && (
					<div>
						<h2 style={{marginBottom: '1.5rem'}}>Settings</h2>
						<div
							style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}
						>
							<div>
								<label
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 'bold',
									}}
								>
									Volume: {_volume}%
								</label>
								<input
									type="range"
									min="0"
									max="100"
									defaultValue={_volume}
									onChange={e =>
										handleConfigUpdate('volume', parseInt(e.target.value))
									}
									disabled={!isConnected}
									style={{width: '100%'}}
								/>
							</div>

							<div>
								<label
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 'bold',
									}}
								>
									Repeat Mode
								</label>
								<select
									value={repeat}
									onChange={() => sendCommand({category: 'TOGGLE_REPEAT'})}
									disabled={!isConnected}
									style={{
										padding: '0.5rem',
										borderRadius: '4px',
										border: '1px solid var(--color-border)',
										background: 'var(--color-bg-secondary)',
										color: 'var(--color-text)',
									}}
								>
									<option value="off">Off</option>
									<option value="all">All</option>
									<option value="one">One</option>
								</select>
							</div>

							<div>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										cursor: 'pointer',
									}}
								>
									<input
										type="checkbox"
										checked={shuffle}
										onChange={() => sendCommand({category: 'TOGGLE_SHUFFLE'})}
										disabled={!isConnected}
									/>
									<span>Shuffle</span>
								</label>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default App;
