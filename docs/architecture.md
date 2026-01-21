## 🏗️ Project Architecture

```
index.html
│
src/
	│
	├── js/
	│	├── main.js
	│	│
	│	├── engine/
	│	│	├── constants.js
	│	│	├── controls.js
	│	│	├── input.js
	│	│	├── loop.js
	│	│	└── state.js
	│	│
	│	├── game/
	│	│	├── actions.js
	│	│	├── board.js
	│	│	├── dailyBest.js
	│	│	├── harddrop.js
	│	│	├── hold.js
	│	│	├── lines.js
	│	│	├── lives.js
	│	│	├── lock.js
	│	│	├── pieces.js
	│	│	├── pressure.js
	│	│	├── rotate.js
	│	│	├── rules.js
	│	│	├── score.js
	│	│	└── spawn.js
	│	│
	│	└── ui/
	│		├── dom.js
	│		├── hud.js
	│		├── lifeflash.js
	│		├── particles.js 
	│		├── pause.js
	│		├── render.js
	│		├── stylemanager.js
	│		└── tetrisflash.js
	│
	└── styles/
		├── base.css
		├── board.css
		├── hud.css
		└── overlay.css

```