export function burstParticles() {
  const container = document.getElementById('tetris-particles');

  if (!container) return;

  const count = 30; // nombre de particules
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'tetris-particle';

    // Couleurs Tetris
    const colors = ['#ff0', '#0ff', '#f0f', '#0f0', '#f00', '#00f'];
    p.style.setProperty('--particle-color', colors[i % colors.length]);

    // Position initiale
    p.style.left = `${centerX}px`;
    p.style.top = `${centerY}px`;

    container.appendChild(p);

    // Direction aléatoire
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 100;

    const targetX = centerX + Math.cos(angle) * distance;
    const targetY = centerY + Math.sin(angle) * distance;

    // Animation (déclenchée au prochain frame)
    requestAnimationFrame(() => {
      p.style.transform = `translate(${targetX - centerX}px, ${targetY - centerY}px)`;
      p.style.opacity = '0';
    });

    // Suppression après animation
    setTimeout(() => p.remove(), 700);
  }
}
