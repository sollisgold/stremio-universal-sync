require('dotenv').config();
const express = require('express');
const path    = require('path');

const { buildManifest }       = require('./manifest');
const { handleCatalog }       = require('./src/catalogHandler');
const { handleMeta }          = require('./src/metaHandler');
const { handleStream, handleScrobbleStop } = require('./src/scrobbleHandler');
const { decodeConfig, encodeConfig }       = require('./src/config');
const trakt = require('./src/traktClient');

const PORT       = process.env.PORT       || 7000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://127.0.0.1:${PORT}`;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/configure', express.static(path.join(__dirname, 'configure')));

// Trakt OAuth - Step 1: redirect to Trakt
app.get('/auth/trakt', (req, res) => {
  const clientId    = process.env.TRAKT_CLIENT_ID;
    const redirectUri = `${PUBLIC_URL}/auth/trakt/callback`;
      res.redirect(`https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      });

      // Trakt OAuth - Step 2: handle callback
      app.get('/auth/trakt/callback', async (req, res) => {
        const { code } = req.query;
          if (!code) return res.status(400).send('Missing authorization code');
            try {
                const redirectUri = `${PUBLIC_URL}/auth/trakt/callback`;
                    const tokens      = await trakt.exchangeCode(code, redirectUri);
                        const profile     = await trakt.getUserProfile(tokens.access_token);
                            const userLists   = await trakt.getUserLists(tokens.access_token);
                                const traktLists  = userLists.map(l => ({ name: l.name, slug: l.ids.slug, username: profile.username }));
                                    const partialConfig = {
                                          traktAccessToken:  tokens.access_token,
                                                traktRefreshToken: tokens.refresh_token,
                                                      traktExpiresAt:    Date.now() + (tokens.expires_in * 1000),
                                                            traktUsername:     profile.username,
                                                                  traktLists,
                                                                      };
                                                                          const encoded = encodeConfig(partialConfig);
                                                                              res.redirect(`/configure?trakt=${encoded}&username=${profile.username}&lists=${encodeURIComponent(JSON.stringify(traktLists))}`);
                                                                                } catch (err) {
                                                                                    console.error('[oauth] Trakt callback error:', err.message);
                                                                                        res.status(500).send(`OAuth error: ${err.message}`);
                                                                                          }
                                                                                          });

                                                                                          // Scrobble stop webhook
                                                                                          app.post('/scrobble/stop', async (req, res) => {
                                                                                            const { config: configB64, id, progress } = req.body;
                                                                                              const config = decodeConfig(configB64);
                                                                                                const result = await handleScrobbleStop(config, id, progress || 95);
                                                                                                  res.json(result);
                                                                                                  });

                                                                                                  // Generate addon URL
                                                                                                  app.post('/verify-tmdb', express.json(), async (req, res) => {
    try {
        const token = (req.body && req.body.token) ? String(req.body.token).trim() : '';
        if (!token) return res.json({ success: false, error: 'No token provided' });
        const r = await fetch('https://api.themoviedb.org/3/authentication', {
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        const data = await r.json().catch(() => ({}));
        if (data && data.success === true) {
            return res.json({ success: true });
        }
        return res.json({ success: false, error: (data && data.status_message) || ('HTTP ' + r.status) });
    } catch (err) {
        return res.json({ success: false, error: err.message || 'Unknown error' });
    }
});

app.post('/generate-url', (req, res) => {
                                                                                                    const config   = req.body;
                                                                                                      const encoded  = encodeConfig(config);
                                                                                                        const addonUrl = `${PUBLIC_URL}/${encoded}/manifest.json`;
                                                                                                          res.json({ url: addonUrl, encoded });
                                                                                                          });
                                                                                                          
                                                                                                          // CORS helper
                                                                                                          function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Content-Type', 'application/json'); }
                                                                                                          
                                                                                                          // Manifest
                                                                                                          app.get('/:configB64/manifest.json', (req, res) => {
                                                                                                            cors(res);
                                                                                                              const config   = decodeConfig(req.params.configB64);
                                                                                                                res.json(buildManifest(config));
                                                                                                                });
                                                                                                                app.get('/manifest.json', (req, res) => {
                                                                                                                  cors(res);
                                                                                                                    res.json(buildManifest(null));
                                                                                                                    });
                                                                                                                    
                                                                                                                    // Catalog
                                                                                                                    app.get('/:configB64/catalog/:type/:id.json', async (req, res) => {
                                                                                                                      cors(res);
                                                                                                                        const config = decodeConfig(req.params.configB64);
                                                                                                                          try {
                                                                                                                              const metas = await handleCatalog(config, req.params.id, req.params.type);
                                                                                                                                  res.json({ metas });
                                                                                                                                    } catch (err) { console.error('[catalog]', err.message); res.json({ metas: [] }); }
                                                                                                                                    });
                                                                                                                                    
                                                                                                                                    // Meta
                                                                                                                                    app.get('/:configB64/meta/:type/:id.json', async (req, res) => {
                                                                                                                                      cors(res);
                                                                                                                                        const config = decodeConfig(req.params.configB64);
                                                                                                                                          try {
                                                                                                                                              const meta = await handleMeta(config, req.params.type, req.params.id);
                                                                                                                                                  res.json({ meta: meta || null });
                                                                                                                                                    } catch (err) { console.error('[meta]', err.message); res.json({ meta: null }); }
                                                                                                                                                    });
                                                                                                                                                    
                                                                                                                                                    // Stream (scrobble trigger)
                                                                                                                                                    app.get('/:configB64/stream/:type/:id.json', async (req, res) => {
                                                                                                                                                      cors(res);
                                                                                                                                                        const config = decodeConfig(req.params.configB64);
                                                                                                                                                          try {
                                                                                                                                                              const result = await handleStream(config, req.params.type, req.params.id);
                                                                                                                                                                  res.json(result);
                                                                                                                                                                    } catch (err) { console.error('[stream]', err.message); res.json({ streams: [] }); }
                                                                                                                                                                    });
                                                                                                                                                                    
                                                                                                                                                                    app.get('/', (req, res) => res.redirect('/configure'));
                                                                                                                                                                    
                                                                                                                                                                    app.listen(PORT, () => {
                                                                                                                                                                      console.log(`\n  Universal Sync addon running!`);
                                                                                                                                                                        console.log(`  Configure: ${PUBLIC_URL}/configure`);
                                                                                                                                                                          console.log(`  Manifest:  ${PUBLIC_URL}/manifest.json\n`);
                                                                                                                                                                          });
