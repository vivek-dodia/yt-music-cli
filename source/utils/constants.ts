// Application constants
export const APP_NAME = '@involvex/youtube-music-cli';
export const APP_VERSION = '0.0.20';

// Config directory
export const CONFIG_DIR =
	process.platform === 'win32'
		? `${process.env['USERPROFILE']}\\.youtube-music-cli`
		: `${process.env['HOME']}/.youtube-music-cli`;

export const CONFIG_FILE = `${CONFIG_DIR}/config.json`;

// View types
export const VIEW = {
	PLAYER: 'player',
	SEARCH: 'search',
	SEARCH_HISTORY: 'search_history',
	PLAYLISTS: 'playlists',
	ARTIST: 'artist',
	ALBUM: 'album',
	HELP: 'help',
	SUGGESTIONS: 'suggestions',
	SETTINGS: 'settings',
	CONFIG: 'config',
	PLUGINS: 'plugins',
	LYRICS: 'lyrics',
	KEYBINDINGS: 'keybindings',
	TRENDING: 'trending',
	EXPLORE: 'explore',
	IMPORT: 'import',
	EXPORT_PLAYLISTS: 'export_playlists',
} as const;

// Search types
export const SEARCH_TYPE = {
	ALL: 'all',
	SONGS: 'songs',
	ALBUMS: 'albums',
	ARTISTS: 'artists',
	PLAYLISTS: 'playlists',
} as const;

// Keybindings
export const KEYBINDINGS = {
	// Global
	QUIT: ['q'],
	HELP: ['?'],
	SEARCH: ['/'],
	PLAYLISTS: ['shift+p'],
	SUGGESTIONS: ['g'],
	SETTINGS: [','],
	PLUGINS: ['p'],
	DETACH: ['shift+q'],
	RESUME_BACKGROUND: ['shift+r'],

	// Player
	PLAY_PAUSE: [' '],
	NEXT: ['n', 'right'],
	PREVIOUS: ['b', 'left'],
	VOLUME_UP: ['=', '+'], // '=' (no shift) or '+' (shift+=) both trigger volume up
	VOLUME_DOWN: ['-'], // '-' triggers volume down
	VOLUME_FINE_UP: ['ctrl+='], // Fine-grained +1 step (Ctrl+= to avoid conflict with '+')
	VOLUME_FINE_DOWN: ['shift+-'], // Fine-grained -1 step
	SHUFFLE: ['shift+s'],
	REPEAT: ['r'],
	GAPLESS_TOGGLE: ['shift+g'],
	CROSSFADE_CYCLE: ['shift+c'],
	EQUALIZER_CYCLE: ['shift+e'],
	SEEK_FORWARD: ['shift+right'],
	SEEK_BACKWARD: ['shift+left'],
	SPEED_UP: ['>'],
	SPEED_DOWN: ['<'],

	// Navigation
	UP: ['up', 'k'],
	DOWN: ['down', 'j'],
	SELECT: ['enter', 'return'],
	BACK: ['escape'],

	// Search
	CLEAR_SEARCH: ['escape'],
	NEXT_RESULT: ['tab'],
	PREV_RESULT: ['shift+tab'],
	INCREASE_RESULTS: [']'],
	DECREASE_RESULTS: ['['],
	SEARCH_FILTER_ARTIST: ['ctrl+a'],
	SEARCH_FILTER_ALBUM: ['ctrl+l'],
	SEARCH_FILTER_YEAR: ['ctrl+y'],
	SEARCH_FILTER_DURATION: ['ctrl+d'],

	// Playlist
	ADD_TO_PLAYLIST: ['a'],
	REMOVE_FROM_PLAYLIST: ['d'],
	CREATE_PLAYLIST: ['c'],
	CREATE_MIX: ['m'],
	DELETE_PLAYLIST: ['D'],
	DOWNLOAD: ['shift+d'],
} as const;

// Default volume
export const DEFAULT_VOLUME = 70;

// Queue limits
export const MAX_QUEUE_SIZE = 1000;

// Themes
export const THEMES = {
	DARK: 'dark',
	LIGHT: 'light',
	MIDNIGHT: 'midnight',
	MATRIX: 'matrix',
	CUSTOM: 'custom',
} as const;

// Update intervals
export const PROGRESS_UPDATE_INTERVAL = 100; // ms
export const STATUS_UPDATE_INTERVAL = 1000; // ms

// Default theme
export const DEFAULT_THEME = 'dark' as const;
