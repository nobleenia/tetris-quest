export function createInput() {
	const keys = new Set();
	const pressedOnce = new Set();

		
	window.addEventListener("keydown", (event) => {
		// Prevent page scrolling with arrow keys and Spacebaar
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
			event.preventDefault();
		}

		// First press this frame
		if (!keys.has(event.code)) {
			pressedOnce.add(event.code);
		}

		keys.add(event.code);
	});

	window.addEventListener("keyup", (event) => {
		keys.delete(event.code);
	});

	return {
		// True as long as the key is held
		isDown(code) {
			return keys.has(code);
		},
		// debugging helper
		/*snapshot() {
			return Array.from(keys);
		}*/
		// True only on the first frame the key was pressed
		isPressed(code) {
			return pressedOnce.has(code);
		}, 
		// Consume a key immediately (important for HOLD)
		consume(code) {
			pressedOnce.delete(code);
			keys.delete(code);
		}, 
		// Called once per frame to reset "pressed once" keys
		endFrame() {
			pressedOnce.clear();
		}
	};
}