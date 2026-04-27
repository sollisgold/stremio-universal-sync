const ADDON_ID = 'community.stremio-universal-sync';
const ADDON_VERSION = '1.5.0';

function buildCatalogs(config) {
      const catalogs = [];

  if (!config?.options || config.options.showTrending !== false) {
          catalogs.push(
              { type: 'movie', id: 'trakt:trending', name: 'Trakt Trending Movies', extra: [{ name: 'skip' }] },
              { type: 'series', id: 'trakt:trending', name: 'Trakt Trending Series', extra: [{ name: 'skip' }] }
                  );
  }
      if (!config?.options || config.options.showPopular !== false) {
              catalogs.push(
                  { type: 'movie', id: 'trakt:popular', name: 'Trakt Popular Movies', extra: [{ name: 'skip' }] },
                  { type: 'series', id: 'trakt:popular', name: 'Trakt Popular Series', extra: [{ name: 'skip' }] }
                      );
      }

  if (config?.traktAccessToken) {
          if (!config?.options || config.options.showWatchlist !== false) {
                    catalogs.push(
                        { type: 'movie', id: 'trakt:watchlist', name: 'Trakt Watchlist - Movies', extra: [{ name: 'skip' }] },
                        { type: 'series', id: 'trakt:watchlist', name: 'Trakt Watchlist - Series', extra: [{ name: 'skip' }] }
                              );
          }
          if (!config?.options || config.options.showRecommendations !== false) {
                    catalogs.push(
                        { type: 'movie', id: 'trakt:recommendations', name: 'Trakt For You - Movies', extra: [{ name: 'skip' }] },
                        { type: 'series', id: 'trakt:recommendations', name: 'Trakt For You - Series', extra: [{ name: 'skip' }] }
                              );
          }
          for (const list of config?.traktLists || []) {
                    // Encode username and slug so colons in slugs cannot break the catalog id parser
            const u = encodeURIComponent(list.username);
                    const s = encodeURIComponent(list.slug);
                    const baseId = `trakt:list:${u}:${s}`;
                    catalogs.push(
                        { type: 'movie', id: `${baseId}:movies`, name: `${list.name} - Movies`, extra: [{ name: 'skip' }] },
                        { type: 'series', id: `${baseId}:shows`, name: `${list.name} - Series`, extra: [{ name: 'skip' }] }
                              );
          }
  }

  return catalogs;
}

function buildManifest(config) {
      return {
              id: ADDON_ID,
              version: ADDON_VERSION,
              name: 'My Stremio List Syncer',
              logo: 'https://api.dicebear.com/9.x/lorelei/png?seed=sakura&size=512&backgroundColor=ff6b9d,c084fc,b6e3f4&backgroundType=gradientLinear&radius=20',
              background: 'https://api.dicebear.com/9.x/lorelei/png?seed=sakura&size=1024&backgroundColor=1a1a24,7c3aed,ff6b9d&backgroundType=gradientLinear',
              description: 'Sync between Stremio and Trakt.tv. Your lists become catalogs. Your history stays in sync.',
              resources: [
                        'catalog',
                  { name: 'meta', types: ['movie', 'series'], idPrefixes: ['tt'] },
                  { name: 'stream', types: ['movie', 'series'], idPrefixes: ['tt'] },
                      ],
              types: ['movie', 'series'],
              catalogs: buildCatalogs(config),
              behaviorHints: {
                        configurable: true,
                        configurationRequired: !config,
              },
      };
}

module.exports = { buildManifest, ADDON_ID };
