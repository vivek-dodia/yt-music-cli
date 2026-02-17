// YouTube Music API wrapper service
import type {
	Track,
	Album,
	Artist,
	Playlist,
	SearchOptions,
	SearchResponse,
	SearchResult,
} from '../../types/youtube-music.types.ts';
import * as YTMusic from 'node-youtube-music';
import {videoInfo, getFormats, type VideoFormat} from 'youtube-ext';
import {getConfigService} from '../config/config.service.ts';

class MusicService {
	async search(
		query: string,
		options: SearchOptions = {},
	): Promise<SearchResponse> {
		const searchType = options.type || 'all';
		const results: SearchResult[] = [];

		if (searchType === 'all' || searchType === 'songs') {
			const songs = await YTMusic.searchMusics(query);
			for (const song of songs) {
				results.push({
					type: 'song',
					data: this.mapMusicVideoToTrack(song),
				});
			}
		}

		if (searchType === 'all' || searchType === 'albums') {
			const albums = await YTMusic.searchAlbums(query);
			for (const album of albums) {
				results.push({
					type: 'album',
					data: this.mapAlbumPreviewToAlbum(album),
				});
			}
		}

		if (searchType === 'all' || searchType === 'artists') {
			const artists = await YTMusic.searchArtists(query);
			for (const artist of artists) {
				results.push({
					type: 'artist',
					data: this.mapArtistPreviewToArtist(artist),
				});
			}
		}

		if (searchType === 'all' || searchType === 'playlists') {
			const playlists = await YTMusic.searchPlaylists(query);
			for (const playlist of playlists) {
				results.push({
					type: 'playlist',
					data: this.mapPlaylistPreviewToPlaylist(playlist),
				});
			}
		}

		return {
			results,
			hasMore: false,
		};
	}

	async getTrack(videoId: string): Promise<Track | null> {
		// node-youtube-music doesn't have getTrack, we can search and find
		// but for playback we usually just need the videoId anyway
		return {
			videoId,
			title: 'Unknown Track',
			artists: [],
		};
	}

	async getAlbum(albumId: string): Promise<Album> {
		const tracks = await YTMusic.listMusicsFromAlbum(albumId);
		return {
			albumId,
			name: 'Unknown Album',
			artists: [],
			tracks: tracks.map(t => this.mapMusicVideoToTrack(t)),
		} as unknown as Album;
	}

	async getArtist(artistId: string): Promise<Artist> {
		const artist = await YTMusic.getArtist(artistId, {
			lang: 'en',
			country: 'US',
		});
		return {
			artistId: artist.artistId || artistId,
			name: artist.name || 'Unknown Artist',
		};
	}

	async getPlaylist(playlistId: string): Promise<Playlist> {
		const tracks = await YTMusic.listMusicsFromPlaylist(playlistId);
		return {
			playlistId,
			name: 'Unknown Playlist',
			tracks: tracks.map(t => this.mapMusicVideoToTrack(t)),
		};
	}

	async getSuggestions(trackId: string): Promise<Track[]> {
		const suggestions = await YTMusic.getSuggestions(trackId);
		return suggestions.map(t => this.mapMusicVideoToTrack(t));
	}

	async getStreamUrl(videoId: string): Promise<string> {
		try {
			const info = await videoInfo(`https://www.youtube.com/watch?v=${videoId}`);
			const formats = await getFormats(info.stream);
			const config = getConfigService();
			const quality = config.get('streamQuality') || 'high';

			// Filter for audio-only streams
			const audioStreams = formats.filter((s: VideoFormat) =>
				s.mimeType?.toLowerCase().includes('audio'),
			);

			if (audioStreams.length === 0) {
				throw new Error('No audio streams found');
			}

			// Sort by bitrate
			audioStreams.sort(
				(a: VideoFormat, b: VideoFormat) => (b.bitrate || 0) - (a.bitrate || 0),
			);

			if (quality === 'high') {
				return audioStreams[0]?.url || '';
			} else if (quality === 'low') {
				return audioStreams[audioStreams.length - 1]?.url || '';
			} else {
				// medium
				const mid = Math.floor(audioStreams.length / 2);
				return audioStreams[mid]?.url || '';
			}
		} catch (error) {
			console.error('Failed to get stream URL:', error);
			return `https://www.youtube.com/watch?v=${videoId}`;
		}
	}

	private mapMusicVideoToTrack(mv: YTMusic.MusicVideo): Track {
		return {
			videoId: mv.youtubeId || '',
			title: mv.title || 'Unknown Title',
			artists:
				mv.artists?.map(a => ({
					artistId: a.id || '',
					name: a.name,
				})) || [],
			album: mv.album
				? {
						albumId: '',
						name: mv.album,
						artists: [],
				  }
				: undefined,
			duration: mv.duration?.totalSeconds,
		};
	}

	private mapAlbumPreviewToAlbum(ap: YTMusic.AlbumPreview): Album {
		return {
			albumId: ap.albumId || '',
			name: ap.title || 'Unknown Album',
			artists: ap.artistId
				? [
						{
							artistId: ap.artistId,
							name: ap.artist || 'Unknown Artist',
						},
				  ]
				: [],
		};
	}

	private mapArtistPreviewToArtist(ap: YTMusic.ArtistPreview): Artist {
		return {
			artistId: ap.artistId || '',
			name: ap.name || 'Unknown Artist',
		};
	}

	private mapPlaylistPreviewToPlaylist(pp: YTMusic.PlaylistPreview): Playlist {
		return {
			playlistId: pp.playlistId || '',
			name: pp.title || 'Unknown Playlist',
			tracks: [],
		};
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
