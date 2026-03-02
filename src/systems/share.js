/**
 * Stackr Quest — Share Feature
 *
 * Generates a shareable image card and text for level results.
 * Uses Canvas API to render the card, Web Share API on mobile,
 * and clipboard fallback on desktop.
 */

// ─── Theme colours for card backgrounds ──────────────────────────────
const THEME_GRADIENTS = {
  modern:     ['#1e293b', '#0f172a'],
  gameboy:    ['#306230', '#0f380f'],
  deepsea:    ['#0c4a6e', '#082f49'],
  neon:       ['#1e1b4b', '#0f0a2e'],
  volcano:    ['#7c2d12', '#431407'],
  vaporwave:  ['#4a1942', '#2d1040'],
  storm:      ['#1e3a5f', '#0f1729'],
  arctic:     ['#164e63', '#0c2d3e'],
  cosmos:     ['#1a1040', '#0a0520'],
  nexus:      ['#1f1f1f', '#0a0a0a'],
};

const THEME_ACCENTS = {
  modern:     '#60a5fa',
  gameboy:    '#9bbc0f',
  deepsea:    '#22d3ee',
  neon:       '#e879f9',
  volcano:    '#fb923c',
  vaporwave:  '#f472b6',
  storm:      '#a78bfa',
  arctic:     '#67e8f9',
  cosmos:     '#c084fc',
  nexus:      '#fbbf24',
};

/**
 * Generate a share card as a Blob (PNG image).
 * @param {object} result — level result data
 * @param {string} result.levelId
 * @param {string} result.levelName
 * @param {number} result.stars
 * @param {number} result.score
 * @param {number} result.linesCleared
 * @param {number} result.maxCombo
 * @param {string} result.theme — CSS theme name
 * @param {string} result.worldName
 * @returns {Promise<Blob>}
 */
export async function generateShareCard(result) {
  const W = 600;
  const H = 340;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const theme = result.theme || 'modern';
  const [bg1, bg2] = THEME_GRADIENTS[theme] || THEME_GRADIENTS.modern;
  const accent = THEME_ACCENTS[theme] || THEME_ACCENTS.modern;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg1);
  grad.addColorStop(1, bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Accent bar at top
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 4);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Fredoka", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Stackr Quest', 24, 44);

  // Subtitle — world + level
  ctx.fillStyle = accent;
  ctx.font = '16px "Fredoka", "Segoe UI", sans-serif';
  ctx.fillText(`${result.worldName || 'World'} — ${result.levelName || result.levelId}`, 24, 70);

  // Stars
  const starY = 110;
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < result.stars ? '#fbbf24' : 'rgba(255,255,255,0.15)';
    ctx.fillText('★', W / 2 - 50 + i * 50, starY);
  }

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Fredoka", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(result.score.toLocaleString(), W / 2, 175);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px "Fredoka", "Segoe UI", sans-serif';
  ctx.fillText('SCORE', W / 2, 195);

  // Stats row
  const statsY = 240;
  const stats = [
    { label: 'Lines', value: result.linesCleared },
    { label: 'Combo', value: `${result.maxCombo}×` },
    { label: 'Stars', value: `${result.stars}/3` },
  ];

  ctx.textAlign = 'center';
  stats.forEach((s, i) => {
    const x = 120 + i * 180;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Fredoka", "Segoe UI", sans-serif';
    ctx.fillText(String(s.value), x, statsY);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px "Fredoka", "Segoe UI", sans-serif';
    ctx.fillText(s.label.toUpperCase(), x, statsY + 18);
  });

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px "Fredoka", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('stackr-quest.vercel.app', W / 2, H - 14);

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Generate share text for copy-to-clipboard.
 * @param {object} result
 * @returns {string}
 */
export function generateShareText(result) {
  const starStr = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
  return [
    `🧩 Stackr Quest — ${result.levelId}`,
    `${starStr} | Score: ${result.score.toLocaleString()}`,
    `Lines: ${result.linesCleared} | Combo: ${result.maxCombo}×`,
    '',
    'Play free → stackr-quest.vercel.app',
  ].join('\n');
}

/**
 * Share level result using Web Share API (with image) or clipboard fallback.
 * @param {object} result — same shape as generateShareCard
 * @returns {Promise<'shared' | 'copied' | 'failed'>}
 */
export async function shareResult(result) {
  try {
    const blob = await generateShareCard(result);
    const text = generateShareText(result);

    // Try Web Share API with file support (mobile)
    if (navigator.canShare) {
      const file = new File([blob], 'stackr-quest-result.png', { type: 'image/png' });
      const shareData = {
        title: 'Stackr Quest Result',
        text,
        files: [file],
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return 'shared';
      }
    }

    // Fallback: Web Share without file
    if (navigator.share) {
      await navigator.share({
        title: 'Stackr Quest Result',
        text,
        url: 'https://stackr-quest.vercel.app',
      });
      return 'shared';
    }

    // Final fallback: copy text to clipboard
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (err) {
    if (err.name === 'AbortError') return 'failed'; // User cancelled
    console.warn('[share] Share failed:', err);

    // Last resort: try clipboard
    try {
      const text = generateShareText(result);
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
