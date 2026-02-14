// YouTube Music API wrapper service
import type {
	Track,
	Album,
	Artist,
	Playlist,
	SearchOptions,
	SearchResponse,
} from '../../types/youtube-music.types.ts';
import * as InnertubeModule from 'node-youtube-music';

// Type-safe access to the module
type InnertubeInterface = {
	search: (query: string, options?: {type?: string}) => Promise<unknown[]>;
	getTrack: (videoId: string) => Promise<Track>;
	getAlbum: (albumId: string) => Promise<Album>;
	getArtist: (artistId: string) => Promise<Artist>;
	getPlaylist: (playlistId: string) => Promise<Playlist>;
	getRelated: (trackId: string) => Promise<Track[]>;
	getStreamInfo: (videoId: string) => Promise<{url: string}>;
};

const Innertube = ((InnertubeModule as {default?: InnertubeInterface})
	.default ?? InnertubeModule) as InnertubeInterface;

// Type for API response items
type ApiItem = {type: string} & Record<string, unknown>;

class MusicService {
	private api: InnertubeInterface;

	constructor() {
		this.api = Innertube;
	}

	async search(
		query: string,
		options: SearchOptions = {},
	): Promise<SearchResponse> {
		const result = await this.api.search(query, {
			type: options.type === 'all' ? undefined : options.type,
		});

		const results: SearchResponse['results'] = [];

		// Parse results based on type
		for (const item of result as ApiItem[]) {
			if (item.type === 'song') {
				results.push({type: 'song', data: item as unknown as Track});
			} else if (item.type === 'album') {
				results.push({type: 'album', data: item as unknown as Album});
			} else if (item.type === 'artist') {
				results.push({type: 'artist', data: item as unknown as Artist});
			} else if (item.type === 'playlist') {
				results.push({type: 'playlist', data: item as unknown as Playlist});
			}
		}

		return {
			results,
			hasMore: false,
		};
	}

	async getTrack(videoId: string): Promise<Track> {
		const track = await this.api.getTrack(videoId);
		return track as Track;
	}

	async getAlbum(albumId: string): Promise<Album> {
		const album = await this.api.getAlbum(albumId);
		return album as Album;
	}

	async getArtist(artistId: string): Promise<Artist> {
		const artist = await this.api.getArtist(artistId);
		return artist as Artist;
	}

	async getPlaylist(playlistId: string): Promise<Playlist> {
		const playlist = await this.api.getPlaylist(playlistId);
		return playlist as Playlist;
	}

	async getSuggestions(trackId: string): Promise<Track[]> {
		// Get related songs based on track
		const suggestions = await this.api.getRelated(trackId);
		return suggestions as Track[];
	}

	async getStreamUrl(videoId: string): Promise<string> {
		// Get the actual stream URL for playback
		const info = await this.api.getStreamInfo(videoId);
		return info.url;
	}
}

// Singleton instance
let musicServiceInstance: MusicService | null = null;

export function getMusicService(): MusicService {
	if (!musicServiceInstance) {
		musicServiceInstance = new MusicService();
	}

	return musicServiceInstance;
}
