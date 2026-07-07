/**
 * Solana core module for ElijahSnoz.me
 * -------------------------------------
 * Loaded ONLY on demand (dynamic import) the first time a visitor interacts
 * with a Solana feature. Nothing here runs during a normal page visit, so it
 * has zero effect on Lighthouse / SEO / load speed for non-crypto visitors.
 *
 * Wallet support: any injected Solana wallet exposing the common provider API
 * (Phantom, Solflare, Backpack…). No wallet is ever required to browse.
 */

import {
  Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from 'https://esm.sh/@solana/web3.js@1.95.8';
import {
  NETWORK, RPC_ENDPOINT, RECIPIENT_ADDRESS, GENESIS_HASHES, explorerTx,
} from './config.js';

let _connection = null;
/** Lazily-created RPC connection (confirmed commitment). */
export function connection() {
  if (!_connection) _connection = new Connection(RPC_ENDPOINT, 'confirmed');
  return _connection;
}

/** Detect an injected wallet provider without requiring one. */
export function getProvider() {
  if (typeof window === 'undefined') return null;
  // Phantom / most wallets expose window.solana
  if (window.solana?.isPhantom) return window.solana;
  if (window.solflare?.isSolflare) return window.solflare;
  if (window.backpack?.isBackpack) return window.backpack;
  if (window.solana) return window.solana; // generic wallet-standard injected provider
  return null;
}

export function hasWallet() { return !!getProvider(); }

/** Truncate an address for display: AbC1…Xy9z */
export function shortAddress(addr, lead = 4, tail = 4) {
  const s = String(addr);
  return s.length <= lead + tail ? s : `${s.slice(0, lead)}…${s.slice(-tail)}`;
}

/**
 * Connect to a wallet. Returns { publicKey, address, provider }.
 * Throws a friendly Error if no wallet is installed or the user rejects.
 */
export async function connect() {
  const provider = getProvider();
  if (!provider) {
    const err = new Error('No Solana wallet found. Install Phantom, Solflare or Backpack to continue.');
    err.code = 'NO_WALLET';
    throw err;
  }
  const res = await provider.connect();
  const publicKey = res?.publicKey || provider.publicKey;
  return { provider, publicKey, address: publicKey.toBase58() };
}

export async function disconnect() {
  const provider = getProvider();
  try { await provider?.disconnect?.(); } catch { /* no-op */ }
}

/** Register connect/disconnect/account-change listeners. Returns an unsubscribe fn. */
export function onWalletEvents({ onDisconnect, onAccountChanged } = {}) {
  const provider = getProvider();
  if (!provider?.on) return () => {};
  const d = () => onDisconnect?.();
  const a = (pk) => onAccountChanged?.(pk ? pk.toBase58() : null);
  provider.on('disconnect', d);
  provider.on('accountChanged', a);
  return () => { provider.off?.('disconnect', d); provider.off?.('accountChanged', a); };
}

/** Live SOL balance for an address (in SOL, not lamports). */
export async function getBalance(address) {
  const lamports = await connection().getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Support the artist: send `amountSol` SOL from the connected wallet to
 * RECIPIENT_ADDRESS. Returns { signature, url }.
 */
export async function sendSol(amountSol) {
  if (!RECIPIENT_ADDRESS) {
    const err = new Error('Support wallet not configured yet — please check back soon.');
    err.code = 'NO_RECIPIENT';
    throw err;
  }
  const amount = Number(amountSol);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid SOL amount.');

  const { provider, publicKey } = await connect();
  const conn = connection();
  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: new PublicKey(RECIPIENT_ADDRESS),
    lamports: Math.round(amount * LAMPORTS_PER_SOL),
  }));
  tx.feePayer = publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

  // Prefer the wallet's one-shot sign+send; fall back to manual sign then send.
  let signature;
  if (provider.signAndSendTransaction) {
    ({ signature } = await provider.signAndSendTransaction(tx));
  } else {
    const signed = await provider.signTransaction(tx);
    signature = await conn.sendRawTransaction(signed.serialize());
  }
  await conn.confirmTransaction(signature, 'confirmed');
  return { signature, url: explorerTx(signature) };
}

/* ─────────────────────────  Verification utilities  ───────────────────────── */

/**
 * Prove wallet ownership: ask the connected wallet to sign a nonce message,
 * then verify the signature client-side. Returns { address, verified, signature }.
 */
export async function verifyOwnership(statement = 'Verify wallet ownership for elijahsnoz.me') {
  const { provider, publicKey } = await connect();
  const nonce = `${Date.now()}-${publicKey.toBase58().slice(0, 8)}`;
  const message = `${statement}\nNonce: ${nonce}`;
  const encoded = new TextEncoder().encode(message);
  const res = await provider.signMessage(encoded, 'utf8');
  const signature = res?.signature ?? res;
  const verified = await verifySignature(message, signature, publicKey.toBase58());
  return { address: publicKey.toBase58(), verified, signature, message };
}

/** Verify an ed25519 signature over `message` for a given wallet address. */
export async function verifySignature(message, signature, address) {
  const nacl = (await import('https://esm.sh/tweetnacl@1.0.3')).default;
  const msgBytes = message instanceof Uint8Array ? message : new TextEncoder().encode(message);
  const sigBytes = signature instanceof Uint8Array ? signature : Uint8Array.from(signature);
  return nacl.sign.detached.verify(msgBytes, sigBytes, new PublicKey(address).toBytes());
}

/** Look up a confirmed transaction by signature. Returns the parsed tx or null. */
export async function getTransaction(signature) {
  return connection().getTransaction(signature, { maxSupportedTransactionVersion: 0 });
}

/**
 * Detect which network the RPC (and therefore the app) is actually on by
 * comparing the genesis hash. Returns e.g. 'devnet' | 'mainnet-beta' | 'unknown'.
 */
export async function detectNetwork() {
  try {
    const hash = await connection().getGenesisHash();
    return GENESIS_HASHES[hash] || 'unknown';
  } catch {
    return NETWORK; // fall back to the configured value if RPC is unreachable
  }
}

export { NETWORK };
