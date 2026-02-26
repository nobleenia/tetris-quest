export function createControls(input) {
  const DAS = 0.15; // delay before repetition (en secondes)
  const ARR = 0.05; // interval between repetitions (en secondes)
  const left = { held: false, timer: 0 };
  const right = { held: false, timer: 0 };

  function startHold(state) {
    state.held = true;
    state.timer = DAS;
  }

  function release(state) {
    state.held = false;
    state.timer = 0;
  }

  function updateDirection(dt, isDown, state) {
    if (isDown) {
      if (!state.held) startHold(state);
      else state.timer -= dt;
    } else {
      release(state);
    }
  }

  function shouldMove(state) {
    if (!state.held) return false;

    // Firts press instantly
    if (state.timer === DAS) return true;

    // Repetition
    if (state.timer <= 0) {
      state.timer += ARR;
      return true;
    }
    return false;
  }

  return {
    update(dt) {
      const leftDown =
        input.isDown('ArrowLeft') ||
        input.isDown('KeyA') ||
        input.isPressed('ArrowLeft') ||
        input.isPressed('KeyA');

      const rightDown =
        input.isDown('ArrowRight') ||
        input.isDown('KeyD') ||
        input.isPressed('ArrowRight') ||
        input.isPressed('KeyD');

      // if both directions are triggered, block the movement:
      if (leftDown && rightDown) {
        release(left);
        release(right);
        return;
      }

      updateDirection(dt, leftDown, left);
      updateDirection(dt, rightDown, right);
    },

    moveLeft() {
      return shouldMove(left);
    },

    moveRight() {
      return shouldMove(right);
    },

    softDrop() {
      return input.isDown('ArrowDown') || input.isDown('KeyS');
    },

    hardDrop() {
      return input.isPressed('ArrowUp') || input.isPressed('KeyW');
    },

    rotateCW() {
      return input.isPressed('Numpad3') || input.isPressed('KeyT');
    },

    rotateCCW() {
      return input.isPressed('Numpad0') || input.isPressed('KeyF');
    },

    hold() {
      const pressed = input.isPressed('KeyQ') || input.isPressed('ControlRight');
      if (pressed) {
        input.consume('KeyQ');
        input.consume('ControlRight');
      }
      return pressed;
    },

    pauseToggle() {
      return input.isPressed('Space') || input.isPressed('Escape');
    },
  };
}
