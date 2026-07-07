/**
 * Solana configuration for ElijahSnoz.me
 * ---------------------------------------
 * Single source of truth for network + endpoints.
 * To go live: change NETWORK to 'mainnet-beta' and set a mainnet RECIPIENT_ADDRESS.
 */

// 'devnet' during development, 'mainnet-beta' for production.
export const NETWORK = 'mainnet-beta';

// RPC endpoints. Mainnet uses a dedicated Helius endpoint (rate-limit friendly).
const RPC = {
  'devnet': 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://mainnet.helius-rpc.com/?api-key=cba71949-5982-4ebf-8619-15060ecafd98',
  'testnet': 'https://api.testnet.solana.com',
};
export const RPC_ENDPOINT = RPC[NETWORK];

// Wallet Standard chain identifier (CAIP-2 style) for the active network.
export const WALLET_STANDARD_CHAIN = {
  'mainnet-beta': 'solana:mainnet',
  'devnet': 'solana:devnet',
  'testnet': 'solana:testnet',
}[NETWORK];

/**
 * Elijah's receiving wallet address.
 * REQUIRED before "Send SOL" will work.
 *  - While NETWORK === 'devnet', use a devnet wallet address for testing.
 *  - For production, set a mainnet address you control.
 * Leave empty to keep the Send button in a friendly "coming soon" state.
 */
export const RECIPIENT_ADDRESS = 'D2CGZPYA9R23wYVkmymXKVHpw8MWG17ggvMp6JXVkYEA';

// Known genesis hashes — used to detect which network a wallet is actually on.
export const GENESIS_HASHES = {
  '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': 'mainnet-beta',
  'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG': 'devnet',
  '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': 'testnet',
};

const clusterQuery = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
export const explorerTx = (sig) => `https://explorer.solana.com/tx/${sig}${clusterQuery}`;
export const explorerAddress = (addr) => `https://explorer.solana.com/address/${addr}${clusterQuery}`;

// Pinned Solana Web3.js build, loaded on demand from a CDN (no bundler required).
export const WEB3_CDN = 'https://esm.sh/@solana/web3.js@1.95.8';
export const NACL_CDN = 'https://esm.sh/tweetnacl@1.0.3';
