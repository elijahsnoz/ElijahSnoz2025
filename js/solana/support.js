/**
 * Solana Support widget controller for ElijahSnoz.me
 * ---------------------------------------------------
 * Tiny, dependency-free bootstrap loaded with `defer`. It imports the heavy
 * Solana module (solana.js → web3.js) ONLY on first interaction, so a normal
 * visit ships no blockchain code at all.
 */

const root = document.querySelector('[data-sol-widget]');
if (root) {
  const $ = (sel) => root.querySelector(sel);
  const connectBtn = $('[data-sol-connect]');
  const identity = $('[data-sol-identity]');
  const sendBox = $('[data-sol-send]');
  const amountInput = $('[data-sol-amount]');
  const payBtn = $('[data-sol-pay]');
  const disconnectBtn = $('[data-sol-disconnect]');
  const addrEl = $('[data-sol-address]');
  const netEl = $('[data-sol-network]');
  const statusDot = $('[data-sol-dot]');
  const msg = $('[data-sol-msg]');

  let sol = null;         // lazily-imported ./solana.js
  let unsub = () => {};
  let connected = false;

  const say = (text, kind = '') => {
    msg.textContent = text || '';
    msg.dataset.kind = kind;
  };

  const load = async () => {
    if (!sol) { say('Loading Solana…'); sol = await import('./solana.js'); }
    return sol;
  };

  const renderConnected = async (address) => {
    connected = true;
    addrEl.textContent = sol.shortAddress(address);
    addrEl.title = address;
    identity.hidden = false;
    sendBox.hidden = false;
    connectBtn.hidden = true;
    statusDot.dataset.state = 'on';
    say('');
    netEl.textContent = '…';
    try { netEl.textContent = await sol.detectNetwork(); } catch { netEl.textContent = sol.NETWORK; }
  };

  const renderDisconnected = () => {
    connected = false;
    identity.hidden = true;
    sendBox.hidden = true;
    connectBtn.hidden = false;
    statusDot.dataset.state = 'off';
  };

  connectBtn?.addEventListener('click', async () => {
    connectBtn.disabled = true;
    try {
      await load();
      const { address } = await sol.connect();
      unsub = sol.onWalletEvents({
        onDisconnect: renderDisconnected,
        onAccountChanged: (a) => (a ? renderConnected(a) : renderDisconnected()),
      });
      await renderConnected(address);
    } catch (err) {
      if (err.code === 'NO_WALLET') {
        say('No Solana wallet detected. Install Phantom to continue → phantom.app', 'error');
      } else {
        say(err.message || 'Could not connect wallet.', 'error');
      }
    } finally {
      connectBtn.disabled = false;
    }
  });

  disconnectBtn?.addEventListener('click', async () => {
    try { await sol?.disconnect(); } finally { unsub(); renderDisconnected(); say('Wallet disconnected.'); }
  });

  payBtn?.addEventListener('click', async () => {
    const amount = amountInput.value;
    payBtn.disabled = true;
    say('Confirm the transaction in your wallet…');
    try {
      const { url } = await sol.sendSol(amount);
      msg.innerHTML = `✅ Thank you! <a href="${url}" target="_blank" rel="noopener">View transaction</a>`;
      msg.dataset.kind = 'success';
    } catch (err) {
      say(err.message || 'Transaction failed.', 'error');
    } finally {
      payBtn.disabled = false;
    }
  });
}
