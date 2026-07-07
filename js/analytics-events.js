/**
 * GA4 interaction tracking for ElijahSnoz.me
 * -------------------------------------------
 * Fires categorized GA4 events for the actions Enhanced Measurement misses or
 * doesn't label well: outbound clicks (by category), email (mailto) intents,
 * and phone taps. Runs only if gtag is present; safe no-op otherwise.
 *
 * Success events for the newsletter, Solana support and RSVP/booking are fired
 * at their own success points (handleNewsletter, support.js, events.html).
 */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var SITE_HOSTS = ['elijahsnoz.me', 'www.elijahsnoz.me', 'localhost', '127.0.0.1'];

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  function categorize(host) {
    host = host.replace(/^www\./, '');
    if (/instagram|tiktok|youtube|youtu\.be|(^|\.)x\.com|twitter|facebook|snapchat/.test(host)) return 'social';
    if (/spotify|apple|soundcloud|audiomack/.test(host)) return 'music';
    if (/buymeacoffee/.test(host)) return 'support';
    if (/planet-b\.tech|snozcoin\.xyz/.test(host)) return 'venture';
    if (/saatchi|artconnect|opensea|art\.africa|behold/.test(host)) return 'art_marketplace';
    if (/solana|helius/.test(host)) return 'crypto';
    if (/calendar\.google|google\.com\/maps/.test(host)) return 'utility';
    return 'other';
  }

  function emailIntent(href) {
    var m = href.match(/subject=([^&]*)/i);
    var s = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    if (/booking|viewing|rsvp/.test(s)) return 'booking';
    if (/collect|commission/.test(s)) return 'commission';
    if (/enquiry|inquiry/.test(s)) return 'artwork_inquiry';
    if (/subscriber/.test(s)) return 'newsletter';
    return 'general';
  }

  // Capture phase so we still fire even when a handler calls stopPropagation().
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (href.indexOf('mailto:') === 0) {
      track('email_click', { email_intent: emailIntent(href) });
      return;
    }
    if (href.indexOf('tel:') === 0) { track('phone_click', {}); return; }

    var url;
    try { url = new URL(href, window.location.href); } catch (_) { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (SITE_HOSTS.indexOf(url.hostname) !== -1) return; // internal link

    track('outbound_click', {
      link_domain: url.hostname.replace(/^www\./, ''),
      link_url: url.href.slice(0, 200),
      link_text: (a.textContent || '').trim().slice(0, 60),
      category: categorize(url.hostname)
    });
  }, true);
})();
