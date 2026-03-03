/**
 * Stackr Quest — Leaderboard Scene
 *
 * Displays global star rankings and daily challenge rankings.
 * Falls back to "Connect to compete" when Supabase is not configured.
 */

import { hideGameUI, showGameUI } from './helpers.js';
import { isSupabaseConfigured } from '../systems/supabase.js';
import { injectAnimatedBg, destroyAnimatedBg } from '../ui/animatedBg.js';
import {
  getGlobalLeaderboard,
  getDailyLeaderboard,
  getUserGlobalRank,
} from '../systems/leaderboard.js';
import { todayKey } from '../game/dailyChallenge.js';

let containerEl = null;

export const leaderboardScene = {
  id: 'leaderboard',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="leaderboard"]');
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

async function render(ctx) {
  if (!containerEl) return;

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel leaderboard">
        <button class="leaderboard__close" data-action="back">&times;</button>
        <h2 class="overlay__title">🏆 Leaderboards</h2>

        <div class="leaderboard__tabs">
          <button class="leaderboard__tab leaderboard__tab--active" data-tab="global">⭐ Global Stars</button>
          <button class="leaderboard__tab" data-tab="daily">📅 Daily</button>
        </div>

        <div id="lb-content" class="leaderboard__content">
          <p class="leaderboard__loading">Loading…</p>
        </div>
      </div>
    </div>
  `;

  wireEvents(ctx);
  injectAnimatedBg(containerEl);

  // Load default tab
  await loadTab('global');
}

async function loadTab(tab) {
  const contentEl = document.getElementById('lb-content');
  if (!contentEl) return;

  if (!isSupabaseConfigured) {
    contentEl.innerHTML = `
      <div class="leaderboard__offline">
        <p>🔌 Backend not connected</p>
        <p class="leaderboard__hint">Leaderboards will be available once the server is configured.</p>
      </div>
    `;
    return;
  }

  contentEl.innerHTML = '<p class="leaderboard__loading">Loading…</p>';

  if (tab === 'global') {
    const [board, myRank] = await Promise.all([
      getGlobalLeaderboard(50),
      getUserGlobalRank(),
    ]);

    if (!board.length) {
      contentEl.innerHTML = '<p class="leaderboard__empty">No entries yet. Start playing!</p>';
      return;
    }

    let html = '<ol class="leaderboard__list">';
    for (const entry of board) {
      const medals = ['🥇', '🥈', '🥉'];
      const medal = entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`;
      html += `<li class="leaderboard__row">
        <span class="leaderboard__rank">${medal}</span>
        <span class="leaderboard__name">${_esc(entry.displayName)}</span>
        <span class="leaderboard__value">⭐ ${entry.totalStars}</span>
      </li>`;
    }
    html += '</ol>';

    if (myRank) {
      html += `<p class="leaderboard__myrank">Your rank: <strong>#${myRank}</strong></p>`;
    }

    contentEl.innerHTML = html;
  }

  if (tab === 'daily') {
    const board = await getDailyLeaderboard(todayKey(), 50);

    if (!board.length) {
      contentEl.innerHTML = '<p class="leaderboard__empty">No daily results yet. Play today\'s challenge!</p>';
      return;
    }

    let html = '<ol class="leaderboard__list">';
    for (const entry of board) {
      const medals = ['🥇', '🥈', '🥉'];
      const medal = entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`;
      html += `<li class="leaderboard__row">
        <span class="leaderboard__rank">${medal}</span>
        <span class="leaderboard__name">${_esc(entry.displayName)}</span>
        <span class="leaderboard__value">${entry.score.toLocaleString()}</span>
      </li>`;
    }
    html += '</ol>';

    contentEl.innerHTML = html;
  }
}

function wireEvents(ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn?.dataset.action === 'back') {
      ctx.router.navigate('#/');
      return;
    }

    const tab = e.target.closest('[data-tab]');
    if (tab) {
      // Update active tab style
      containerEl.querySelectorAll('.leaderboard__tab').forEach((t) =>
        t.classList.remove('leaderboard__tab--active'),
      );
      tab.classList.add('leaderboard__tab--active');
      loadTab(tab.dataset.tab);
    }
  });
}

function _esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
