export function flashTetris() {
	const el = document.getElementById("tetris-flash");
	if (!el) return;

	el.classList.remove("hidden");

	// Force reflow to apply transition
	void el.offsetWidth;

	el.classList.add("active");

	setTimeout(() => {
		el.classList.remove("active");

		// wait for the fade-out to end
		setTimeout(() => {
			el.classList.add("hidden");
		}, 150);
	}, 200);
}
