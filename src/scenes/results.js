/**
 * Stackr Quest — Results Scene
 *
 * Dual-purpose: shows both level COMPLETE and level FAIL results.
 * Level complete: stars animate in, score tally, coins earned, "Next Level".
 * Level fail: reason shown, retry option, "Back to Map".
 */

import {
  recordLevelResult,
  recordLevelFailure,
  advanceHighest,
  getLives,
  getCoins,
  spendLife,
  addStats,
} from '../systems/progress.js';
import { evaluateAchievements } from '../systems/achievements.js';

let containerEl = null;

export const resultsScene = {
  id: 'results',

  enter(params, ctx) {
    const sceneEl = document.querySelector('[data-scene="results"]');
    if (!sceneEl) return;
    containerEl = sceneEl;

    const result = params.result || ctx._lastResult;
    if (!result) {
      ctx.router.navigate('#/map');
      return;
    }

    if (result.outcome === 'complete') {
      renderComplete(result, ctx);
    } else {
      renderFail(result, ctx);
    }
  },

  exit(_ctx) {
    if (containerEl) containerEl.innerHTML = '';
  },
};

// ─── Level Complete ──────────────────────────────────────────────────

function renderComplete(result, ctx) {
  // Record progress
  const isFirstClear = true; // progress.recordLevelResult handles dedup
  const progressResult = recordLevelResult(
    result.levelId,
    result.stars,
    result.score,
    isFirstClear,
  );

  // Add stats
  addStats({
    lines: result.linesCleared,
    pieces: result.pieceCount,
    bossesDefeated: result.levelId?.endsWith('-20') ? 1 : 0,
  });

  // Advance highest reached to next level
  const nextLevel = (result.levelNum || 1) + 1;
  const nextWorld = nextLevel > 20 ? (result.worldId || 1) + 1 : result.worldId || 1;
  const nextLevelNum = nextLevel > 20 ? 1 : nextLevel;
  advanceHighest(nextWorld, nextLevelNum);

  // Evaluate achievements
  const newAchievements = evaluateAchievements({ result, state: ctx.state });

  const coins = getCoins();
  const { stars } = result;

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel results results--complete">
        <h2 class="overlay__title results__title">🎉 Level Complete!</h2>
        <p class="results__level">${result.levelId} — ${result.mode}</p>

        <div class="results__stars" id="results-stars">
          <span class="results__star ${stars >= 1 ? 'results__star--earned' : ''}" data-delay="0">⭐</span>
          <span class="results__star ${stars >= 2 ? 'results__star--earned' : ''}" data-delay="1">⭐</span>
          <span class="results__star ${stars >= 3 ? 'results__star--earned' : ''}" data-delay="2">⭐</span>
        </div>

        ${stars >= 3 ? '<div class="results__perfect">✨ Perfect! ✨</div>' : ''}

        <div class="results__tally">
          <div class="results__row">
            <span>Score</span>
            <span class="results__value" id="results-score">0</span>
          </div>
          <div class="results__row">
            <span>Lines</span>
            <span class="results__value">${result.linesCleared}</span>
          </div>
          <div class="results__row">
            <span>Pieces</span>
            <span class="results__value">${result.pieceCount}</span>
          </div>
          <div class="results__row">
            <span>Time</span>
            <span class="results__value">${formatTime(result.elapsedSec)}</span>
          </div>
          <div class="results__row">
            <span>Max Combo</span>
            <span class="results__value">${result.maxCombo}×</span>
          </div>
          <div class="results__row results__row--coins">
            <span>Coins Earned</span>
            <span class="results__value">+${progressResult.coinsEarned} 🪙</span>
          </div>
        </div>

        ${
          newAchievements.length > 0
            ? `
          <div class="results__achievements">
            <h3>Achievements Unlocked!</h3>
            ${newAchievements.map((a) => `<div class="results__achievement">${a.icon} ${a.name} (+${a.coins} 🪙)</div>`).join('')}
          </div>
        `
            : ''
        }

        <div class="results__actions">
          ${
            nextLevel <= 20
              ? `<button class="btn results__next-btn" data-action="next">
                  Next Level →
                </button>`
              : `<button class="btn results__next-btn" data-action="map">
                  World Complete! 🎉
                </button>`
          }
          <button class="btn btn--secondary" data-action="retry">
            Replay
          </button>
          <button class="btn btn--secondary" data-action="map">
            Back to Map
          </button>
        </div>

        <p class="results__balance">Balance: ${coins} 🪙</p>
      </div>
    </div>
  `;

  // Animate score tally
  animateScore('results-score', result.score, 1200);

  // Animate stars with delay
  animateStars();

  wireEvents(result, ctx);
}

// ─── Level Fail ──────────────────────────────────────────────────────

function renderFail(result, ctx) {
  // Record failure
  if (result.levelId) {
    recordLevelFailure(result.levelId);
  }

  // Add stats even on failure
  addStats({
    lines: result.linesCleared,
    pieces: result.pieceCount,
  });

  const { lives } = getLives();
  // Shortfall info
  const shortfall = getShortfallMessage(result, ctx.state);

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel results results--fail">
        <h2 class="overlay__title results__title">💔 Level Failed</h2>
        <p class="results__level">${result.levelId || 'Classic'}</p>

        ${shortfall ? `<p class="results__shortfall">${shortfall}</p>` : ''}

        <div class="results__tally">
          <div class="results__row">
            <span>Score</span>
            <span class="results__value">${result.score}</span>
          </div>
          <div class="results__row">
            <span>Lines</span>
            <span class="results__value">${result.linesCleared}</span>
          </div>
          <div class="results__row">
            <span>Time</span>
            <span class="results__value">${formatTime(result.elapsedSec)}</span>
          </div>
        </div>

        <div class="results__actions">
          <button class="btn ${lives <= 0 ? 'btn--disabled' : ''}" data-action="retry"
                  ${lives <= 0 ? 'disabled' : ''}>
            🔄 Try Again ${lives > 0 ? `(❤️ ${lives - 1} left)` : '(No Lives!)'}
          </button>
          <button class="btn btn--secondary" data-action="map">
            Back to Map
          </button>
        </div>

        ${
          lives <= 0
            ? `
          <div class="results__no-lives">
            <p>Out of lives!</p>
            <button class="btn btn--small" data-action="shop">Buy Lives 🛒</button>
            <p class="results__regen-hint">Lives regenerate over time</p>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  wireEvents(result, ctx);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getShortfallMessage(result, state) {
  if (!state?.objective) return null;
  const obj = state.objective;
  const type = obj.type;

  if (type === 'clearLines') {
    const diff = obj.target - (result.linesCleared || 0);
    if (diff > 0) return `Needed ${diff} more line${diff > 1 ? 's' : ''}!`;
  }
  if (type === 'reachScore') {
    const diff = obj.target - (result.score || 0);
    if (diff > 0) return `Needed ${diff} more points!`;
  }
  if (type === 'survive') {
    const diff = obj.target - (result.elapsedSec || 0);
    if (diff > 0) return `Needed ${Math.ceil(diff)} more seconds!`;
  }
  if (type === 'comboChain') {
    const diff = obj.target - (result.maxCombo || 0);
    if (diff > 0) return `Needed ${diff} more combo chain!`;
  }
  return null;
}

function formatTime(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function animateScore(elId, target, durationMs) {
  const el = document.getElementById(elId);
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = String(Math.floor(eased * target));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateStars() {
  const stars = document.querySelectorAll('.results__star--earned');
  stars.forEach((star, i) => {
    star.style.opacity = '0';
    star.style.transform = 'scale(0)';
    setTimeout(() => {
      star.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
      star.style.opacity = '1';
      star.style.transform = 'scale(1.2)';
      setTimeout(() => {
        star.style.transform = 'scale(1)';
      }, 200);
    }, 400 + i * 500);
  });
}

function wireEvents(result, ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'map') {
      ctx.router.navigate(`#/map/${result.worldId || 1}`);
      return;
    }

    if (action === 'retry') {
      // Spend a life for adventure mode
      if (result.mode === 'adventure') {
        const ok = spendLife();
        if (!ok) return; // shouldn't happen if button is enabled
      }
      ctx.router.navigate(`#/play/${result.levelId}`);
      return;
    }

    if (action === 'next') {
      const nextLevel = (result.levelNum || 1) + 1;
      if (nextLevel <= 20) {
        ctx.router.navigate(`#/briefing/${result.worldId}-${nextLevel}`);
      } else {
        ctx.router.navigate(`#/map/${(result.worldId || 1) + 1}`);
      }
      return;
    }

    if (action === 'shop') {
      ctx.router.navigate('#/shop');
    }
  });
}
