export function  createLoop({ onUpdate, onRender, onPerf, isPaused }) {
    let rafId = 0;
    let lastTs = 0;

    // FPS estimation over a short window
    let fpsFrames = 0;
    let fpsAcc = 0;
    let fpsValue = 0;

    function frame(ts) {
        rafId = requestAnimationFrame(frame);

        const frameStart = performance.now();

        if (lastTs === 0) lastTs = ts;
        let dt = (ts - lastTs) / 1000;
        lastTs = ts;

        // Clamp dt to avoid huge jumps (tab switch, breakpoint, etc)
        dt = Math.min(dt, 0.05);

        // Pause gating: skip update but still render + perf measuring
        if (!isPaused()) {
            onUpdate(dt);
        }

        onRender();

        const frameMs = performance.now() - frameStart;

        // Update FPS estimate
        fpsFrames += 1;
        fpsAcc += dt;
        if (fpsAcc >= 0.5) {
            fpsValue = Math.round(fpsFrames / fpsAcc);
            fpsFrames = 0;
            fpsAcc = 0;
        }

        onPerf({
            frameMs,
            fps: fpsValue,
        });
    }

    return {
        start() {
            if (rafId) return; // already running
            rafId = requestAnimationFrame(frame);
        },
        stop() {
            if (!rafId) return; // already stopped
            cancelAnimationFrame(rafId);
            rafId = 0;
            lastTs = 0;
        },
    };
}