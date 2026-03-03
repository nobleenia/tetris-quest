/**
 * Stackr Quest — Animated Background
 *
 * Vanilla JS equivalent of the Figma React animated background.
 * Floating tetromino shapes, gradient orbs, and sparkle particles.
 * Call `injectAnimatedBg(container)` to add it to any scene.
 * Call `destroyAnimatedBg(container)` on scene exit to clean up.
 */

const COLORS = ['#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const SHAPE_TYPES = ['square', 'L', 'T', 'Z', 'line'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.random() * (max - min) + min; }

/* ── Shape SVG builders ───────────────────────────────────────── */

function shapeHTML(type, color, size) {
  const s = size;
  const u = Math.round(s / 4);  // unit cell
  const g = 2;                   // gap
  const r = 2;                   // border-radius

  const cell = (x, y) =>
    `<rect x="${x}" y="${y}" width="${u}" height="${u}" rx="${r}" fill="${color}"/>`;

  switch (type) {
    case 'square':
      return `<svg width="${u*2+g}" height="${u*2+g}" viewBox="0 0 ${u*2+g} ${u*2+g}">
        ${cell(0,0)}${cell(u+g,0)}${cell(0,u+g)}${cell(u+g,u+g)}
      </svg>`;
    case 'L':
      return `<svg width="${u*2+g}" height="${u*3+g*2}" viewBox="0 0 ${u*2+g} ${u*3+g*2}">
        ${cell(0,0)}${cell(0,u+g)}${cell(0,(u+g)*2)}${cell(u+g,(u+g)*2)}
      </svg>`;
    case 'T':
      return `<svg width="${u*3+g*2}" height="${u*2+g}" viewBox="0 0 ${u*3+g*2} ${u*2+g}">
        ${cell(0,0)}${cell(u+g,0)}${cell((u+g)*2,0)}${cell(u+g,u+g)}
      </svg>`;
    case 'Z':
      return `<svg width="${u*3+g*2}" height="${u*2+g}" viewBox="0 0 ${u*3+g*2} ${u*2+g}">
        ${cell(0,0)}${cell(u+g,0)}${cell(u+g,u+g)}${cell((u+g)*2,u+g)}
      </svg>`;
    case 'line':
      return `<svg width="${u}" height="${u*4+g*3}" viewBox="0 0 ${u} ${u*4+g*3}">
        ${cell(0,0)}${cell(0,u+g)}${cell(0,(u+g)*2)}${cell(0,(u+g)*3)}
      </svg>`;
    default:
      return '';
  }
}

/* ── Main ─────────────────────────────────────────────────────── */

/**
 * Inject the animated background into a container element.
 * The container should have `position: relative` and `overflow: hidden`.
 */
export function injectAnimatedBg(container) {
  if (!container) return;

  // Avoid double-injection
  if (container.querySelector('.abg')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'abg';
  wrapper.setAttribute('aria-hidden', 'true');

  // 1. Base gradient
  const grad = document.createElement('div');
  grad.className = 'abg__gradient';
  wrapper.appendChild(grad);

  // 2. Animated gradient orbs
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = `abg__orb abg__orb--${i}`;
    wrapper.appendChild(orb);
  }

  // 3. Floating tetromino shapes
  const shapeCount = 15;
  for (let i = 0; i < shapeCount; i++) {
    const type = pick(SHAPE_TYPES);
    const color = pick(COLORS);
    const size = rand(30, 70);
    const x = rand(0, 100);
    const y = rand(0, 100);
    const dur = rand(18, 38);
    const delay = rand(0, 8);
    const startRot = Math.floor(rand(0, 360));

    const el = document.createElement('div');
    el.className = 'abg__shape';
    el.innerHTML = shapeHTML(type, color, size);
    el.style.cssText = `
      left:${x}%;top:${y}%;
      --dur:${dur}s;--delay:${delay}s;
      --dx:${rand(-15,15)}%;--dy:${rand(-20,20)}%;
      --rot0:${startRot}deg;--rot1:${startRot + 360}deg;
    `;
    wrapper.appendChild(el);
  }

  // 4. Sparkle particles
  for (let i = 0; i < 20; i++) {
    const sp = document.createElement('div');
    sp.className = 'abg__sparkle';
    sp.style.cssText = `
      left:${rand(0,100)}%;top:${rand(0,100)}%;
      --sp-dur:${rand(2,5)}s;--sp-delay:${rand(0,6)}s;
    `;
    wrapper.appendChild(sp);
  }

  // Insert at the very beginning of the container
  container.prepend(wrapper);

  // Mouse-tracking orb (orb 0)
  const orb0 = wrapper.querySelector('.abg__orb--0');
  if (orb0) {
    const onMove = (e) => {
      const px = (e.clientX / window.innerWidth) * 100;
      const py = (e.clientY / window.innerHeight) * 100;
      orb0.style.left = `${px}%`;
      orb0.style.top = `${py}%`;
    };
    wrapper._mouseHandler = onMove;
    window.addEventListener('mousemove', onMove, { passive: true });
  }
}

/**
 * Remove the animated background and clean up listeners.
 */
export function destroyAnimatedBg(container) {
  if (!container) return;
  const bg = container.querySelector('.abg');
  if (!bg) return;
  if (bg._mouseHandler) {
    window.removeEventListener('mousemove', bg._mouseHandler);
  }
  bg.remove();
}
