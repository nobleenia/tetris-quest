export function bindPauseUI({ onContinue, onRestart}) {
    const btnContinue = document.querySelector("#btnContinue");
    const btnRestart = document.querySelector("#btnRestart");

    btnContinue.addEventListener("click", () => {
        onContinue();
    });

    btnRestart.addEventListener("click", () => {
        onRestart();
    });
}