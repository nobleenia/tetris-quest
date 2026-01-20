export function applyStyle(style) {
	document.body.classList.remove("style-modern", "style-gameboy");

	if (style === "gameboy") {
		document.body.classList.add("style-gameboy");
	} else {
		document.body.classList.add("style-modern");
	}
}
