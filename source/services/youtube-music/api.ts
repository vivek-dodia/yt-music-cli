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
import type {
	VideoSearchResult,
	PlaylistSearchResult,
	ChannelSearchResult,
	SearchResponse as YoutubeiSearchResponse,
	VideoInfo,
} from '../../types/youtubei.types.ts';
import {Innertube} from 'youtubei.js';
import {logger} from '../logger/logger.service.ts';
import {getSearchCache} from '../cache/cache.service.ts';

// Initialize YouTube client
let ytClient: Innertube | null = null;

async function getClient() {
	if (!ytClient) {
		ytClient = await Innertube.create();
	}
	return ytClient;
}

class MusicService {
	private readonly searchCache = getSearchCache();

	async search(
		query: string,
		options: SearchOptions = {},
	): Promise<SearchResponse> {
		const searchType = options.type || 'all';
		const cacheKey = `search:${searchType}:${options.limit ?? 20}:${query}`;

		// Return cached result if available
		const cached = this.searchCache.get(cacheKey) as SearchResponse | null;
		if (cached) {
			logger.debug('MusicService', 'Returning cached search results', {
				query,
				resultCount: cached.results.length,
			});
			return cached;
		}

		const results: SearchResult[] = [];

		try {
			const yt = await getClient();
			const search = (await yt.search(
				query,
			)) as unknown as YoutubeiSearchResponse;

			// Process search results based on type
			if (searchType === 'all' || searchType === 'songs') {
				const videos = search.videos as VideoSearchResult[] | undefined;
				if (videos) {
					for (const video of videos) {
						if (video.type === 'Video' || video.id) {
							results.push({
								type: 'song',
								data: {
									videoId: video.id || video.video_id || '',
									title:
										(typeof video.title === 'string'
											? video.title
											: video.title?.text) || 'Unknown',
									artists: [
										{
											artistId: video.channel_id || video.channel?.id || '',
											name:
												(typeof video.author === 'string'
													? video.author
													: video.author?.name) || 'Unknown',
										},
									],
									duration:
										(typeof video.duration === 'number'
											? video.duration
											: video.duration?.seconds) || 0,
								},
							});
						}
					}
				}
			}

			if (searchType === 'all' || searchType === 'playlists') {
				const playlists = search.playlists as
					| PlaylistSearchResult[]
					| undefined;
				if (playlists) {
					for (const playlist of playlists) {
						results.push({
							type: 'playlist',
							data: {
								playlistId: playlist.id || '',
								name:
									(typeof playlist.title === 'string'
										? playlist.title
										: playlist.title?.text) || 'Unknown Playlist',
								tracks: [],
							},
						});
					}
				}
			}

			if (searchType === 'all' || searchType === 'artists') {
				const channels = search.channels as ChannelSearchResult[] | undefined;
				if (channels) {
					for (const channel of channels) {
						results.push({
							type: 'artist',
							data: {
								artistId: channel.id || channel.channelId || '',
								name:
									(typeof channel.author === 'string'
										? channel.author
										: channel.author?.name) || 'Unknown Artist',
							},
						});
					}
				}
			}
		} catch (error) {
			console.error('Search failed:', error);
		}

		const response: SearchResponse = {
			results,
			hasMore: false,
		};

		// Cache the result
		this.searchCache.set(cacheKey, response as unknown);

		return response;
	}

	async getTrack(videoId: string): Promise<Track | null> {
		return {
			videoId,
			title: 'Unknown Track',
			artists: [],
		};
	}

	async getAlbum(albumId: string): Promise<Album> {
		return {
			albumId,
			name: 'Unknown Album',
			artists: [],
			tracks: [],
		} as unknown as Album;
	}

	async getArtist(artistId: string): Promise<Artist> {
		return {
			artistId,
			name: 'Unknown Artist',
		};
	}

	async getPlaylist(playlistId: string): Promise<Playlist> {
		try {
			const yt = await getClient();
			const playlistData = (await yt.music.getPlaylist(playlistId)) as {
				title?: string;
				name?: string;
				contents?: Array<{
					id?: string;
					video_id?: string;
					title?: string | {text?: string};
					artists?: Array<{name?: string; channel_id?: string; id?: string}>;
					duration?: number | {seconds?: number};
				}>;
				tracks?: Array<{
					id?: string;
					video_id?: string;
					title?: string | {text?: string};
					artists?: Array<{name?: string; channel_id?: string; id?: string}>;
					duration?: number | {seconds?: number};
				}>;
			};

			const rows = [
				...(playlistData.contents ?? []),
				...(playlistData.tracks ?? []),
			];
			const seen = new Set<string>();
			const tracks: Track[] = [];

			for (const row of rows) {
				const videoId = row.id || row.video_id;
				if (!videoId || seen.has(videoId)) continue;
				seen.add(videoId);
				tracks.push({
					videoId,
					title:
						(typeof row.title === 'string' ? row.title : row.title?.text) ??
						'Unknown',
					artists: (row.artists ?? []).map(artist => ({
						artistId: artist.channel_id || artist.id || '',
						name: artist.name ?? 'Unknown',
					})),
					duration:
						typeof row.duration === 'number'
							? row.duration
							: (row.duration?.seconds ?? 0),
				});
			}

			return {
				playlistId,
				name: playlistData.title || playlistData.name || 'Unknown Playlist',
				tracks,
			};
		} catch (error) {
			logger.error('MusicService', 'getPlaylist failed', {
				playlistId,
				error: error instanceof Error ? error.message : String(error),
			});
			return {
				playlistId,
				name: 'Unknown Playlist',
				tracks: [],
			};
		}
	}

	async getTrending(): Promise<Track[]> {
		try {
			const yt = await getClient();
			const trending = (await yt.getTrending()) as unknown as {
				sections?: Array<{
					items?: Array<{
						id?: string;
						video_id?: string;
						title?: string | {text?: string};
						author?: string | {name?: string};
						duration?: number | {seconds?: number};
					}>;
				}>;
			};

			const tracks: Track[] = [];
			const sections = trending.sections ?? [];
			for (const section of sections) {
				for (const item of section.items ?? []) {
					const videoId = item.id || item.video_id;
					if (!videoId) continue;
					tracks.push({
						videoId,
						title:
							(typeof item.title === 'string'
								? item.title
								: item.title?.text) ?? 'Unknown',
						artists: [
							{
								artistId: '',
								name:
									(typeof item.author === 'string'
										? item.author
										: item.author?.name) ?? 'Unknown',
							},
						],
						duration:
							(typeof item.duration === 'number'
								? item.duration
								: item.duration?.seconds) ?? 0,
					});
				}
			}

			return tracks.slice(0, 25);
		} catch (error) {
			logger.error('MusicService', 'getTrending failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	async getExploreSections(): Promise<Array<{title: string; tracks: Track[]}>> {
		try {
			const yt = await getClient();
			const music = yt.music;
			const explore = (await music.getExplore()) as unknown as {
				sections?: Array<{
					header?: {title?: string | {text?: string}};
					contents?: Array<{
						id?: string;
						video_id?: string;
						title?: string | {text?: string};
						author?: string | {name?: string};
						duration?: number | {seconds?: number};
					}>;
				}>;
			};

			const result: Array<{title: string; tracks: Track[]}> = [];
			for (const section of explore.sections ?? []) {
				const title =
					(typeof section.header?.title === 'string'
						? section.header.title
						: section.header?.title?.text) ?? 'Featured';
				const tracks: Track[] = [];

				for (const item of section.contents ?? []) {
					const videoId = item.id || item.video_id;
					if (!videoId) continue;
					tracks.push({
						videoId,
						title:
							(typeof item.title === 'string'
								? item.title
								: item.title?.text) ?? 'Unknown',
						artists: [
							{
								artistId: '',
								name:
									(typeof item.author === 'string'
										? item.author
										: item.author?.name) ?? 'Unknown',
							},
						],
						duration:
							(typeof item.duration === 'number'
								? item.duration
								: item.duration?.seconds) ?? 0,
					});
				}

				if (tracks.length > 0) {
					result.push({title, tracks: tracks.slice(0, 10)});
				}
			}

			return result;
		} catch (error) {
			logger.error('MusicService', 'getExploreSections failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	async getSuggestions(trackId: string): Promise<Track[]> {
		try {
			const yt = await getClient();

			// Use music.getUpNext with automix — avoids the yt.getInfo() ParsingError
			// caused by YouTube "Remove ads" menu items that youtubei.js can't parse.
			const panel = await yt.music.getUpNext(trackId, true);

			const tracks: Track[] = [];

			for (const item of panel.contents) {
				const video = item as unknown as {
					video_id?: string;
					title?: string | {text?: string};
					artists?: Array<{name?: string; channel_id?: string}>;
					duration?: {seconds?: number};
				};

				const videoId = video.video_id;
				if (!videoId || videoId === trackId) continue;

				const title =
					typeof video.title === 'string'
						? video.title
						: (video.title?.text ?? '');
				if (!title) continue;

				tracks.push({
					videoId,
					title,
					artists: (video.artists ?? []).map(a => ({
						artistId: a.channel_id ?? '',
						name: a.name ?? 'Unknown',
					})),
					duration: video.duration?.seconds ?? 0,
				});
			}

			logger.debug('MusicService', 'getSuggestions success', {
				trackId,
				count: tracks.length,
			});

			return tracks.slice(0, 15);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.warn('MusicService', 'getSuggestions failed', {error: message});
			return [];
		}
	}

	async getStreamUrl(videoId: string): Promise<string> {
		logger.info('MusicService', 'Starting stream extraction', {videoId});

		// Try Method 1: @distube/ytdl-core (most reliable, actively maintained)
		try {
			logger.debug('MusicService', 'Attempting ytdl-core extraction', {
				videoId,
			});
			const ytdl = await import('@distube/ytdl-core');
			const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

			const info = await ytdl.default.getInfo(videoUrl);
			logger.debug('MusicService', 'ytdl-core getInfo succeeded', {
				formatCount: info.formats.length,
			});

			const audioFormats = ytdl.default.filterFormats(
				info.formats,
				'audioonly',
			);
			logger.debug('MusicService', 'ytdl-core audio formats filtered', {
				audioFormatCount: audioFormats.length,
			});

			if (audioFormats.length > 0) {
				// Get highest quality audio
				const bestAudio = audioFormats.sort((a, b) => {
					const aBitrate = Number.parseInt(String(a.audioBitrate || 0));
					const bBitrate = Number.parseInt(String(b.audioBitrate || 0));
					return bBitrate - aBitrate;
				})[0];

				if (bestAudio?.url) {
					logger.info('MusicService', 'Using ytdl-core stream', {
						bitrate: bestAudio.audioBitrate,
						urlLength: bestAudio.url.length,
						mimeType: bestAudio.mimeType,
					});
					return bestAudio.url;
				}
			}

			logger.warn('MusicService', 'ytdl-core: No audio formats with URL found');
		} catch (error) {
			logger.error('MusicService', 'ytdl-core extraction failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
		}

		// Try Method 2: youtubei.js (may fail with ParsingError)
		try {
			logger.debug('MusicService', 'Attempting youtubei.js extraction', {
				videoId,
			});
			const yt = await getClient();
			const video = (await yt.getInfo(videoId)) as unknown as VideoInfo;
			logger.debug('MusicService', 'youtubei.js getInfo succeeded');

			// Get the download URL for the video
			const streamData = video.chooseFormat?.({
				type: 'audio',
				quality: 'best',
			});

			if (streamData?.url) {
				logger.info('MusicService', 'Using youtubei.js stream (chooseFormat)', {
					urlLength: streamData.url.length,
				});
				return streamData.url;
			}

			// Fallback: Manually select from streaming_data.adaptive_formats
			logger.debug(
				'MusicService',
				'chooseFormat returned nothing, trying manual selection',
			);

			type StreamFormat = {
				mime_type?: string;
				type?: string;
				bitrate?: number | string;
				url?: string;
				signature_cipher?: string;
				signatureCipher?: string;
			};

			const streamingData = (
				video as {streaming_data?: {adaptive_formats?: StreamFormat[]}}
			).streaming_data;
			if (streamingData?.adaptive_formats) {
				logger.debug('MusicService', 'Found adaptive_formats', {
					count: streamingData.adaptive_formats.length,
				});

				// Filter for audio-only formats
				const audioFormats = streamingData.adaptive_formats.filter(
					(f: StreamFormat) =>
						f.mime_type?.includes('audio') || f.type?.includes('audio'),
				);

				logger.debug('MusicService', 'Audio formats found', {
					count: audioFormats.length,
				});

				if (audioFormats.length > 0) {
					// Sort by bitrate (higher is better)
					const sorted = audioFormats.sort(
						(a: StreamFormat, b: StreamFormat) => {
							const aBitrate = Number.parseInt(String(a.bitrate || 0));
							const bBitrate = Number.parseInt(String(b.bitrate || 0));
							return bBitrate - aBitrate;
						},
					);

					const bestAudio = sorted[0];

					if (bestAudio) {
						// Check for direct URL
						if (bestAudio.url) {
							logger.info('MusicService', 'Using youtubei.js stream (manual)', {
								bitrate: bestAudio.bitrate,
								mimeType: bestAudio.mime_type || bestAudio.type,
								urlLength: bestAudio.url.length,
							});
							return bestAudio.url;
						}

						// Check for signatureCipher (needs decoding)
						if (bestAudio.signature_cipher || bestAudio.signatureCipher) {
							logger.warn(
								'MusicService',
								'Format has signature cipher (not supported)',
								{
									hasCipher: true,
								},
							);
						}
					}
				}
			}

			logger.warn('MusicService', 'youtubei.js: No usable stream URL found');
		} catch (error) {
			if (error instanceof Error && error.message.includes('ParsingError')) {
				logger.warn('MusicService', 'youtubei.js parsing error (expected)', {
					error: error.message,
				});
			} else {
				logger.error('MusicService', 'youtubei.js extraction failed', {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
		}

		// Try Method 3: youtube-ext (lightweight, no parsing needed)
		try {
			logger.debug('MusicService', 'Attempting youtube-ext extraction', {
				videoId,
			});
			const {videoInfo, getFormats} = await import('youtube-ext');
			const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
			const info = await videoInfo(videoUrl);
			logger.debug('MusicService', 'youtube-ext videoInfo succeeded');

			// Decode stream URLs first
			const decodedFormats = await getFormats(info.stream);
			logger.debug('MusicService', 'youtube-ext formats decoded', {
				formatCount: decodedFormats.length,
			});

			// Get best audio format from decoded adaptive formats
			const audioFormats = decodedFormats.filter(
				f => f.mimeType?.includes('audio') && f.url,
			);
			logger.debug('MusicService', 'youtube-ext audio formats filtered', {
				audioFormatCount: audioFormats.length,
			});

			if (audioFormats.length > 0) {
				// Sort by bitrate descending and get best quality
				const bestAudio = audioFormats.sort(
					(a, b) => (b.bitrate || 0) - (a.bitrate || 0),
				)[0];
				if (bestAudio?.url) {
					logger.info('MusicService', 'Using youtube-ext stream', {
						bitrate: bestAudio.bitrate,
						urlLength: bestAudio.url.length,
					});
					return bestAudio.url;
				}
			}

			logger.warn(
				'MusicService',
				'youtube-ext: No audio formats with URL found',
			);
		} catch (error) {
			logger.error('MusicService', 'youtube-ext extraction failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
		}

		// Try Method 4: Invidious API (last resort)
		try {
			logger.debug('MusicService', 'Attempting Invidious extraction', {
				videoId,
			});
			const url = await this.getInvidiousStreamUrl(videoId);
			logger.info('MusicService', 'Using Invidious stream', {
				urlLength: url.length,
			});
			return url;
		} catch (error) {
			logger.error('MusicService', 'Invidious extraction failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
		}

		// All methods failed
		logger.error('MusicService', 'All stream extraction methods failed', {
			videoId,
		});
		throw new Error('All stream extraction methods failed');
	}

	private async getInvidiousStreamUrl(videoId: string): Promise<string> {
		// Try multiple Invidious instances as fallback
		const instances = [
			'https://vid.puffyan.us',
			'https://invidious.perennialte.ch',
			'https://yewtu.be',
		];

		for (const instance of instances) {
			try {
				logger.debug('MusicService', 'Trying Invidious instance', {instance});
				const response = await fetch(`${instance}/api/v1/videos/${videoId}`);

				if (!response.ok) {
					logger.debug('MusicService', 'Invidious instance returned non-OK', {
						instance,
						status: response.status,
					});
					continue;
				}

				const videoData = (await response.json()) as {
					adaptiveFormats?: Array<{url?: string; type?: string}>;
					formatStreams?: Array<{url?: string; type?: string}>;
				};

				// Look for audio-only streams
				const audioFormats = [
					...(videoData.adaptiveFormats || []),
					...(videoData.formatStreams || []),
				].filter(f => f.type?.toLowerCase().includes('audio'));

				logger.debug('MusicService', 'Invidious audio formats found', {
					instance,
					count: audioFormats.length,
				});

				if (audioFormats.length > 0) {
					const firstAudio = audioFormats[0];
					if (firstAudio?.url) {
						logger.debug('MusicService', 'Invidious stream URL obtained', {
							instance,
							urlLength: firstAudio.url.length,
							type: firstAudio.type,
						});
						return firstAudio.url;
					}
				}
			} catch (error) {
				logger.debug('MusicService', 'Invidious instance error', {
					instance,
					error: error instanceof Error ? error.message : String(error),
				});
				// Try next instance
				continue;
			}
		}

		// If all Invidious instances fail, throw error instead of returning watch URL
		throw new Error('No Invidious instance returned a valid stream URL');
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
