const ADDON_ID      = 'community.stremio-universal-sync';
const ADDON_VERSION = '1.1.0';

function buildCatalogs(config) {
  const catalogs = [];

    if (!config?.options || config.options.showTrending !== false) {
        catalogs.push(
              { type: 'movie',  id: 'trakt:trending', name: 'Trakt Trending Movies', extra: [{ name: 'skip' }] },
                    { type: 'series', id: 'trakt:trending', name: 'Trakt Trending Series', extra: [{ name: 'skip' }] }
                        );
                          }
                            if (!config?.options || config.options.showPopular !== false) {
                                catalogs.push(
                                      { type: 'movie',  id: 'trakt:popular', name: 'Trakt Popular Movies', extra: [{ name: 'skip' }] },
                                            { type: 'series', id: 'trakt:popular', name: 'Trakt Popular Series', extra: [{ name: 'skip' }] }
                                                );
                                                  }

                                                    if (config?.traktAccessToken) {
                                                        catalogs.push(
                                                              { type: 'movie',  id: 'trakt:watchlist', name: 'Trakt Watchlist - Movies', extra: [{ name: 'skip' }] },
                                                                    { type: 'series', id: 'trakt:watchlist', name: 'Trakt Watchlist - Series', extra: [{ name: 'skip' }] }
                                                                        );
                                                                            if (!config?.options || config.options.showRecommendations !== false) {
                                                                                  catalogs.push(
                                                                                          { type: 'movie',  id: 'trakt:recommendations', name: 'Trakt For You - Movies', extra: [{ name: 'skip' }] },
                                                                                                  { type: 'series', id: 'trakt:recommendations', name: 'Trakt For You - Series', extra: [{ name: 'skip' }] }
                                                                                                        );
                                                                                                            }
                                                                                                                for (const list of config?.traktLists || []) {
                                                                                                                      const catalogId = `trakt:list:${list.username}:${list.slug}`;
                                                                                                                            catalogs.push(
                                                                                                                                    { type: 'movie',  id: catalogId, name: `${list.name} - Movies`, extra: [{ name: 'skip' }] },
                                                                                                                                            { type: 'series', id: catalogId, name: `${list.name} - Series`, extra: [{ name: 'skip' }] }
                                                                                                                                                  );
                                                                                                                                                      }
                                                                                                                                                        }
                                                                                                                                                        
                                                                                                                                                          if (config?.imdbUserId) {
                                                                                                                                                              catalogs.push({ type: 'movie', id: 'imdb:watchlist', name: 'IMDb Watchlist', extra: [{ name: 'skip' }] });
                                                                                                                                                                }
                                                                                                                                                                  for (const list of config?.imdbLists || []) {
                                                                                                                                                                      catalogs.push({ type: 'movie', id: `imdb:list:${list.id}`, name: `IMDb - ${list.name}`, extra: [{ name: 'skip' }] });
                                                                                                                                                                        }
                                                                                                                                                                        
                                                                                                                                                                          return catalogs;
                                                                                                                                                                          }
                                                                                                                                                                          
                                                                                                                                                                          function buildManifest(config) {
                                                                                                                                                                            return {
                                                                                                                                                                                id:          ADDON_ID,
                                                                                                                                                                                    version:     ADDON_VERSION,
                                                                                                                                                                                        name:        'My Stremio List Syncer',
                                logo:        'https://ui-avatars.com/api/?name=MS&size=256&background=7b5ea7&color=ffffff&bold=true&format=png',
                                background:  'https://ui-avatars.com/api/?name=MSLS&size=1024&background=1a1a24&color=7b5ea7&bold=true&format=png',
                                                                                                                                                                                            description: 'Bi-directional sync between Stremio, Trakt.tv, and IMDb. Your lists become catalogs. Your history stays in sync.',
                                                                                                                                                                                                resources: [
                                                                                                                                                                                                      'catalog',
                                                                                                                                                                                                            { name: 'meta',   types: ['movie', 'series'], idPrefixes: ['tt'] },
                                                                                                                                                                                                                  { name: 'stream', types: ['movie', 'series'], idPrefixes: ['tt'] },
                                                                                                                                                                                                                      ],
                                                                                                                                                                                                                          types:    ['movie', 'series'],
                                                                                                                                                                                                                              catalogs: buildCatalogs(config),
                                                                                                                                                                                                                                  behaviorHints: {
                                                                                                                                                                                                                                        configurable:           true,
                                                                                                                                                                                                                                              configurationRequired:  !config,
                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                    };
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                    module.exports = { buildManifest, ADDON_ID };
