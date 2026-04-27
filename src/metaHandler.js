const tmdb  = require('./tmdbClient');
const trakt = require('./traktClient');
const { metaCache, historyCache } = require('./cache');

async function buildSeriesMetaWithHistory(imdbId, traktToken, tmdbToken) {
  const baseMeta = await tmdb.getSeriesMeta(imdbId, tmdbToken);
    if (!baseMeta) return null;

      let watchedSeasons = {};
        if (traktToken) {
            try {
                  const histKey = `history:show:${imdbId}`;
                        let watched = historyCache.get(histKey);
                              if (!watched) {
                                      const allWatched = await trakt.getWatchedShows(traktToken);
                                              const showEntry  = allWatched.find(w => w.show?.ids?.imdb === imdbId);
                                                      watched = showEntry?.seasons || [];
                                                              historyCache.set(histKey, watched);
                                                                    }
                                                                          for (const season of watched) {
                                                                                  for (const ep of season.episodes || []) {
                                                                                            watchedSeasons[`${season.number}:${ep.number}`] = true;
                                                                                                    }
                                                                                                          }
                                                                                                              } catch (err) { console.error(`[meta] Failed to fetch Trakt history for ${imdbId}:`, err.message); }
                                                                                                                }
                                                                                                                
                                                                                                                  const videos = [];
                                                                                                                    const numSeasons = baseMeta._numSeasons || 1;
                                                                                                                      for (let s = 1; s <= numSeasons; s++) {
                                                                                                                          const episodes = await tmdb.getSeasonEpisodes(baseMeta._tmdbId, s, tmdbToken);
                                                                                                                              for (const ep of episodes) {
                                                                                                                                    const wasWatched = watchedSeasons[`${s}:${ep.episode}`] || false;
                                                                                                                                          videos.push({
                                                                                                                                                  id: `${imdbId}:${s}:${ep.episode}`, title: ep.title,
                                                                                                                                                          season: s, episode: ep.episode, released: ep.released,
                                                                                                                                                                  thumbnail: ep.thumbnail, overview: ep.overview,
                                                                                                                                                                          available: wasWatched,
                                                                                                                                                                                });
                                                                                                                                                                                    }
                                                                                                                                                                                      }
                                                                                                                                                                                      
                                                                                                                                                                                        const { _tmdbId, _numSeasons, ...cleanMeta } = baseMeta;
                                                                                                                                                                                          return { ...cleanMeta, videos };
                                                                                                                                                                                          }
                                                                                                                                                                                          
                                                                                                                                                                                          async function buildMovieMetaWithHistory(imdbId, traktToken, tmdbToken) {
                                                                                                                                                                                            const baseMeta = await tmdb.getMovieMeta(imdbId, tmdbToken);
                                                                                                                                                                                              if (!baseMeta) return null;
                                                                                                                                                                                              
                                                                                                                                                                                                let watched = false;
                                                                                                                                                                                                  if (traktToken) {
                                                                                                                                                                                                      try {
                                                                                                                                                                                                            const histKey = `history:movie:${imdbId}`;
                                                                                                                                                                                                                  let history = historyCache.get(histKey);
                                                                                                                                                                                                                        if (history === undefined) {
                                                                                                                                                                                                                                const result = await trakt.getMovieHistory(traktToken, imdbId);
                                                                                                                                                                                                                                        history = Array.isArray(result) && result.length > 0;
                                                                                                                                                                                                                                                historyCache.set(histKey, history);
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                            watched = history;
                                                                                                                                                                                                                                                                } catch { watched = false; }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                    return { ...baseMeta, _watched: watched };
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                    async function handleMeta(config, type, id) {
                                                                                                                                                                                                                                                                      const traktToken = config?.traktAccessToken;
                                                                                                                                                                                                                                                                        const tmdbToken  = config?.tmdbBearerToken || process.env.TMDB_BEARER_TOKEN;
                                                                                                                                                                                                                                                                          if (!id.startsWith('tt')) return null;
                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                            const cacheKey = `meta:${traktToken?.slice(-8) || 'anon'}:${type}:${id}`;
                                                                                                                                                                                                                                                                              const cached   = metaCache.get(cacheKey);
                                                                                                                                                                                                                                                                                if (cached) return cached;
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                  let meta = null;
                                                                                                                                                                                                                                                                                    if (type === 'movie') {
                                                                                                                                                                                                                                                                                        meta = await buildMovieMetaWithHistory(id, traktToken, tmdbToken);
                                                                                                                                                                                                                                                                                          } else if (type === 'series') {
                                                                                                                                                                                                                                                                                              meta = await buildSeriesMetaWithHistory(id, traktToken, tmdbToken);
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                  if (meta) metaCache.set(cacheKey, meta, traktToken ? 120 : 600);
                                                                                                                                                                                                                                                                                                    return meta;
                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                    module.exports = { handleMeta };
