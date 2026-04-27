const axios = require('axios');
const { idCache } = require('./cache');
const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders() {
    return { Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`, 'Content-Type': 'application/json' };
}

async function imdbToTmdb(imdbId) {
    const cacheKey = `imdb2tmdb:${imdbId}`;
    const cached = idCache.get(cacheKey);
    if (cached) return cached;
    try {
          const { data } = await axios.get(`${TMDB_BASE}/find/${imdbId}`, {
                  headers: tmdbHeaders(), params: { external_source: 'imdb_id' }
          });
          let result = null;
          if (data.movie_results?.length) result = { tmdbId: data.movie_results[0].id, type: 'movie' };
          else if (data.tv_results?.length) result = { tmdbId: data.tv_results[0].id, type: 'tv' };
          if (result) idCache.set(cacheKey, result);
          return result;
    } catch (err) { console.error(`[idResolver] imdbToTmdb failed for ${imdbId}:`, err.message); return null; }
}

async function tmdbToImdb(tmdbId, type) {
    const cacheKey = `tmdb2imdb:${type}:${tmdbId}`;
    const cached = idCache.get(cacheKey);
    if (cached) return cached;
    const endpoint = type === 'movie'
      ? `${TMDB_BASE}/movie/${tmdbId}/external_ids`
          : `${TMDB_BASE}/tv/${tmdbId}/external_ids`;
    try {
          const { data } = await axios.get(endpoint, { headers: tmdbHeaders() });
          const imdbId = data.imdb_id || null;
          if (imdbId) idCache.set(cacheKey, imdbId);
          return imdbId;
    } catch (err) { return null; }
}

function traktItemToImdb(traktItem) {
    const media = traktItem.movie || traktItem.show || traktItem.episode || traktItem;
    return media?.ids?.imdb || null;
}

function traktItemToStremioId(traktItem) {
    const imdb = traktItemToImdb(traktItem);
    if (imdb) return imdb;
    const media = traktItem.movie || traktItem.show || traktItem;
    const tmdb  = media?.ids?.tmdb;
    if (tmdb) {
          const isMovie = !!traktItem.movie || traktItem.type === 'movie';
          const type = isMovie ? 'movie' : 'series';
          return `tmdb:${type}:${tmdb}`;
    }
    return null;
}

function traktItemToType(traktItem) {
    if (traktItem.movie || traktItem.type === 'movie') return 'movie';
    if (traktItem.show || traktItem.episode || traktItem.type === 'show' || traktItem.type === 'episode' || traktItem.type === 'season') return 'series';
    return 'movie';
}

module.exports = { imdbToTmdb, tmdbToImdb, traktItemToImdb, traktItemToStremioId, traktItemToType };
