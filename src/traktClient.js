const axios = require('axios');
const TRAKT_BASE    = 'https://api.trakt.tv';
const CLIENT_ID     = process.env.TRAKT_CLIENT_ID;
const CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;

function buildHeaders(accessToken) {
  return {
      'Content-Type': 'application/json',
          'trakt-api-version': '2',
              'trakt-api-key': CLIENT_ID,
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    };
                    }

                    async function exchangeCode(code, redirectUri) {
                      const { data } = await axios.post(`${TRAKT_BASE}/oauth/token`, {
                          code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
                              redirect_uri: redirectUri, grant_type: 'authorization_code',
                                });
                                  return data;
                                  }

                                  async function refreshToken(refreshTokenStr, redirectUri) {
                                    const { data } = await axios.post(`${TRAKT_BASE}/oauth/token`, {
                                        refresh_token: refreshTokenStr, client_id: CLIENT_ID,
                                            client_secret: CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'refresh_token',
                                              });
                                                return data;
                                                }

                                                async function getUserProfile(accessToken) {
                                                  const { data } = await axios.get(`${TRAKT_BASE}/users/me`, { headers: buildHeaders(accessToken) });
                                                    return data;
                                                    }

                                                    async function getWatchlist(accessToken, type = '') {
                                                      const url = type ? `${TRAKT_BASE}/users/me/watchlist/${type}` : `${TRAKT_BASE}/users/me/watchlist`;
                                                        const { data } = await axios.get(url, { headers: buildHeaders(accessToken), params: { limit: 1000 } });
                                                          return data;
                                                          }

                                                          async function getCustomList(accessToken, username, listSlug, type = '') {
                                                            const url = type
                                                                ? `${TRAKT_BASE}/users/${username}/lists/${listSlug}/items/${type}`
                                                                    : `${TRAKT_BASE}/users/${username}/lists/${listSlug}/items`;
                                                                      const { data } = await axios.get(url, { headers: buildHeaders(accessToken), params: { limit: 1000 } });
                                                                        return data;
                                                                        }

                                                                        async function getUserLists(accessToken) {
                                                                          const { data } = await axios.get(`${TRAKT_BASE}/users/me/lists`, { headers: buildHeaders(accessToken) });
                                                                            return data;
                                                                            }

                                                                            async function getTrending(type = 'movies', limit = 50) {
                                                                              const { data } = await axios.get(`${TRAKT_BASE}/${type}/trending`, {
                                                                                  headers: buildHeaders(null), params: { limit },
                                                                                    });
                                                                                      return data;
                                                                                      }

                                                                                      async function getPopular(type = 'movies', limit = 50) {
                                                                                        const { data } = await axios.get(`${TRAKT_BASE}/${type}/popular`, {
                                                                                            headers: buildHeaders(null), params: { limit },
                                                                                              });
                                                                                                return data;
                                                                                                }

                                                                                                async function getRecommendations(accessToken, type = 'movies', limit = 50) {
                                                                                                  const { data } = await axios.get(`${TRAKT_BASE}/recommendations/${type}`, {
                                                                                                      headers: buildHeaders(accessToken), params: { limit },
                                                                                                        });
                                                                                                          return data;
                                                                                                          }
                                                                                                          
                                                                                                          async function getWatchedMovies(accessToken) {
                                                                                                            const { data } = await axios.get(`${TRAKT_BASE}/users/me/watched/movies`, { headers: buildHeaders(accessToken) });
                                                                                                              return data;
                                                                                                              }
                                                                                                              
                                                                                                              async function getWatchedShows(accessToken) {
                                                                                                                const { data } = await axios.get(`${TRAKT_BASE}/users/me/watched/shows`, { headers: buildHeaders(accessToken) });
                                                                                                                  return data;
                                                                                                                  }
                                                                                                                  
                                                                                                                  async function getMovieHistory(accessToken, imdbId) {
                                                                                                                    const { data } = await axios.get(`${TRAKT_BASE}/users/me/history/movies/${imdbId}`, { headers: buildHeaders(accessToken) });
                                                                                                                      return data;
                                                                                                                      }
                                                                                                                      
                                                                                                                      async function getEpisodeHistory(accessToken, imdbId, season, episode) {
                                                                                                                        try {
                                                                                                                            const { data } = await axios.get(
                                                                                                                                  `${TRAKT_BASE}/users/me/history/shows/${imdbId}/seasons/${season}/episodes/${episode}`,
                                                                                                                                        { headers: buildHeaders(accessToken) }
                                                                                                                                            );
                                                                                                                                                return data;
                                                                                                                                                  } catch { return []; }
                                                                                                                                                  }
                                                                                                                                                  
                                                                                                                                                  async function scrobbleMovie(accessToken, imdbId, progress = 100, action = 'stop') {
                                                                                                                                                    const { data } = await axios.post(`${TRAKT_BASE}/scrobble/${action}`,
                                                                                                                                                        { movie: { ids: { imdb: imdbId } }, progress },
                                                                                                                                                            { headers: buildHeaders(accessToken) }
                                                                                                                                                              );
                                                                                                                                                                return data;
                                                                                                                                                                }
                                                                                                                                                                
                                                                                                                                                                async function scrobbleEpisode(accessToken, imdbId, season, episode, progress = 100, action = 'stop') {
                                                                                                                                                                  const { data } = await axios.post(`${TRAKT_BASE}/scrobble/${action}`,
                                                                                                                                                                      { show: { ids: { imdb: imdbId } }, episode: { season, number: episode }, progress },
                                                                                                                                                                          { headers: buildHeaders(accessToken) }
                                                                                                                                                                            );
                                                                                                                                                                              return data;
                                                                                                                                                                              }
                                                                                                                                                                              
                                                                                                                                                                              async function markAsWatched(accessToken, type, imdbId, extras = {}) {
                                                                                                                                                                                const body = type === 'movie'
                                                                                                                                                                                    ? { movies: [{ ids: { imdb: imdbId }, watched_at: new Date().toISOString() }] }
                                                                                                                                                                                        : { shows: [{ ids: { imdb: imdbId }, seasons: [{ number: extras.season, episodes: [{ number: extras.episode, watched_at: new Date().toISOString() }] }] }] };
                                                                                                                                                                                          const { data } = await axios.post(`${TRAKT_BASE}/sync/history`, body, { headers: buildHeaders(accessToken) });
                                                                                                                                                                                            return data;
                                                                                                                                                                                            }
                                                                                                                                                                                            
                                                                                                                                                                                            module.exports = {
                                                                                                                                                                                              exchangeCode, refreshToken, getUserProfile, getWatchlist, getCustomList,
                                                                                                                                                                                                getUserLists, getTrending, getPopular, getRecommendations,
                                                                                                                                                                                                  getWatchedMovies, getWatchedShows, getMovieHistory, getEpisodeHistory,
                                                                                                                                                                                                    scrobbleMovie, scrobbleEpisode, markAsWatched,
                                                                                                                                                                                                    };
