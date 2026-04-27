const trakt = require('./traktClient');
const tmdb  = require('./tmdbClient');
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
      const media = item.movie || item.show || item;
      const stremioType = type === 'tv' ? 'series' : type;
      const metahubPoster     = stremioId.startsWith('tt') ? `https://images.metahub.space/poster/medium/${stremioId}/img` : null;
      const metahubBackground = stremioId.startsWith('tt') ? `https://images.metahub.space/background/medium/${stremioId}/img` : null;
      const metahubLogo       = stremioId.startsWith('tt') ? `https://images.metahub.space/logo/medium/${stremioId}/img` : null;
      const base = { id: stremioId, type: stremioType, name: media?.title || 'Unknown', releaseInfo: media?.year?.toString() || null, poster: metahubPoster, background: metahubBackground, logo: metahubLogo, posterShape: 'poster' };
      // Try TMDB enrichment but never lose the base item if enrichment fails
  if (stremioId.startsWith('tt') && tmdbToken) {
          try { return await enrichWithTmdb(base, tmdbToken); } catch { return base; }
  }
      return base;
}

async function safeCall(label, fn) {
      try { const out = await fn(); return Array.isArray(out) ? out : []; }
      catch (err) { console.error(`[catalog] ${label} failed:`, err.message); return []; }
}

async function handleCatalog(config, catalogId, type) {
      const tokenSlice = config?.traktAccessToken?.slice(-8) || 'anon';
      const cacheKey   = `cat:${tokenSlice}:${catalogId}:${type}`;
      const cached     = catalogCache.get(cacheKey);
      if (cached && cached.length) return cached;

  const tmdbToken = config?.tmdbBearerToken || process.env.TMDB_BEARER_TOKEN;
      let metas = [];

  // Strip optional ':movies' / ':shows' suffix added by the manifest split
  const baseCatalogId = catalogId.replace(/:(movies|shows)$/, '');

  if (baseCatalogId === 'trakt:watchlist') {
          if (!config?.traktAccessToken) return [];
          const traktType = type === 'series' ? 'shows' : 'movies';
          const raw = await safeCall('trakt.getWatchlist', () => trakt.getWatchlist(config.traktAccessToken, traktType));
          metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
  } else if (baseCatalogId.startsWith('trakt:list:')) {
          if (!config?.traktAccessToken) return [];
          // Format: trakt:list:<encoded-username>:<encoded-slug>
        const parts = baseCatalogId.split(':');
          if (parts.length < 4) return [];
          let username, slug;
          try { username = decodeURIComponent(parts[2]); } catch { username = parts[2]; }
          try { slug = decodeURIComponent(parts.slice(3).join(':')); } catch { slug = parts.slice(3).join(':'); }
          const traktType = type === 'series' ? 'shows' : 'movies';
          // Try the type-filtered endpoint first; fall back to the full list if Trakt returns empty
        let raw = await safeCall('trakt.getCustomList[typed]', () => trakt.getCustomList(config.traktAccessToken, username, slug, traktType));
          if (!raw.length) {
                    const all = await safeCall('trakt.getCustomList[all]', () => trakt.getCustomList(config.traktAccessToken, username, slug, ''));
                    const wantSeries = type === 'series';
                    raw = all.filter(i => {
                                const t = (i.type || (i.movie ? 'movie' : (i.show || i.episode ? 'show' : null)));
                                return wantSeries ? (t === 'show' || t === 'episode' || t === 'season') : t === 'movie';
                    });
          }
          metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
  } else if (baseCatalogId === 'trakt:trending') {
          const traktType = type === 'series' ? 'shows' : 'movies';
          const raw = await safeCall('trakt.getTrending', () => trakt.getTrending(traktType, 50));
          metas = await Promise.all(raw.map(i => traktItemToMeta(i, tmdbToken)));
  } else if (baseCatalogId === 'trakt:popular') {
          const traktType = type === 'series' ? 'shows' : 'movies';
          const raw = await safeCall('trakt.getPopular', () => trakt.getPopular(traktType, 50));
          const wrapped = raw.map(m => m.ids ? (traktType === 'movies' ? { movie: m } : { show: m }) : m);
          metas = await Promise.all(wrapped.map(i => traktItemToMeta(i, tmdbToken)));
  } else if (baseCatalogId === 'trakt:recommendations') {
          if (!config?.traktAccessToken) return [];
          const traktType = type === 'series' ? 'shows' : 'movies';
          const raw = await safeCall('trakt.getRecommendations', () => trakt.getRecommendations(config.traktAccessToken, traktType, 50));
          const wrapped = raw.map(m => m.ids ? (traktType === 'movies' ? { movie: m } : { show: m }) : m);
          metas = await Promise.all(wrapped.map(i => traktItemToMeta(i, tmdbToken)));
  }

  const result = metas.filter(Boolean).filter(m => !type || m.type === type);
      if (result.length) catalogCache.set(cacheKey, result);
      return result;
}

module.exports = { handleCatalog };
