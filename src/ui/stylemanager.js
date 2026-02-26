export function applyStyle(style) {
  document.body.classList.remove('style-modern', 'style-gameboy', 'style-neon', 'style-vaporwave');

  switch (style) {
    case 'gameboy':
      document.body.classList.add('style-gameboy');
      break;
    case 'neon':
      document.body.classList.add('style-neon');
      break;
    case 'vaporwave':
      document.body.classList.add('style-vaporwave');
      break;
    case 'modern':
    default:
      document.body.classList.add('style-modern');
      break;
  }
}
