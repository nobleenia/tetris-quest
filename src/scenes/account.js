/**
 * Stackr Quest — Account Scene
 *
 * User profile management:
 *   - Display name editor
 *   - Sign in with Google / email
 *   - Sign out
 *   - Cloud sync status
 */

import { hideGameUI, showGameUI } from './helpers.js';
import { isSupabaseConfigured } from '../systems/supabase.js';
import { injectAnimatedBg, destroyAnimatedBg } from '../ui/animatedBg.js';
import {
  getProfile,
  hasRealAccount,
  isAuthenticated,
  updateDisplayName,
  linkEmailPassword,
  signInWithGoogle,
  signOut,
} from '../systems/auth.js';
import { syncProgress, getLastSyncAt, isSyncing } from '../systems/cloudSync.js';
import { getTotalStars, getStats } from '../systems/progress.js';

let containerEl = null;

export const accountScene = {
  id: 'account',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="account"]');
    if (!sceneEl) return;
    containerEl = sceneEl;
    hideGameUI();
    render(ctx);
  },

  exit(_ctx) {
    if (containerEl) { destroyAnimatedBg(containerEl); containerEl.innerHTML = ''; }
    showGameUI();
  },
};

function render(ctx) {
  if (!containerEl) return;

  const profile = getProfile();
  const stats = getStats();
  const totalStars = getTotalStars();
  const lastSync = getLastSyncAt();
  const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
  const isReal = hasRealAccount();
  const isAuth = isAuthenticated();

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel account">
        <button class="account__close" data-action="back">&times;</button>
        <h2 class="overlay__title">👤 Account</h2>

        <div class="account__profile">
          <div class="account__avatar">${profile.displayName.charAt(0).toUpperCase()}</div>
          <div class="account__info">
            <input class="account__name-input" id="acc-name" type="text"
                   value="${_esc(profile.displayName)}" maxlength="30"
                   placeholder="Display Name" />
            <button class="btn btn--small" data-action="save-name">Save</button>
          </div>
          <p class="account__status">
            ${isReal ? '✅ Signed in' : isAuth ? '🔑 Anonymous' : '❌ Offline'}
          </p>
        </div>

        <div class="account__stats">
          <div class="account__stat">⭐ ${totalStars} stars</div>
          <div class="account__stat">📊 ${stats.totalLevelsCompleted} levels completed</div>
          <div class="account__stat">🧱 ${stats.totalLinesCleared} lines cleared</div>
          <div class="account__stat">👑 ${stats.totalBossesDefeated} bosses defeated</div>
        </div>

        ${!isSupabaseConfigured ? `
          <div class="account__offline">
            <p>🔌 Backend not connected</p>
            <p class="account__hint">Cloud save & sign-in will be available once the server is configured.</p>
          </div>
        ` : `
          <div class="account__cloud">
            <h3>☁️ Cloud Sync</h3>
            <p class="account__sync-status">Last sync: ${lastSyncStr}</p>
            <button class="btn btn--small" data-action="sync" ${isSyncing() ? 'disabled' : ''}>
              ${isSyncing() ? '⏳ Syncing…' : '🔄 Sync Now'}
            </button>
          </div>

          ${!isReal ? `
            <div class="account__auth">
              <h3>🔐 Upgrade Account</h3>
              <p class="account__hint">Link an account to save progress across devices.</p>
              <button class="btn" data-action="google">
                <span style="margin-right: 6px;">G</span> Sign in with Google
              </button>
              <div class="account__email-form">
                <input type="email" id="acc-email" placeholder="Email" class="account__input" />
                <input type="password" id="acc-password" placeholder="Password" class="account__input" />
                <button class="btn btn--small" data-action="email-signup">Sign Up with Email</button>
              </div>
            </div>
          ` : `
            <div class="account__auth">
              <button class="btn btn--secondary btn--small" data-action="signout">Sign Out</button>
            </div>
          `}
        `}
      </div>
    </div>
  `;

  wireEvents(ctx);
  injectAnimatedBg(containerEl);
}

function wireEvents(ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'back') {
      ctx.router.navigate('#/');
      return;
    }

    if (action === 'save-name') {
      const input = document.getElementById('acc-name');
      if (input) {
        const ok = await updateDisplayName(input.value);
        if (ok) {
          btn.textContent = '✅ Saved!';
          setTimeout(() => { btn.textContent = 'Save'; }, 1500);
        }
      }
      return;
    }

    if (action === 'sync') {
      btn.disabled = true;
      btn.textContent = '⏳ Syncing…';
      const result = await syncProgress();
      if (result) {
        btn.textContent = `✅ Synced (${result.merged} levels)`;
      } else {
        btn.textContent = '❌ Sync failed';
      }
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🔄 Sync Now';
      }, 2000);
      return;
    }

    if (action === 'google') {
      const { error } = await signInWithGoogle();
      if (error) {
        alert('Sign in failed: ' + error);
      }
      // OAuth redirect will handle the rest
      return;
    }

    if (action === 'email-signup') {
      const email = document.getElementById('acc-email')?.value;
      const password = document.getElementById('acc-password')?.value;
      if (!email || !password) {
        alert('Please enter email and password.');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      const { error } = await linkEmailPassword(email, password);
      if (error) {
        alert('Sign up failed: ' + error);
      } else {
        render(ctx); // Re-render to show updated state
      }
      return;
    }

    if (action === 'signout') {
      await signOut();
      render(ctx);
    }
  });
}

function _esc(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
