const Parser = require('rss-parser');
const { catalogCache } = require('./cache');

const rssParser = new Parser({ customFields: { item: [['description','description'],['pubDate','pubDate']] } });

function extractImdbId(link = '') {
  const match = link.match(/\/title\/(tt\d+)\//);
    return match ? match[1] : null;
    }

    function extractPoster(description = '') {
      const match = description.match(/src="([^"]+)"/);
        if (!match) return null;
          return match[1].replace(/_V1_.*?\.jpg/, '_V1_UX300_CR0,0,300,444_AL_.jpg');
          }

          function rssItemToMeta(item) {
            const imdbId = extractImdbId(item.link);
              if (!imdbId) return null;
                return {
                    id:     imdbId,
                        type:   'movie',
                            name:   item.title?.replace(/\s*\(\d{4}\)$/, '').trim() || 'Unknown',
                                poster: extractPoster(item.content || item.description || ''),
                                    imdbRating: null,
                                      };
                                      }

                                      async function fetchWatchlist(userId) {
                                        const cacheKey = `imdb:watchlist:${userId}`;
                                          const cached = catalogCache.get(cacheKey);
                                            if (cached) return cached;
                                              const url  = `https://rss.imdb.com/user/${userId}/watchlist`;
                                                const feed = await rssParser.parseURL(url);
                                                  const items = feed.items.map(rssItemToMeta).filter(Boolean);
                                                    catalogCache.set(cacheKey, items);
                                                      return items;
                                                      }

                                                      async function fetchCustomList(listId) {
                                                        const cacheKey = `imdb:list:${listId}`;
                                                          const cached = catalogCache.get(cacheKey);
                                                            if (cached) return cached;
                                                              const url  = `https://rss.imdb.com/list/${listId}`;
                                                                const feed = await rssParser.parseURL(url);
                                                                  const items = feed.items.map(rssItemToMeta).filter(Boolean);
                                                                    catalogCache.set(cacheKey, items);
                                                                      return items;
                                                                      }

                                                                      module.exports = { fetchWatchlist, fetchCustomList };
