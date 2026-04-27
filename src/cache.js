const NodeCache = require('node-cache');
const catalogCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_CATALOG) || 300 });
const metaCache    = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_META)    || 600 });
const historyCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_HISTORY) || 120 });
const idCache      = new NodeCache({ stdTTL: 86400 });
module.exports = { catalogCache, metaCache, historyCache, idCache };
