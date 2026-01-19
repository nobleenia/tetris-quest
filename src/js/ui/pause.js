export function bindPauseUI({ onContinue, onRestart}) {
    const btnContinue = document.querySelector("#btnContinue");
    const btnRestart = document.querySelector("#btnRestart");
    const btnRestartGame = document.querySelector("#btnRestartGame");


    // btnContinue.addEventListener("click", () => {
    //     onContinue();
    // });

    // btnRestart.addEventListener("click", () => {
    //     onRestart();
    // });

    if (btnContinue) btnContinue.addEventListener("click", onContinue);
    if (btnRestart) btnRestart.addEventListener("click", onRestart);
    if (btnRestartGame) btnRestartGame.addEventListener("click", () => onRestart());
}