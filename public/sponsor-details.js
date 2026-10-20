(function () {
  var $ = function (id) { return document.getElementById(id); };
  var sid = new URLSearchParams(location.search).get('session_id') || '';
  var st = $('sd-status'), form = $('sd'), done = $('sd-done');
  var logoData = null, removeLogo = false, bannerData = null, removeBanner = false;
  var LIM = { 'sd-name': 40, 'sd-headline': 40, 'sd-sentence': 160 };
  function say(t) { st.textContent = t; }
  function errs(e) { document.querySelectorAll('[data-err]').forEach(function (el) { el.textContent = (e && e[el.getAttribute('data-err')]) || ''; }); }
  function counters() { Object.keys(LIM).forEach(function (id) { var c = document.querySelector('[data-for="' + id + '"]'); if (c) c.textContent = $(id).value.length + ' / ' + LIM[id]; }); }
  function preview() {
    $('sd-card-h').textContent = $('sd-headline').value || 'Your Headline';
    $('sd-card-s').textContent = $('sd-sentence').value || 'Your one sentence about the product.';
    $('sd-card-n').textContent = $('sd-name').value || 'Your Brand';
    var bsrc = $('sd-banner-prev').hidden ? '' : $('sd-banner-prev').src;
    $('sd-card-ban').hidden = !bsrc; $('sd-card-row').hidden = !!bsrc;
    if (bsrc) { $('sd-card-banimg').src = bsrc; $('sd-card-banimg').alt = ($('sd-name').value || 'Your Brand') + ': ' + ($('sd-headline').value || 'Your Headline'); }
    var src = $('sd-logo-prev').hidden ? '' : $('sd-logo-prev').src;
    $('sd-card-logo').hidden = !src; if (src) $('sd-card-logo').src = src;
    counters();
  }
  function showLogo(src) { var p = $('sd-logo-prev'); if (src) { p.src = src; p.hidden = false; $('sd-logo-rm').hidden = false; } else { p.removeAttribute('src'); p.hidden = true; $('sd-logo-rm').hidden = true; } preview(); }
  function showBanner(src) { var p = $('sd-banner-prev'); if (src) { p.src = src; p.hidden = false; $('sd-banner-rm').hidden = false; } else { p.removeAttribute('src'); p.hidden = true; $('sd-banner-rm').hidden = true; } preview(); }
  function fill(f) { ['name', 'headline', 'sentence', 'url', 'email', 'notes'].forEach(function (k) { if (f && f[k] != null && f[k] !== '') $('sd-' + k).value = f[k]; }); preview(); }
  function lock(msg) { form.querySelectorAll('input,textarea,button').forEach(function (el) { el.disabled = true; }); say(msg); }
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sid)) { say('This page needs the link from your order email. If you lost it, email support@swarmnest.ai.'); return; }
  fetch('/api/sponsor/details?session_id=' + encodeURIComponent(sid), { headers: { accept: 'application/json' } }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.ok) { say(d.error || 'We could not load this order.'); return; }
    form.hidden = false;
    $('sd-order').textContent = 'Order: ' + d.product + ' (' + (d.mode === 'monthly' ? 'monthly' : 'one-time, 30 days') + ').';
    fill(d.prefill); if (d.record) fill(d.record.fields);
    if (d.record && d.record.logo) showLogo('/api/sponsor/logo?session_id=' + encodeURIComponent(sid) + '&t=' + Date.now());
    if (d.banner) $('sd-banner-wrap').hidden = false;
    if (d.record && d.record.banner) showBanner('/api/sponsor/logo?kind=banner&session_id=' + encodeURIComponent(sid) + '&t=' + Date.now());
    if (d.locked) lock('Your ad has been approved, so these details are locked. To change them, email support@swarmnest.ai.');
    else say(d.record ? 'We have your details (saved ' + new Date(d.record.updated).toLocaleString() + '). You can still edit them.' : 'Fill in your ad details below.');
  }).catch(function () { say('We could not load this order. Check your connection and refresh the page.'); });
  ['sd-name', 'sd-headline', 'sd-sentence'].forEach(function (id) { $(id).addEventListener('input', preview); });
  $('sd-logo-rm').addEventListener('click', function () { logoData = null; removeLogo = true; $('sd-logo').value = ''; showLogo(''); });
  $('sd-logo').addEventListener('change', function () {
    var f = this.files && this.files[0]; errs({}); logoData = null;
    if (!f) return;
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(f.type) < 0) { errs({ logo: 'Use a PNG, JPEG or WebP image. SVG is not accepted.' }); this.value = ''; return; }
    if (f.size > 300 * 1024) { errs({ logo: 'The logo must be 300 KB or smaller (this one is ' + Math.round(f.size / 1024) + ' KB).' }); this.value = ''; return; }
    var rd = new FileReader(), input = this;
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var r = img.naturalWidth / img.naturalHeight;
        if (img.naturalWidth < 64 || img.naturalHeight < 64) { errs({ logo: 'The logo must be at least 64 × 64 pixels.' }); input.value = ''; return; }
        if (r < 0.8 || r > 1.25) { errs({ logo: 'The logo should be roughly square (this one is ' + img.naturalWidth + ' × ' + img.naturalHeight + ').' }); input.value = ''; return; }
        logoData = rd.result; removeLogo = false; showLogo(rd.result);
      };
      img.onerror = function () { errs({ logo: 'This image could not be read.' }); input.value = ''; };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });
  $('sd-banner-rm').addEventListener('click', function () { bannerData = null; removeBanner = true; $('sd-banner').value = ''; showBanner(''); });
  $('sd-banner').addEventListener('change', function () {
    var f = this.files && this.files[0], input = this; errs({}); bannerData = null;
    if (!f) return;
    var bad = function (m) { errs({ banner: m }); input.value = ''; };
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(f.type) < 0) return bad('Use a PNG, JPEG or WebP banner. GIF and SVG are not accepted.');
    if (f.size > 400 * 1024) return bad('The banner must be 400 KB or smaller (this one is ' + Math.round(f.size / 1024) + ' KB).');
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, r = w / h;
        if (w < 900 || h < 300) return bad('The banner must be at least 900 × 300 pixels (this one is ' + w + ' × ' + h + '). We recommend 1200 × 400.');
        if (r < 2.8 || r > 3.2) return bad('The banner should be about 3:1, for example 1200 × 400 (this one is ' + w + ' × ' + h + ').');
        bannerData = rd.result; removeBanner = false; showBanner(rd.result);
      };
      img.onerror = function () { bad('This image could not be read.'); };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); errs({});
    var btn = $('sd-submit'); btn.disabled = true; say('Saving…');
    var body = { session_id: sid, name: $('sd-name').value, headline: $('sd-headline').value, sentence: $('sd-sentence').value, url: $('sd-url').value, email: $('sd-email').value, notes: $('sd-notes').value };
    if (logoData) body.logo = logoData; else if (removeLogo) body.remove_logo = true;
    if (bannerData) body.banner = bannerData; else if (removeBanner) body.remove_banner = true;
    fetch('/api/sponsor/details', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).then(function (d) {
      btn.disabled = false;
      if (!d.ok) { errs(d.errors); say(d.error || 'Something went wrong. Please try again.'); if (d.locked) lock(d.error); return; }
      logoData = null; removeLogo = false; bannerData = null; removeBanner = false;
      say('Saved. You can keep editing until we approve your ad.');
      done.hidden = false; done.textContent = 'Saved. We emailed a confirmation with this page\u2019s link to ' + body.email + '. We will review your ad and email you when it goes live.';
      done.scrollIntoView({ block: 'nearest' });
    }).catch(function () { btn.disabled = false; say('We could not save your details. Check your connection and try again.'); });
  });
})();
