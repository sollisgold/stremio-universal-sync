# My Stremio List Syncer

<img src="https://api.dicebear.com/9.x/lorelei/png?seed=sakura&size=512&backgroundColor=ff6b9d,c084fc,b6e3f4&backgroundType=gradientLinear&radius=20" alt="logo" width="96" height="96"/>

**Bi-directional sync between Stremio, Trakt.tv, and IMDb.**
Your lists become catalogs. Your history stays in sync. Automatic check-ins when you play.

## Features

- **Trakt Watchlist as Stremio Catalog** — Your Trakt watchlist appears as rows on the Stremio home screen
- - **IMDb Watchlist as Stremio Catalog** — Your IMDb watchlist and custom lists appear in Stremio
  - - **Watched State Sync** — Episodes you watched on Trakt show the purple checkmark in Stremio
    - - **Auto Scrobble** — When you play something in Stremio, it auto check-ins on Trakt
      - - **Trakt Trending & Popular** — No account needed for these catalog rows
        - - **TMDB Metadata** — Rich posters, descriptions, ratings for all content
         
          - ## Quick Start
         
          - ### Prerequisites
          - - Node.js 18+ (download from [nodejs.org](https://nodejs.org))
            - - A free [TMDB account](https://www.themoviedb.org/settings/api) — get your Read Access Token
              - - A free [Trakt account](https://trakt.tv/oauth/applications/new) — create an app to get Client ID & Secret
               
                - ### Install & Run
               
                - ```bash
                  git clone https://github.com/sollisgold/stremio-universal-sync.git
                  cd stremio-universal-sync
                  npm install
                  cp .env.example .env
                  # Edit .env and fill in your TMDB token, Trakt client ID, and Trakt client secret
                  npm start
                  ```

                  Then open: **http://127.0.0.1:7000/configure**

                  ### Configure

                  1. **Enter your TMDB token** and click Verify
                  2. 2. **Connect Trakt** via OAuth (optional but recommended)
                     3. 3. **Enter your IMDb User ID** — found at imdb.com/profile (optional)
                        4. 4. **Add IMDb custom list IDs** — e.g. ls012345678 from any IMDb list URL
                           5. 5. **Toggle sync options** to your preference
                              6. 6. Click **Generate Addon URL** then **Install in Stremio**
                                
                                 7. ## Getting Your API Keys
                                
                                 8. ### TMDB Token
                                 9. 1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
                                    2. 2. Go to Settings > API
                                       3. 3. Copy the **API Read Access Token** (the long Bearer token, not the API key)
                                         
                                          4. ### Trakt App
                                          5. 1. Go to [trakt.tv/oauth/applications/new](https://trakt.tv/oauth/applications/new)
                                             2. 2. Name: `Universal Sync` (or anything)
                                                3. 3. Redirect URI: `http://127.0.0.1:7000/auth/trakt/callback`
                                                   4. 4. Copy the **Client ID** and **Client Secret**
                                                     
                                                      5. ### IMDb User ID
                                                      6. 1. Go to [imdb.com](https://imdb.com) and sign in
                                                         2. 2. Click your profile — the URL will contain your ID: `imdb.com/user/ur12345678/`
                                                            3. 3. Copy the `ur12345678` part
                                                              
                                                               4. ## Deployment (Share with Others)
                                                              
                                                               5. ### Railway (Recommended — Free)
                                                               6. 1. Fork this repo on GitHub
                                                                  2. 2. Go to [railway.app](https://railway.app) and create a new project from your fork
                                                                     3. 3. Add environment variables: `TMDB_BEARER_TOKEN`, `TRAKT_CLIENT_ID`, `TRAKT_CLIENT_SECRET`
                                                                        4. 4. Set `PUBLIC_URL` to your Railway app URL (e.g. `https://your-app.up.railway.app`)
                                                                           5. 5. Update your Trakt app redirect URI to `https://your-app.up.railway.app/auth/trakt/callback`
                                                                             
                                                                              6. ### Render / Fly.io
                                                                              7. Same process — connect your GitHub repo, set the environment variables, and set `PUBLIC_URL`.
                                                                              8. 
                                                                              ## Project Structure

                                                                              ```
                                                                              stremio-universal-sync/
                                                                              ├── index.js                  # Express server + route handlers
                                                                              ├── manifest.js               # Dynamic Stremio manifest builder
                                                                              ├── package.json
                                                                              ├── .env.example
                                                                              ├── src/
                                                                              │   ├── cache.js              # In-memory TTL caches
                                                                              │   ├── config.js             # Base64 URL config encoder/decoder
                                                                              │   ├── idResolver.js         # IMDb ↔ TMDB ↔ Trakt ID translation
                                                                              │   ├── traktClient.js        # Trakt API wrapper
                                                                              │   ├── imdbClient.js         # IMDb RSS list fetcher
                                                                              │   ├── tmdbClient.js         # TMDB metadata client
                                                                              │   ├── catalogHandler.js     # Stremio catalog resource handler
                                                                              │   ├── metaHandler.js        # Stremio meta resource + watched state
                                                                              │   └── scrobbleHandler.js    # Stremio stream resource + Trakt scrobble
                                                                              └── configure/
                                                                                  └── index.html            # Setup UI
                                                                              ```

                                                                              ## License

                                                                              MIT
