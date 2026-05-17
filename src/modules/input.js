import { STATES } from "./game-state.js";

const POINTER_END_EVENTS = ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"];

export function createInput({ targets, getState }) {
  const listeners = new Set();
  const heldActions = new Map();
  let clickLockUntil = 0;

  function emit(type, phase = "pressed", source = "unknown") {
    const event = {
      type,
      phase,
      source,
      at: performance.now(),
    };
    listeners.forEach((listener) => listener(event));
  }

  function emitOnce(type, source) {
    const now = performance.now();
    if (now < clickLockUntil) {
      return;
    }
    clickLockUntil = now + 240;
    emit(type, "pressed", source);
  }

  function bindTap(button, action) {
    button?.addEventListener("click", (event) => {
      event.preventDefault();
      emitOnce(action, "tap");
    });
  }

  function bindHold(button, action) {
    if (!button) {
      return;
    }

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      if (heldActions.get(action)) {
        return;
      }
      heldActions.set(action, true);
      emit(action, "pressed", "pointer");
    });

    POINTER_END_EVENTS.forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (!heldActions.get(action)) {
          return;
        }
        heldActions.set(action, false);
        emit(action, "released", "pointer");
      });
    });
  }

  function preventLongPressSelection(button) {
    if (!button) {
      return;
    }

    ["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
      });
    });
  }

  bindTap(targets.startButton, "start");
  bindTap(targets.restartButton, "restart");
  bindTap(targets.soundButton, "toggleSound");
  bindTap(targets.dialogueNextButton, "start");
  bindTap(targets.interactButton, "interact");
  bindHold(targets.moveLeftButton, "moveLeft");
  bindHold(targets.moveRightButton, "moveRight");
  bindHold(targets.duckButton, "duck");
  preventLongPressSelection(targets.duckButton);
  bindTap(targets.jumpButton, "jump");

  const keyMap = new Map([
    ["ArrowLeft", "moveLeft"],
    ["KeyA", "moveLeft"],
    ["ArrowRight", "moveRight"],
    ["KeyD", "moveRight"],
    ["ArrowDown", "duck"],
    ["KeyS", "duck"],
  ]);

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    if (keyMap.has(event.code)) {
      const action = keyMap.get(event.code);
      heldActions.set(action, true);
      emit(action, "pressed", "keyboard");
      event.preventDefault();
      return;
    }

    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
      emit("jump", "pressed", "keyboard");
      event.preventDefault();
      return;
    }

    if (event.code === "Enter") {
      const current = getState();
      if (current === STATES.GAME_OVER) {
        emitOnce("restart", "keyboard");
      } else {
        emitOnce("start", "keyboard");
      }
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (!keyMap.has(event.code)) {
      return;
    }
    const action = keyMap.get(event.code);
    heldActions.set(action, false);
    emit(action, "released", "keyboard");
    event.preventDefault();
  });

  return {
    onAction(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
