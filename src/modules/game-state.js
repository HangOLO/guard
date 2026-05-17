export const STATES = Object.freeze({
  TITLE: "title",
  APPROACH: "approach",
  DIALOGUE: "dialogue",
  RUNNER: "runner",
  GAME_OVER: "gameOver",
});

const TRANSITIONS = Object.freeze({
  [STATES.TITLE]: { start: STATES.APPROACH },
  [STATES.APPROACH]: { contactSoldier: STATES.DIALOGUE },
  [STATES.DIALOGUE]: { dialogueComplete: STATES.RUNNER },
  [STATES.RUNNER]: { hitSoldier: STATES.GAME_OVER },
  [STATES.GAME_OVER]: { restart: STATES.APPROACH },
});

export function createGameState() {
  let current = STATES.TITLE;
  let score = 0;
  let soundEnabled = true;
  let runId = 0;
  const listeners = new Set();

  function snapshot() {
    return {
      current,
      score,
      soundEnabled,
      runId,
    };
  }

  function emit(type, detail = {}) {
    const event = { type, ...detail, state: snapshot() };
    listeners.forEach((listener) => listener(event));
  }

  function resetRunData() {
    score = 0;
    runId += 1;
    emit("scoreChanged", { score });
    emit("runReset", { runId });
  }

  return {
    get current() {
      return current;
    },
    get score() {
      return score;
    },
    get soundEnabled() {
      return soundEnabled;
    },
    snapshot,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    canTransition(eventName) {
      return Boolean(TRANSITIONS[current]?.[eventName]);
    },
    transition(eventName) {
      const next = TRANSITIONS[current]?.[eventName];
      if (!next) {
        return false;
      }

      if (eventName === "start" || eventName === "restart") {
        resetRunData();
      }

      const previous = current;
      current = next;
      emit("stateChanged", { previous, current, eventName });
      return true;
    },
    resetRun() {
      resetRunData();
    },
    addScore(points) {
      score += points;
      emit("scoreChanged", { score, points });
      return score;
    },
    setSoundEnabled(nextValue) {
      soundEnabled = Boolean(nextValue);
      emit("soundChanged", { soundEnabled });
      return soundEnabled;
    },
    toggleSound() {
      soundEnabled = !soundEnabled;
      emit("soundChanged", { soundEnabled });
      return soundEnabled;
    },
  };
}
