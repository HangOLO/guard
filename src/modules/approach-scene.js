export function createApproachScene({ assets }) {
  const listeners = new Map();
  const scene = {
    active: false,
    playerX: 0,
    direction: 0,
    contactTriggered: false,
    walkTime: 0,
  };

  function emit(type, detail = {}) {
    listeners.get(type)?.forEach((listener) => listener(detail));
  }

  function reset(layout) {
    scene.playerX = startX(layout);
    scene.direction = 0;
    scene.contactTriggered = false;
    scene.walkTime = 0;
  }

  function startX(layout) {
    return layout.width * 0.22;
  }

  function minX(layout) {
    return layout.width * 0.15;
  }

  function maxX(layout) {
    return layout.width * 0.61;
  }

  function interactionX(layout) {
    return layout.width * 0.45;
  }

  function floorY(layout) {
    return layout.height * (layout.width < 720 ? 0.81 : 0.82);
  }

  function clampPlayer(layout) {
    scene.playerX = Math.max(minX(layout), Math.min(maxX(layout), scene.playerX));
  }

  function canInteract(layout) {
    return scene.playerX >= interactionX(layout);
  }

  return {
    on(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(listener);
      return () => listeners.get(type)?.delete(listener);
    },
    preparePreview(layout) {
      reset(layout);
      scene.playerX = startX(layout);
    },
    start(layout) {
      reset(layout);
      scene.active = true;
    },
    stop() {
      scene.active = false;
      scene.direction = 0;
    },
    setDirection(direction) {
      scene.direction = Math.max(-1, Math.min(1, direction));
    },
    nudge(direction, layout) {
      if (!scene.active) {
        return;
      }
      scene.playerX += Math.max(-1, Math.min(1, direction)) * layout.width * 0.045;
      clampPlayer(layout);
    },
    canInteract,
    interact(layout) {
      if (!scene.active || scene.contactTriggered || !canInteract(layout)) {
        return false;
      }
      scene.contactTriggered = true;
      emit("contactSoldier");
      return true;
    },
    update(dt, layout) {
      if (!scene.active) {
        return;
      }

      scene.walkTime += dt;
      const speed = layout.width * 0.34;
      scene.playerX += scene.direction * speed * dt;
      clampPlayer(layout);
    },
    draw(context, layout, options = {}) {
      assets.drawBackdrop(context, layout, "approach");
      assets.drawMatron(context, scene.playerX, floorY(layout), {
        scale: layout.spriteScale * 1.16,
        ducking: false,
        jumpingOffset: 0,
        walkTime: options.preview ? 0 : scene.walkTime,
      });
      assets.drawGroundMist(context, layout, options.preview ? 0.35 : 0.7);
    },
  };
}
