const trakt   = require('./traktClient');
const imdb    = require('./imdbClient');
const tmdb    = require('./tmdbClient');
const { traktItemToStremioId, traktItemToType } = require('./idResolver');
const { catalogCache } = require('./cache');

async function enrichWithTmdb(item, tmdbToken) {
  if (!tmdbToken || !item?.id) return item;
  try {
    const enriched = item.type === 'series'
      ? await tmdb.getSeriesMeta(item.id, tmdbToken)
      : await tmdb.getMovieMeta(item.id, tmdbToken);
    return enriched || item;
  } catch { return item; }
}

async function traktItemToMeta(item, tmdbToken) {
  const stremioId = traktItemToStremioId(item);
  const type      = traktItemToType(item);
  if (!stremioId) return null;
  const media = item.movie || item.show;
  const stremioType = type === 'tv' ? 'series' : type;
  const metahubPoster = stremioId.startsWith('tt') ? `https://images.metahub.space/poster/medium/${stremioId}/img` : null;
  const metahubBackground = stremioId.startsWith('tt') ? `https://images.metahub.space/background/medium/${stremioId}/img` : null;
  const metahubLogo = stremioId.startsWith('tt') ? `https://images.metahub.space/logo/medium/${stremioId}/img` : null;
  const base = { id: stremioId, type: stremioType, name: media?.title || 'Unknown', releaseInfo: media?.year?.toString() || null, poster: metahubPoster, background: metahubBackground, logo: metahubLogo, posterShape: 'poster' };
  if (stremioId.startsWith('tt') && tmdbToken) return await enrichWithTmdb(base, tmdbToken);
  return base;
  }

async function handleCatalog(config, catalogId, type) {
  const tokenSlice = config?.traktAccessToken?.slice(-8) || 'anon';
  const cacheKey   = `cat:${tokenSlice}:${catalogId}:${type}`;
  const cached     = catalogCache.get(cacheKey);
  if (cached) return cached;

  const tmdbToken = config?.tmdbBearerToken || process.env.TMDB_BEARER_TOKEN;
  let metas = [];

  if (catalogId === 'trakt:watchlist') {
    if (!config?.traktAccessToken) return [];
    const traktType = type === 'series' ? 'shows' : 'movies';
    const raw = await trakt.getWatchlist(config.traktAccessToken, traktType);
    metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
} else if (catalogId.startsWith('trakt:list:')) {
    if (!config?.traktAccessToken) return [];
    const parts = catalogId.split(':');
    const username = parts[2];
    const slug = parts.slice(3).join(':');
    const traktType = type === 'series' ? 'shows' : 'movies';
    const raw = await trakt.getCustomList(config.traktAccessToken, username, slug, traktType);
    metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
} else if (catalogId === 'trakt:trending') {
    const traktType = type === 'series' ? 'shows' : 'movies';
    const raw = await trakt.getTrending(traktType, 50);
    metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
} else if (catalogId === 'trakt:popular') {
    const traktType = type === 'series' ? 'shows' : 'movies';
    const raw = await trakt.getPopular(traktType, 50);
    const wrapped = raw.map(m => m.ids ? (traktType === 'movies' ? { movie: m } : { show: m }) : m);
    metas = await Promise.all(wrapped.map(i => traktItemToMeta(i, tmdbToken)));
} else if (catalogId === 'trakt:recommendations') {
    if (!config?.traktAccessToken) return [];
    const traktType = type === 'series' ? 'shows' : 'movies';
    const raw = await trakt.getRecommendations(config.traktAccessToken, traktType, 50);
    const wrapped = raw.map(m => m.ids ? (traktType === 'movies' ? { movie: m } : { show: m }) : m);
    metas = await Promise.all(wrapped.map(i => traktItemToMeta(i, tmdbToken)));
                                                                                  } else if (catalogId === 'imdb:watchlist') {
    if (!config?.imdbUserId) return [];
    const rawImdb = await imdb.fetchWatchlist(config.imdbUserId);
    metas = await Promise.all(rawImdb.map(item => enrichWithTmdb(item, tmdbToken)));
} else if (catalogId.startsWith('imdb:list:')) {
    const listId  = catalogId.replace('imdb:list:', '');
    const rawImdb = await imdb.fetchCustomList(listId);
    metas = await Promise.all(rawImdb.map(item => enrichWithTmdb(item, tmdbToken)));
}

  const result = metas.filter(Boolean).filter(m => !type || m.type === type || (type === 'series' && m.type === 'series'));
  catalogCache.set(cacheKey, result);
  return result;
}

module.exports = { handleCatalog };
