const LINES = [
  {
    speaker: "婦人",
    text: "我們前來向逝者致意。請讓我們靠近封住的墓。",
  },
  {
    speaker: "羅馬守衛",
    text: "軍令嚴格。今晚任何人都不得越過守衛線。",
  },
  {
    speaker: "旁白",
    text: "守衛重重，想暗中偷走屍體幾乎不可能。",
  },
];

export function createDialogue() {
  const listeners = new Map();
  let active = false;
  let index = 0;

  function emit(type, detail = {}) {
    listeners.get(type)?.forEach((listener) => listener(detail));
  }

  function current() {
    return {
      ...LINES[index],
      index,
      total: LINES.length,
    };
  }

  return {
    on(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(listener);
      return () => listeners.get(type)?.delete(listener);
    },
    reset() {
      active = false;
      index = 0;
    },
    start() {
      active = true;
      index = 0;
      emit("lineChanged", current());
    },
    current,
    advance() {
      if (!active) {
        return;
      }

      if (index < LINES.length - 1) {
        index += 1;
        emit("lineChanged", current());
        return;
      }

      active = false;
      emit("dialogueComplete");
    },
  };
}
