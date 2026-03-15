// smartfarm.js — SmartFarm AI Shared Module
// Theme toggle + AcqireAI language sync

// ── Apply saved theme immediately before DOM paints ───────────────
(function() {
  var t = localStorage.getItem('sf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function toggleTheme() {
  var html = document.documentElement;
  var curr = html.getAttribute('data-theme') || 'dark';
  var next = curr === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sf_theme', next);
  document.querySelectorAll('.theme-toggle-btn').forEach(function(btn) {
    btn.innerHTML = next === 'dark' ? ICONS.moon : ICONS.sun;
    btn.title = next === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}

// ── Language (for AcqireAI chatbot AI responses) ──────────────────
var SF_LANG = localStorage.getItem('sf_lang') || 'en';
function getLang() { return SF_LANG; }
function langPromptSuffix() {
  return SF_LANG === 'ta'
    ? '\n\nமுக்கியம்: முழு பதிலையும் தமிழில் எழுதுங்கள். விவசாயி புரிந்துகொள்ளும் எளிய தமிழ் பயன்படுத்துங்கள்.'
    : '';
}

// ── Icons ─────────────────────────────────────────────────────────
var ICONS = {
  sun:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
};

// ── Inject theme toggle button only ──────────────────────────────
function injectNavControls() {
  var navR = document.querySelector('.nav-r');
  if (!navR || document.getElementById('sfThemeBtn')) return;

  var isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';

  var themeBtn = document.createElement('button');
  themeBtn.id = 'sfThemeBtn';
  themeBtn.className = 'theme-toggle-btn nav-ctrl-btn';
  themeBtn.onclick = toggleTheme;
  themeBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  themeBtn.innerHTML = isDark ? ICONS.moon : ICONS.sun;
  themeBtn.style.cssText = 'width:34px;height:34px;border-radius:50%;border:1px solid rgba(232,237,229,0.2);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--tx);transition:all .25s;flex-shrink:0;';

  themeBtn.addEventListener('mouseenter', function() {
    themeBtn.style.borderColor = 'var(--g)';
    themeBtn.style.color = 'var(--g)';
  });
  themeBtn.addEventListener('mouseleave', function() {
    themeBtn.style.borderColor = 'rgba(232,237,229,0.2)';
    themeBtn.style.color = 'var(--tx)';
  });

  var hburg = navR.querySelector('.hburg');
  if (hburg) navR.insertBefore(themeBtn, hburg);
  else navR.appendChild(themeBtn);
}

document.addEventListener('DOMContentLoaded', function() {
  injectNavControls();
});