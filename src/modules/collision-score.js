function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function createCollisionScore({ state }) {
  const listeners = new Map();
  let ended = false;

  function emit(type, detail = {}) {
    listeners.get(type)?.forEach((listener) => listener(detail));
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
      ended = false;
    },
    evaluate({ player, obstacles }) {
      if (ended) {
        return;
      }

      for (const obstacle of obstacles) {
        if (intersects(player.hitBox, obstacle.hitBox)) {
          ended = true;
          emit("hitSoldier", { obstacle });
          return;
        }

        if (!obstacle.scored && obstacle.x + obstacle.width < player.hitBox.x) {
          obstacle.scored = true;
          const score = state.addScore(10);
          emit("scoreChanged", { score, points: 10, obstacle });
        }
      }
    },
  };
}
