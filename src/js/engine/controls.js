
export function createControls(input) {
    let prev = {
        left: false,
        right: false,
        rotateCW: false,
        rotateCCW: false,
        hardDrop: false,
        hold: false,
        pause: false,
    };

    return {
        update() {
            // rien à faire ici pour l’instant, mais utile si tu ajoutes DAS/ARR
        },

        moveLeftOnce() {
            const now = input.isDown("ArrowLeft");
            const fire = now && !prev.left;
            prev.left = now;
            return fire;
        },

        moveRightOnce() {
            const now = input.isDown("ArrowRight");
            const fire = now && !prev.right;
            prev.right = now;
            return fire;
        },

        softDrop() {
            return input.isDown("ArrowDown");
        },

        hardDrop() {
            const now = input.isPressed("ArrowUp");
            return now;
        },

        rotateCW() {
            const now = input.isPressed("Numpad3") || input.isPressed("KeyH");
            return now;
        },

        rotateCCW() {
            const now = input.isPressed("Numpad0") || input.isPressed("KeyB");
            return now;
        },

        hold() {
            const now = input.isPressed("KeyC") || input.isPressed("ControlRight");
            return now;
        },

        pauseToggle() {
            const now = input.isPressed("Space") || input.isPressed("Escape");
            return now;
        }
    };
}
