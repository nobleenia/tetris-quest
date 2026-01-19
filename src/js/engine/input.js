export function createInput() {
    const keys = new Set();

    window.addEventListener("keydown", (event) => {
        // Prevemt page scrolling with arrow keys and Spacebaar
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
        keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
        keys.delete(event.code);
    });

    return {
        isDown(code) {
            return keys.has(code);
        },
        // debugging helper
        snapshot() {
            return Array.from(keys);
        }
    };
}