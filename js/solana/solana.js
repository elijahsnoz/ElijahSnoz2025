/**
 * Solana core module for ElijahSnoz.me
 * -------------------------------------
 * Loaded ONLY on demand (dynamic import) the first time a visitor interacts
 * with a Solana feature. Nothing here runs during a normal page visit, so it
 * has zero effect on Lighthouse / SEO / load speed for non-crypto visitors.
 *
 * Wallets: uses the Wallet Standard, so ANY compliant Solana wallet works —
 * MetaMask (Solana), Phantom, Solflare, Backpack, etc. No wallet is ever
 * required to browse.
 */

import {
  Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from 'https://esm.sh/@solana/web3.js@1.95.8';
import { getWallets } from 'https://esm.sh/@wallet-standard/app@1.1.0';
import bs58 from 'https://esm.sh/bs58@6.0.0';
import {
  NETWORK, RPC_ENDPOINT, RECIPIENT_ADDRESS, GENESIS_HASHES,
  WALLET_STANDARD_CHAIN, explorerTx,
} from './config.js';

let _connection = null;
export function connection() {
  if (!_connection) _connection = new Connection(RPC_ENDPOINT, 'confirmed');
  return _connection;
}

// Active session state
let current = { wallet: null, account: null };

const supportsSolana = (w) =>
  !!w.features['standard:connect'] &&
  !!w.features['solana:signAndSendTransaction'] &&
  (w.chains.some((c) => c.startsWith('solana:')));

/** List installed Solana wallets: [{ name, icon }]. Empty if none installed. */
export function listWallets() {
  return getWallets().get().filter(supportsSolana).map((w) => ({ name: w.name, icon: w.icon }));
}

function findWallet(name) {
  const wallets = getWallets().get().filter(supportsSolana);
  if (!wallets.length) return null;
  if (!name) return wallets[0];
  return wallets.find((w) => w.name === name) || null;
}

/** Truncate an address for display: AbC1…Xy9z */
export function shortAddress(addr, lead = 4, tail = 4) {
  const s = String(addr);
  return s.length <= lead + tail ? s : `${s.slice(0, lead)}…${s.slice(-tail)}`;
}

/**
 * Connect to a wallet by name (or the first available). Returns
 * { wallet, account, address }. Throws a friendly Error if none installed.
 */
export async function connect(name) {
  const wallet = findWallet(name);
  if (!wallet) {
    const err = new Error('No Solana wallet found. Install MetaMask (Solana), Phantom, Solflare or Backpack to continue.');
    err.code = 'NO_WALLET';
    throw err;
  }
  const { accounts } = await wallet.features['standard:connect'].connect();
  const account = accounts.find((a) => a.chains.some((c) => c.startsWith('solana:'))) || accounts[0];
  if (!account) throw new Error('Wallet connected but exposed no Solana account.');
  current = { wallet, account };
  return { wallet, account, address: account.address };
}

export async function disconnect() {
  try { await current.wallet?.features['standard:disconnect']?.disconnect(); } catch { /* no-op */ }
  current = { wallet: null, account: null };
}

/** Listen for wallet account/disconnect changes. Returns an unsubscribe fn. */
export function onWalletEvents({ onDisconnect, onAccountChanged } = {}) {
  const events = current.wallet?.features['standard:events'];
  if (!events?.on) return () => {};
  return events.on('change', (props) => {
    if (props.accounts) {
      const acct = props.accounts.find((a) => a.chains.some((c) => c.startsWith('solana:')));
      if (acct) { current.account = acct; onAccountChanged?.(acct.address); }
      else { current = { wallet: null, account: null }; onDisconnect?.(); }
    }
  });
}

export async function getBalance(address) {
  const lamports = await connection().getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Support the artist: send `amountSol` from the connected wallet to
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
  if (!current.account) await connect();

  const conn = connection();
  const from = new PublicKey(current.account.address);
  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: new PublicKey(RECIPIENT_ADDRESS),
    lamports: Math.round(amount * LAMPORTS_PER_SOL),
  }));
  tx.feePayer = from;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

  const [{ signature }] = await current.wallet.features['solana:signAndSendTransaction']
    .signAndSendTransaction({
      account: current.account,
      chain: WALLET_STANDARD_CHAIN,
      transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
    });

  const sig = bs58.encode(signature);
  await conn.confirmTransaction(sig, 'confirmed');
  return { signature: sig, url: explorerTx(sig) };
}

/* ─────────────────────────  Verification utilities  ───────────────────────── */

/**
 * Prove wallet ownership: ask the wallet to sign a nonce message, then verify
 * client-side. Returns { address, verified, signature }.
 */
export async function verifyOwnership(statement = 'Verify wallet ownership for elijahsnoz.me') {
  if (!current.account) await connect();
  const feature = current.wallet.features['solana:signMessage'];
  if (!feature) throw new Error('This wallet does not support message signing.');
  const nonce = `${Date.now()}-${current.account.address.slice(0, 8)}`;
  const message = `${statement}\nNonce: ${nonce}`;
  const encoded = new TextEncoder().encode(message);
  const [{ signature }] = await feature.signMessage({ account: current.account, message: encoded });
  const verified = await verifySignature(encoded, signature, current.account.address);
  return { address: current.account.address, verified, signature: bs58.encode(signature), message };
}

/** Verify an ed25519 signature over `message` for a given wallet address. */
export async function verifySignature(message, signature, address) {
  const nacl = (await import('https://esm.sh/tweetnacl@1.0.3')).default;
  const msgBytes = message instanceof Uint8Array ? message : new TextEncoder().encode(message);
  const sigBytes = signature instanceof Uint8Array ? signature
    : (typeof signature === 'string' ? bs58.decode(signature) : Uint8Array.from(signature));
  return nacl.sign.detached.verify(msgBytes, sigBytes, new PublicKey(address).toBytes());
}

/** Look up a confirmed transaction by signature. Returns the parsed tx or null. */
export async function getTransaction(signature) {
  return connection().getTransaction(signature, { maxSupportedTransactionVersion: 0 });
}

/** Detect the network the RPC is actually on via its genesis hash. */
export async function detectNetwork() {
  try {
    const hash = await connection().getGenesisHash();
    return GENESIS_HASHES[hash] || 'unknown';
  } catch {
    return NETWORK;
  }
}

export { NETWORK };
