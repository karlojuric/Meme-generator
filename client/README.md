# Meme Lab — React + InstantDB

The client is a React/Vite single page app that reuses the original meme
editor canvas, wires it to InstantDB for:

- **Auth** – magic-code login via `db.auth.sendMagicCode` /
  `db.auth.signInWithMagicCode`
- **Storage** – canvas exports land in InstantDB Storage
- **Data** – `memes` and `votes` entities live entirely in InstantDB

It also adds a minimalist feed where people can upvote posted memes.

## Quick start

```bash
cd client
npm install
cp .env.example .env.local # if you want to override the default app id
npm run dev
```

The default InstantDB App ID is your public id
`fd521099-3f8e-4a27-8fda-277abbf04120`. Override it by adding
`VITE_INSTANT_APP_ID` in `.env.local`.

## How it works

- `src/lib/instant.js` initialises the InstantDB client
- `MemeStudio` injects the legacy canvas script from
  `/public/legacy-meme-editor.js` and exposes “Post to feed”
- `MemeFeed` listens to newest memes and keeps vote state
- `AuthModal` walks through InstantDB’s 6-digit magic-code flow

## Production notes

1. Configure permissions in the InstantDB dashboard so only authenticated users
   can create `memes`, `votes`, and upload files.
2. If you prefer to hide admin tokens, proxy writes/upvotes through the Node
   server (`server/`) with `@instantdb/admin`.
3. Add analytics / logging as needed before shipping.

### Backend proxy

1. `cd server && npm install`
2. Create `server/.env` with `INSTANT_APP_ID`, `INSTANT_ADMIN_TOKEN`, `PORT=4000`
3. Run `npm run dev` to start the Express proxy. Vite (client) automatically proxies `/api` to `localhost:4000`.

See `docs/instant-config.md` for rules/schema snippets and environment notes.
