let el = null;
let timeoutId = null;

export function triggerLifeFlash() {
  if (!el) {
    el = document.createElement('div');
    el.className = 'life-flash-overlay';
    document.body.appendChild(el);
  }

  // Activate effect
  el.classList.add('active');

  // remove effect at 300ms
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    el.classList.remove('active');
  }, 300);
}
