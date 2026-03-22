// frontend/js/sfauth.js — Shared auth helpers for all pages

const SF_AUTH = {
  getToken: () => localStorage.getItem('sf_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('sf_user')||'null'); } catch{ return null; } },
  isLoggedIn: () => !!localStorage.getItem('sf_token'),
  logout: () => { localStorage.removeItem('sf_token'); localStorage.removeItem('sf_user'); window.location.href = 'login.html'; },

  // Inject user into navbar
  injectNavUser() {
    const user = this.getUser();
    const navR = document.querySelector('.nav-r');
    if (!navR) return;

    // Remove old login/get started pills
    navR.querySelectorAll('.npo, .nps').forEach(el => el.remove());

    if (user) {
      // Logged in — show avatar + name + logout
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:10px;';
      const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      wrapper.innerHTML = `
        <a href="community.html" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;border:1px solid rgba(61,186,114,.25);background:rgba(61,186,114,.08);color:var(--g);font-size:.78rem;font-weight:600;text-decoration:none;transition:all .25s;" onmouseover="this.style.background='rgba(61,186,114,.16)'" onmouseout="this.style.background='rgba(61,186,114,.08)'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          Community
        </a>
        <div style="position:relative;" id="userMenuWrap">
          <button onclick="document.getElementById('userDropdown').classList.toggle('open')" style="display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:20px;border:1px solid rgba(232,237,229,.15);background:rgba(255,255,255,.05);cursor:pointer;color:var(--tx);font-family:Outfit,sans-serif;font-size:.82rem;font-weight:500;">
            ${user.avatar
              ? `<img src="${user.avatar}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(61,186,114,.4);">`
              : `<div style="width:26px;height:26px;border-radius:50%;background:var(--g);color:#0a0e0a;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;">${initials}</div>`}
            ${user.name.split(' ')[0]}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div id="userDropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--dk2);border:1px solid var(--bd2);border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.4);min-width:180px;z-index:1000;">
            <div style="padding:14px 16px;border-bottom:1px solid var(--bd);">
              <div style="font-size:.82rem;font-weight:600;color:var(--tx);">${user.name}</div>
              <div style="font-size:.72rem;color:var(--txm);margin-top:2px;">${user.state||'Tamil Nadu'}</div>
            </div>
            <a href="community.html" style="display:flex;align-items:center;gap:9px;padding:11px 16px;color:var(--tx);text-decoration:none;font-size:.82rem;transition:background .2s;" onmouseover="this.style.background='rgba(61,186,114,.08)'" onmouseout="this.style.background='none'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> Community
            </a>
            <button onclick="SF_AUTH.logout()" style="display:flex;align-items:center;gap:9px;padding:11px 16px;color:#f87171;background:none;border:none;cursor:pointer;font-family:Outfit,sans-serif;font-size:.82rem;width:100%;text-align:left;transition:background .2s;" onmouseover="this.style.background='rgba(248,113,113,.08)'" onmouseout="this.style.background='none'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout
            </button>
          </div>
        </div>`;
      const hburg = navR.querySelector('.hburg');
      if (hburg) navR.insertBefore(wrapper, hburg);
      else navR.appendChild(wrapper);

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        const wrap = document.getElementById('userMenuWrap');
        if (wrap && !wrap.contains(e.target)) document.getElementById('userDropdown').classList.remove('open');
      });
    } else {
      // Not logged in — show login button
      const loginBtn = document.createElement('a');
      loginBtn.href = 'login.html';
      loginBtn.className = 'npill nps';
      loginBtn.textContent = 'Login';
      const hburg = navR.querySelector('.hburg');
      if (hburg) navR.insertBefore(loginBtn, hburg);
      else navR.appendChild(loginBtn);
    }
  },

  // Update AcqireAI greeting with farmer name
  updateChatbotGreeting() {
    const user = this.getUser();
    if (!user) return;
    // Override the chatbot welcome message
    window._SF_FARMER_NAME = user.name.split(' ')[0];
    window._SF_FARMER_STATE = user.state || 'Tamil Nadu';
    window._SF_FARMER_CROPS = (user.crops||[]).join(', ');
  }
};

// Auto-inject on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  SF_AUTH.injectNavUser();
  SF_AUTH.updateChatbotGreeting();
});

// Also update AcqireAI system prompt context
document.addEventListener('DOMContentLoaded', function() {
  const user = SF_AUTH.getUser();
  if (user) {
    window._SF_USER_CONTEXT = `The farmer's name is ${user.name}. Always address them as "${user.name.split(' ')[0]} sir". They farm in ${user.state||'Tamil Nadu'}${user.village ? ', ' + user.village : ''}. Their crops: ${(user.crops||[]).join(', ')||'not specified'}.`;
  }
});