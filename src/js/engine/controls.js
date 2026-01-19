
export function createControls(input) {
    /*let prev = {
        left: false,
        right: false,
        rotateCW: false,
        rotateCCW: false,
        hardDrop: false,
        hold: false,
        pause: false,
    };*/
	const DAS = 0.15; // delay before repetition (en secondes)
	const ARR = 0.05; // interval between repetitions (en secondes) 
	let leftState = { held: false, timer: 0 };
	let rightState = { held: false, timer: 0 };

    return {
		update(dt) { 
			// LEFT
			if (input.isDown("ArrowLeft")) {
				if (!leftState.held) {
					leftState.held = true;
					leftState.timer = DAS;
				} else {
					leftState.timer -= dt;
				}
			} else {
				leftState.held = false;
			}
			
			// RIGHT
			if (input.isDown("ArrowRight")) {
				if (!rightState.held) {
					rightState.held = true;
					rightState.timer = DAS;
				} else {
					rightState.timer -= dt;
				}
			} else {
				rightState.held = false;
			}
		}, 
		
		moveLeft(dt) {
			if (!input.isDown("ArrowLeft")) return false;
			// first keydown
			if (leftState.timer === DAS) return true;
			// Repetition
			if (leftState.timer <= 0) {
				leftState.timer += ARR;
				return true;
			}
			return false;
		}, 
		
		moveRight(dt) {
			if (!input.isDown("ArrowRight")) return false;
			
			if (rightState.timer === DAS) return true;
			
			if (rightState.timer <= 0) {
				rightState.timer += ARR;
				return true;
			}
			return false;
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
