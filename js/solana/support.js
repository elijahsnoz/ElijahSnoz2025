/**
 * Solana Support widget controller for ElijahSnoz.me
 * ---------------------------------------------------
 * Tiny, dependency-free bootstrap loaded with `defer`. It imports the heavy
 * Solana module (solana.js → web3.js + wallet-standard) ONLY on first
 * interaction, so a normal visit ships no blockchain code at all.
 */

const root = document.querySelector('[data-sol-widget]');
if (root) {
  const $ = (sel) => root.querySelector(sel);
  const connectBtn = $('[data-sol-connect]');
  const walletsBox = $('[data-sol-wallets]');
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

  const say = (text, kind = '') => { msg.textContent = text || ''; msg.dataset.kind = kind; };
  const load = async () => { if (!sol) { say('Loading Solana…'); sol = await import('./solana.js'); } return sol; };

  const renderConnected = async (address) => {
    addrEl.textContent = sol.shortAddress(address);
    addrEl.title = address;
    identity.hidden = false;
    sendBox.hidden = false;
    connectBtn.hidden = true;
    walletsBox.hidden = true;
    statusDot.dataset.state = 'on';
    say('');
    netEl.textContent = '…';
    try { netEl.textContent = await sol.detectNetwork(); } catch { netEl.textContent = sol.NETWORK; }
  };

  const renderDisconnected = () => {
    identity.hidden = true;
    sendBox.hidden = true;
    connectBtn.hidden = false;
    walletsBox.hidden = true;
    walletsBox.innerHTML = '';
    statusDot.dataset.state = 'off';
  };

  const doConnect = async (name) => {
    try {
      const { address } = await sol.connect(name);
      if (typeof window.gtag === 'function') gtag('event', 'wallet_connect', { wallet: name || 'default' });
      unsub = sol.onWalletEvents({
        onDisconnect: renderDisconnected,
        onAccountChanged: (a) => (a ? renderConnected(a) : renderDisconnected()),
      });
      await renderConnected(address);
    } catch (err) {
      if (err.code === 'NO_WALLET') say('No Solana wallet detected. Install MetaMask (Solana) or Phantom to continue.', 'error');
      else say(err.message || 'Could not connect wallet.', 'error');
    }
  };

  const showPicker = (wallets) => {
    walletsBox.innerHTML = '';
    wallets.forEach((w) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sol-wallet-option';
      b.innerHTML = `${w.icon ? `<img src="${w.icon}" alt="" width="20" height="20">` : ''}<span>${w.name}</span>`;
      b.addEventListener('click', () => { walletsBox.hidden = true; say('Approve the connection in your wallet…'); doConnect(w.name); });
      walletsBox.appendChild(b);
    });
    walletsBox.hidden = false;
    say('Choose a wallet:');
  };

  connectBtn?.addEventListener('click', async () => {
    connectBtn.disabled = true;
    try {
      await load();
      const wallets = sol.listWallets();
      if (wallets.length === 0) {
        say('No Solana wallet detected. Install MetaMask (with Solana enabled) or Phantom, then reload.', 'error');
      } else if (wallets.length === 1) {
        say('Approve the connection in your wallet…');
        await doConnect(wallets[0].name);
      } else {
        showPicker(wallets);
      }
    } catch (err) {
      say(err.message || 'Could not load Solana.', 'error');
    } finally {
      connectBtn.disabled = false;
    }
  });

  disconnectBtn?.addEventListener('click', async () => {
    try { await sol?.disconnect(); } finally { unsub(); renderDisconnected(); say('Wallet disconnected.'); }
  });

  payBtn?.addEventListener('click', async () => {
    payBtn.disabled = true;
    say('Confirm the transaction in your wallet…');
    try {
      const { url } = await sol.sendSol(amountInput.value);
      if (typeof window.gtag === 'function') gtag('event', 'sol_support', { value: Number(amountInput.value) || 0, currency: 'SOL' });
      msg.innerHTML = `✅ Thank you! <a href="${url}" target="_blank" rel="noopener">View transaction</a>`;
      msg.dataset.kind = 'success';
    } catch (err) {
      say(err.message || 'Transaction failed.', 'error');
    } finally {
      payBtn.disabled = false;
    }
  });
}
