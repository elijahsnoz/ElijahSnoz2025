/**
 * Digital Collectibles — extension point (NOT wired to any UI yet)
 * ----------------------------------------------------------------
 * This module exists so future artwork certificates or digital collectibles
 * can be added WITHOUT touching the rest of the codebase. It intentionally
 * ships as thin, documented stubs.
 *
 * Design intent:
 *  - Use Metaplex standards (Token Metadata / Core) rather than a bespoke protocol.
 *  - No marketplace, no trading, no speculation — read/verify/display only.
 *  - Everything loads on demand, same as solana.js.
 *
 * When you're ready to enable collectibles, implement the bodies below using
 * `@metaplex-foundation/umi` + `@metaplex-foundation/mpl-token-metadata`
 * (loadable from esm.sh, mirroring the web3.js pattern in solana.js).
 */

import { connection } from './solana.js';
import { explorerAddress } from './config.js';

/**
 * List digital collectibles held by a wallet (read-only).
 * @param {string} _address base58 wallet address
 * @returns {Promise<Array>} normalized collectible descriptors
 */
export async function listCollectibles(_address) {
  // FUTURE: fetch owned NFTs/assets via Metaplex and normalize to
  // { mint, name, image, uri, verified, explorerUrl }.
  return [];
}

/**
 * Verify that a given mint is an authentic Elijah Snoz collectible
 * (e.g. by checking the verified creator / collection).
 * @param {string} _mint base58 mint address
 * @returns {Promise<{authentic: boolean, explorerUrl: string}>}
 */
export async function verifyCertificate(_mint) {
  // FUTURE: load metadata, confirm the update authority / verified collection
  // matches Elijah's on-chain identity.
  return { authentic: false, explorerUrl: explorerAddress(_mint) };
}

// Kept so tree-shakers/linters see `connection` is a deliberate future dependency.
export const _readyForUse = typeof connection === 'function';
