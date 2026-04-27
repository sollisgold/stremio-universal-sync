const { catalogCache } = require('./cache');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IMDB_HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity'
};

function extractNextData(html) {
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
}

function findItemsInNode(node, out, depth) {
    out = out || [];
    depth = depth || 0;
    if (!node || typeof node !== 'object' || depth > 50) return out;
    if (Array.isArray(node)) {
        for (const child of node) findItemsInNode(child, out, depth + 1);
        return out;
    }
    if (node.titleId && typeof node.titleId === 'string' && node.titleId.indexOf('tt') === 0) {
        out.push(node);
    } else if (node.const && typeof node.const === 'string' && node.const.indexOf('tt') === 0) {
        out.push(node);
    } else if (node.id && typeof node.id === 'string' && /^tt\d+$/.test(node.id) && (node.titleText || node.originalTitleText || node.primaryImage)) {
        out.push(node);
    }
    for (const key in node) {
        if (key === 'parent' || key === 'self') continue;
        findItemsInNode(node[key], out, depth + 1);
    }
    return out;
}

function metahub(kind, id) { return 'https://images.metahub.space/' + kind + '/medium/' + id + '/img'; }

function nodeToMeta(node) {
    const id = node.titleId || node.const || node.id;
    if (!id || id.indexOf('tt') !== 0) return null;
    const name = (node.titleText && (node.titleText.text || node.titleText)) ||
                 (node.originalTitleText && (node.originalTitleText.text || node.originalTitleText)) ||
                 node.primaryTitle || node.title || node.name || 'Unknown';
    const titleType = (node.titleType && (node.titleType.id || node.titleType)) || node.type || '';
    const isSeries = /tvSeries|tvMiniSeries|tv_series|series/i.test(String(titleType));
    const poster = (node.primaryImage && (node.primaryImage.url || (node.primaryImage.image && node.primaryImage.image.url))) || null;
    return {
        id: id,
        type: isSeries ? 'series' : 'movie',
        name: typeof name === 'string' ? name : 'Unknown',
        poster: poster || metahub('poster', id),
        background: metahub('background', id),
        logo: metahub('logo', id),
        posterShape: 'poster'
    };
}

async function fetchImdbPage(url) {
    const res = await fetch(url, { headers: IMDB_HEADERS, redirect: 'follow' });
    if (!res.ok) throw new Error('IMDb ' + url + ' returned ' + res.status);
    return res.text();
}

function parseFromHtml(html) {
    const data = extractNextData(html);
    const items = [];
    const seen = new Set();
    if (data) {
        const nodes = findItemsInNode(data);
        for (const n of nodes) {
            const meta = nodeToMeta(n);
            if (meta && !seen.has(meta.id)) {
                seen.add(meta.id);
                items.push(meta);
            }
        }
    }
    if (items.length === 0) {
        const titleRe = /<a[^>]+href="\/title\/(tt\d+)\/[^"]*"[^>]*>([^<]+)<\/a>/g;
        let m;
        while ((m = titleRe.exec(html)) !== null) {
            const id = m[1];
            if (seen.has(id)) continue;
            seen.add(id);
            items.push({
                id: id,
                type: 'movie',
                name: m[2].trim(),
                poster: metahub('poster', id),
                background: metahub('background', id),
                logo: metahub('logo', id),
                posterShape: 'poster'
            });
        }
    }
    return items;
}

async function fetchListById(listId) {
    if (!listId) return [];
    const cacheKey = 'imdb:list:' + listId;
    const cached = catalogCache.get(cacheKey);
    if (cached) return cached;
    try {
        const html = await fetchImdbPage('https://www.imdb.com/list/' + listId + '/');
        const items = parseFromHtml(html);
        catalogCache.set(cacheKey, items);
        return items;
    } catch (err) {
        console.error('IMDb list fetch error:', err.message);
        return [];
    }
}

async function fetchWatchlist(userId) {
    if (!userId) return [];
    const cacheKey = 'imdb:watchlist:' + userId;
    const cached = catalogCache.get(cacheKey);
    if (cached) return cached;
    try {
        const html = await fetchImdbPage('https://www.imdb.com/user/' + userId + '/watchlist/');
        const items = parseFromHtml(html);
        catalogCache.set(cacheKey, items);
        return items;
    } catch (err) {
        console.error('IMDb watchlist fetch error:', err.message);
        return [];
    }
}

module.exports = { fetchWatchlist, fetchCustomList: fetchListById };
