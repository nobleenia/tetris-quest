export function bindPauseUI({ onContinue, onBackToMap, onQuit }) {
  const btnContinue = document.querySelector('#btnContinue');
  const btnBackToMap = document.querySelector('#btnBackToMap');
  const btnQuit = document.querySelector('#btnQuit');
  const btnRestartGame = document.querySelector('#btnRestartGame');

  if (btnContinue) btnContinue.addEventListener('click', onContinue);
  if (btnBackToMap) btnBackToMap.addEventListener('click', onBackToMap);
  if (btnQuit) btnQuit.addEventListener('click', onQuit);
  if (btnRestartGame) btnRestartGame.addEventListener('click', () => onQuit());
}
