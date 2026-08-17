# rekord-couple

The guest-facing half of Rekord Match: the intake flow a wedding couple (and
their friends) open from a magic link.

One route, one job. A link looks like `https://rekord.example.com/g/<token>`;
the token in the path *is* the login. The couple walks a short wizard —
opening dance, second and third song, their top 20, a shareable friends link,
a "never play this" list, and a finale with the briefing and playlist links —
and everything autosaves as they go. Friends who open the shared link get an
append-only view of just the friends' top 20.

This repo is a static single-page app. It holds no secrets and no state; every
write goes to the API.

## The design

Built to **Claude Design turn 9** — mockups 9a–9h in the Rekord Match lookbook:
warm paper, Playfair Display headlines, one question per page, and the progress
dashes at the foot of the screen.

It shares nothing with the DJ app's look. `rekord-dj` is a cool-grey instrument
you stare at in a booth; this is an invitation two people fill in on the couch,
so `src/styles/tokens.css` is its own palette and does not track the DJ app's.
There is deliberately **no light/dark switch**: the design exists in one warm
paper look, and a wedding invitation that flips to black at night is a
different object.

## The three repos

| Repo | What it holds |
| --- | --- |
| [`spotify-to-rekordbox`](https://github.com/Vikteur/spotify-to-rekordbox) | The backend: FastAPI, the matcher, the SQLite library, and the deployment topology |
| [`rekord-dj`](https://github.com/Vikteur/rekord-dj) | The DJ app — library scanning, matching, exports, and the couples panel |
| `rekord-couple` (this one) | The couple/friends intake SPA at `/g/<token>` |

## Running it

The app needs the API. Start the backend first, from a checkout of
`spotify-to-rekordbox`:

```bash
python -m server.run          # http://127.0.0.1:8000
```

Then here:

```bash
npm install
npm run dev                   # http://127.0.0.1:5173
```

Vite proxies `/api` to `http://127.0.0.1:8000`. Point it elsewhere with
`API_URL=https://rekord.example.com npm run dev`.

Open a real magic link against the dev server — `http://127.0.0.1:5173/g/<token>`.
Create a couple and read its tokens from the DJ app, or straight from the API:

```bash
curl -s -X POST http://127.0.0.1:8000/api/couples \
  -H 'Content-Type: application/json' \
  -d '{"names":"Sofie & Jan","wedding_date":"2026-09-12"}' | jq .links
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server, `/api` proxied to the backend |
| `npm run build` | `tsc --noEmit` then a production bundle into `dist/` |
| `npm run typecheck` | Types only |
| `npm run preview` | Serve the built bundle, `/api` still proxied |
| `npm run check:intake` | Browser walk-through of the whole flow (see below) |

## Where the bundle lives

The DJ app owns `/` on the same hostname, so this build's `base` is `/guest/`
and its assets land at `/guest/assets/…`. The URL a couple actually opens stays
`/g/<token>`; nginx answers that with this app's `index.html` (see
`nginx.conf`), and `vite.config.ts` does the same in dev.

Changing `base` means changing `nginx.conf`, the `Dockerfile`'s copy target,
and the edge proxy config in `spotify-to-rekordbox/deploy/nginx/rekord.conf`
together.

## The end-to-end check

`npm run check:intake` boots the dev server, creates a throwaway couple over
the API, walks the whole wizard and the friends link in a real browser, asserts
that every write persisted server-side, and screenshots each screen into
`.cache/couple-intake/`. The couple is deleted afterwards, so the DJ's data is
untouched.

It needs a running backend:

```bash
API_URL=http://127.0.0.1:8000 npm run check:intake
```

Only Spotify's `/search` is mocked (so no credentials are needed); every save
hits the real server. The DJ-side counterpart — the couples panel — lives in
`rekord-dj` as `scripts/couples-panel-check.mjs`.

## Deployment

`npm run build` produces a static bundle; the `Dockerfile` serves it from
nginx. CI pushes `ghcr.io/vikteur/rekord-couple:<sha>` on every merge to `main`.
The compose stack that runs it, and the edge proxy that routes `/g/` here and
`/api/` to the backend, live in `spotify-to-rekordbox/deploy/`.

To point a build at an API on another origin, build with
`--build-arg VITE_API_BASE=https://api.example.com`. Left empty (the default)
the app calls `/api` on its own origin, which is what the proxy expects.

## A note on the token

The magic link is a bearer secret sitting in a URL. The page is served with
`Referrer-Policy: no-referrer` and `Cache-Control: no-store`, and a `<meta
name="referrer">` fallback in `index.html`, so it does not hand itself on to
whatever the guest clicks next.
