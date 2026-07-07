# Solana Integration — ElijahSnoz.me

Tasteful, production-ready Solana support added to the existing **static** site
(plain HTML/CSS/vanilla JS on Vercel) — **without** a framework migration and
**without** changing the design, navigation, or existing behavior.

> **Note on stack:** the site is not a Next.js/React app. Introducing a build
> system would have meant rebuilding the whole site, which conflicts with the
> "don't redesign / everything keeps working" requirement. Instead, Solana is
> implemented as **on-demand ES modules** loaded from a CDN (esm.sh). This keeps
> the site static and fast while providing full Web3.js capability.

## Why Solana was integrated

- Give supporters an optional, direct, low-fee way to back Elijah's work (send SOL).
- Establish a verifiable on-chain identity layer (wallet connect + signature proof).
- Lay clean groundwork for future **digital collectibles / artwork certificates**
  using **Metaplex standards** — without building a marketplace or enabling speculation.

Blockchain is **invisible until a visitor chooses to interact.** No wallet is ever
required to browse.

## Where it is used

| Area | File | Notes |
|------|------|-------|
| Config (network, endpoints, recipient) | `js/solana/config.js` | Single source of truth |
| Core: wallet, identity, send, verify | `js/solana/solana.js` | Loaded on demand only |
| UI controller for the support widget | `js/solana/support.js` | Deferred module; lazy-imports the core |
| Collectibles extension point (stubs) | `js/solana/collectibles.js` | Metaplex-ready, not wired to UI |
| Support widget markup | `index.html` → Contact section | `[data-sol-widget]` |
| "Powered by Solana" mark | `index.html` → footer | `.footer-solana`, official logo |
| Styles | `css/styles.css` | `.support-sol`, `.sol-*`, `.footer-solana` |

### Performance guarantee

- The only always-loaded file is `support.js` — a tiny controller with **no**
  blockchain imports. It attaches click handlers and does nothing else.
- `solana.js` (and therefore `@solana/web3.js`) is fetched via
  `import('./solana.js')` **only on the first "Connect Wallet" click.**
- Result: non-crypto visitors download zero Web3 code — no impact on Lighthouse,
  SEO, accessibility, load speed, or existing animations.

## Features

1. **Wallet connection** — optional; supports injected wallets (Phantom, Solflare, Backpack).
2. **Solana identity** — shows address, live network, connection status, disconnect.
3. **Support the artist** — send SOL directly to Elijah. No tokens, staking, or speculation.
4. **Digital collectibles (future-ready)** — `collectibles.js` exposes `listCollectibles()`
   and `verifyCertificate()` stubs so features can be added later with no refactor.
5. **Verification utilities** — signature verification, wallet-ownership proof,
   transaction lookup, network detection (all in `solana.js`).
6. **Powered by Solana** — subtle official-logo mark in the footer.

## Configuration

### Switch between Devnet and Mainnet

Edit **`js/solana/config.js`**:

```js
export const NETWORK = 'devnet';          // → change to 'mainnet-beta' for production
export const RECIPIENT_ADDRESS = '';       // → set Elijah's receiving wallet
```

- **Devnet (default):** for development/testing. Fund a test wallet at
  <https://faucet.solana.com>. Use a devnet address for `RECIPIENT_ADDRESS`.
- **Mainnet:** set `NETWORK = 'mainnet-beta'` **and** a real `RECIPIENT_ADDRESS`
  you control. For production traffic, also replace the public mainnet RPC in
  `config.js` with a dedicated endpoint (Helius/QuickNode/Triton) to avoid rate limits.

Until `RECIPIENT_ADDRESS` is set, "Send SOL" fails gracefully with a friendly
"check back soon" message — nothing breaks.

### Upgrading the Web3.js version

Pinned in `config.js` (`WEB3_CDN`, `NACL_CDN`) and imported in `solana.js`.
Bump the version string to upgrade; no build step required.

## Verification utilities (reference)

```js
const sol = await import('/js/solana/solana.js');

await sol.connect();                       // { provider, publicKey, address }
await sol.verifyOwnership();               // sign a nonce, verify → { address, verified }
await sol.verifySignature(msg, sig, addr); // ed25519 verify → boolean
await sol.getTransaction(signature);       // on-chain tx lookup
await sol.detectNetwork();                 // 'devnet' | 'mainnet-beta' | ...
```

## Architecture: staying independent from Planet-B.tech & Snozcoin.xyz

**ElijahSnoz.me does not embed, bundle, or share UI/navigation with those
projects.** They are separate applications with their own identities. This site
only *links out* to them (see the Ventures section).

If future interoperability is desired, do it through **standard, decoupled
boundaries** — never by merging codebases:

- **Wallet as the shared key.** All three apps can recognize the same visitor by
  their connected Solana wallet address. No shared login system needed.
- **On-chain as the shared source of truth.** A collectible minted here (Metaplex)
  can be *read* by Snozcoin.xyz or Planet-B.tech directly from the chain — no
  backend integration, no shared database.
- **Signature hand-off (if ever needed).** ElijahSnoz.me can ask the wallet to
  sign a message; another app can verify that signature independently with
  `verifySignature()`-equivalent logic. Cross-app trust without coupling.
- **Plain links only.** Navigating to Planet-B.tech or Snozcoin.xyz *leaves* this
  site and opens the dedicated platform.

The rule: **compose at the wallet/chain layer, never at the code layer.**

## Custom on-chain program (Anchor)?

**Not required.** Every current feature uses native SOL transfers and standard
wallet signing; future collectibles use **Metaplex** standards. No bespoke Rust/
Anchor program is warranted. If a genuinely custom instruction is ever needed,
add it as a separate program repo and call it from `solana.js` — keeping this
site's footprint minimal.
