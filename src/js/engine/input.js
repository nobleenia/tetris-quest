export function createInput() {
	const keys = new Set();
	const pressedOnce = new Set();

		
	window.addEventListener("keydown", (event) => {
		// Prevent page scrolling with arrow keys and Spacebaar
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
			event.preventDefault();
		}

		if (!keys.has(event.code)) {
			pressedOnce.add(event.code);
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
		/*snapshot() {
			return Array.from(keys);
		}*/
		isPressed(code) {
			return pressedOnce.has(code);
		}, 
		endFrame() {
			pressedOnce.clear();
		}
	};
}