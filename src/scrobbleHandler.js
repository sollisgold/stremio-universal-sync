const trakt = require('./traktClient');

function parseVideoId(id) {
  if (!id) return null;
    const parts = id.split(':');
      if (parts.length === 1) return { imdbId: parts[0], type: 'movie' };
        if (parts.length === 3 && parts[0].startsWith('tt')) {
            return { imdbId: parts[0], season: parseInt(parts[1], 10), episode: parseInt(parts[2], 10), type: 'series' };
              }
                return null;
                }

                async function fireScrobble(accessToken, parsed, action = 'start', progress = 0) {
                  if (!accessToken || !parsed) return;
                    try {
                        if (parsed.type === 'movie') {
                              await trakt.scrobbleMovie(accessToken, parsed.imdbId, progress, action);
                                    console.log(`[scrobble] ${action} movie ${parsed.imdbId} @ ${progress}%`);
                                        } else {
                                              await trakt.scrobbleEpisode(accessToken, parsed.imdbId, parsed.season, parsed.episode, progress, action);
                                                    console.log(`[scrobble] ${action} ${parsed.imdbId} S${parsed.season}E${parsed.episode} @ ${progress}%`);
                                                        }
                                                          } catch (err) { console.error(`[scrobble] Failed (${action}):`, err.message); }
                                                          }

                                                          async function handleStream(config, type, id) {
                                                            const traktToken = config?.traktAccessToken;
                                                              const parsed     = parseVideoId(id);
                                                                if (traktToken && parsed && id.startsWith('tt')) {
                                                                    fireScrobble(traktToken, parsed, 'start', 1).catch(() => {});
                                                                      }
                                                                        return { streams: [] };
                                                                        }

                                                                        async function handleScrobbleStop(config, id, progress = 95) {
                                                                          const traktToken = config?.traktAccessToken;
                                                                            const parsed     = parseVideoId(id);
                                                                              if (!traktToken || !parsed) return { success: false, error: 'Missing token or invalid ID' };
                                                                                try {
                                                                                    await fireScrobble(traktToken, parsed, 'stop', progress);
                                                                                        return { success: true };
                                                                                          } catch (err) { return { success: false, error: err.message }; }
                                                                                          }

                                                                                          module.exports = { handleStream, handleScrobbleStop, parseVideoId };
