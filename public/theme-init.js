// Mirrors f1StoriesPage/scripts/theme-init.js so the page never flashes the wrong theme. Loaded blocking from
// index.html (an external file, so a strict Content-Security-Policy needs no 'unsafe-inline').
// Order: ?theme= → stored choice ('f1stories-theme') → OS preference → light.
// Any other stored value (e.g. a sibling app's 'auto') means "follow the OS" and is left in place.
(function () {
  var KEY = 'f1stories-theme';
  var LEGACY_KEY = 'f1-telemetry-dashboard:theme'; // pre-rework key: copied once if KEY is absent, then removed
  var t = new URLSearchParams(location.search).get('theme');
  var stored = null;
  try {
    stored = localStorage.getItem(KEY);
    var legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      if (stored === null && (legacy === 'light' || legacy === 'dark')) {
        localStorage.setItem(KEY, legacy);
        stored = legacy;
      }
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = stored;
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#1b1a19' : '#f2eee4');
})();
