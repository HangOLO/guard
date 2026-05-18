(function () {
  "use strict";

  const STATES = Object.freeze({
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
    [STATES.GAME_OVER]: { restart: STATES.RUNNER },
  });

  const RUNNER_SPRITE_SCALE = 0.5;
  const MATRON_DUCK_HOLD_FRAME = 2;
  const MATRON_RUN_BODY_WIDTH = 130;
  const CHASER_DISTANCE_BODY_WIDTHS = 2;
  const CHASER_BODY_WIDTH = 135;
  const CHASER_SCALE_MULTIPLIER = 0.88;
  const BGM_SOURCE = "assets/audio/desert-bgm.mp3";
  const BGM_VOLUME = 0.28;
  const FLYING_SPEAR_STACK_OFFSETS = Object.freeze([106, 220, 334, 448]);
  const RUNNER_OBSTACLE_TYPES = Object.freeze(["low", "spear", "shield"]);
  const RUNNER_OBSTACLE_ACTIONS = Object.freeze({
    low: "jump",
    spear: "duck",
    shield: "jump",
  });
  const RUNNER_ACTION_SAFE_INTERVALS = Object.freeze({
    "jump:jump": 0.95,
    "duck:duck": 0.65,
    "jump:duck": 0.9,
    "duck:jump": 0.9,
  });
  const RUNNER_DISTANCE_FACTOR_BUCKETS = Object.freeze([
    Object.freeze({ weight: 0.6, min: 0.3, max: 0.5 }),
    Object.freeze({ weight: 0.3, min: 0.5, max: 0.7 }),
    Object.freeze({ weight: 0.1, min: 0.7, max: 0.9 }),
  ]);

  function createGameState() {
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

  const COLORS = Object.freeze({
    skyTop: "#25304f",
    skyBottom: "#67503d",
    moon: "#f4df9d",
    stone: "#b8b1a1",
    stoneDark: "#615f59",
    road: "#806a4a",
    roadDark: "#52402e",
    cloth: "#d7c3a0",
    shawl: "#4c8f7a",
    guardRed: "#8f2f2f",
    guardGold: "#d5aa4e",
    shadow: "rgba(20, 18, 16, 0.45)",
  });

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawCoverImage(context, image, layout) {
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = layout.width / layout.height;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceRatio > targetRatio) {
      sourceWidth = image.naturalHeight * targetRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / targetRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }

    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, layout.width, layout.height);
  }

  function bounds(x, y, width, height) {
    return Object.freeze({ x, y, width, height });
  }

  const SPRITE_MANIFEST = Object.freeze({
    matronApproachWalk: Object.freeze({
      src: "assets/generated-sprites/matron-approach-walk/sheet-transparent.png",
      rows: 2,
      cols: 2,
      cellSize: 192,
      pixelated: false,
      frames: Object.freeze([
        bounds(61, 14, 70, 165),
        bounds(50, 15, 92, 164),
        bounds(46, 15, 99, 164),
        bounds(47, 15, 98, 164),
      ]),
    }),
    matronRun: Object.freeze({
      src: "assets/generated-sprites/matron-run/sheet-transparent.png",
      rows: 2,
      cols: 3,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([
        bounds(31, 14, 130, 165),
        bounds(32, 25, 127, 154),
        bounds(37, 29, 118, 150),
        bounds(37, 14, 118, 165),
        bounds(34, 23, 124, 156),
        bounds(35, 14, 121, 165),
      ]),
    }),
    matronJump: Object.freeze({
      src: "assets/generated-sprites/matron-jump/sheet-transparent.png",
      rows: 2,
      cols: 2,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([
        bounds(48, 34, 95, 123),
        bounds(47, 15, 97, 161),
        bounds(46, 35, 100, 122),
        bounds(49, 32, 93, 127),
      ]),
    }),
    matronDuck: Object.freeze({
      src: "assets/generated-sprites/matron-duck/sheet-transparent.png",
      rows: 2,
      cols: 2,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([
        bounds(28, 44, 135, 135),
        bounds(13, 49, 165, 130),
        bounds(17, 84, 157, 95),
        bounds(24, 39, 144, 140),
      ]),
    }),
    romanShieldGuard: Object.freeze({
      src: "assets/generated-sprites/roman-shield-guard/sheet-transparent.png",
      rows: 1,
      cols: 1,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([bounds(53, 11, 85, 172)]),
    }),
    romanSpearGuard: Object.freeze({
      src: "assets/generated-sprites/roman-spear-guard/sheet-transparent.png",
      rows: 1,
      cols: 1,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([bounds(50, 11, 92, 172)]),
    }),
    romanChaserRun: Object.freeze({
      src: "assets/generated-sprites/roman-chaser-run/sheet-transparent.png",
      rows: 2,
      cols: 3,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([
        bounds(39, 14, 114, 165),
        bounds(33, 29, 126, 150),
        bounds(36, 16, 120, 163),
        bounds(38, 18, 115, 161),
        bounds(28, 24, 135, 155),
        bounds(44, 18, 104, 161),
      ]),
    }),
    flyingSpear: Object.freeze({
      src: "assets/generated-sprites/flying-spear/sheet-transparent.png",
      rows: 1,
      cols: 4,
      cellSize: 192,
      pixelated: true,
      frames: Object.freeze([
        bounds(13, 84, 166, 24),
        bounds(13, 84, 166, 24),
        bounds(10, 84, 172, 24),
        bounds(13, 84, 166, 24),
      ]),
    }),
  });

  function createAssetStore() {
    const approachBackground = new Image();
    approachBackground.src = "assets/approach-background.png";
    const runnerBackground = new Image();
    runnerBackground.src = "assets/runner-background.png";
    const sprites = {};

    Object.entries(SPRITE_MANIFEST).forEach(([name, definition]) => {
      const image = new Image();
      image.src = definition.src;
      sprites[name] = { ...definition, image };
    });

    function animationFrame(time, frameCount, fps = 10) {
      return Math.floor((time || 0) * fps) % frameCount;
    }

    function jumpFrame(options) {
      const velocityY = options.velocityY || 0;
      if (velocityY > 520) {
        return 0;
      }
      if (velocityY > 80) {
        return 1;
      }
      if (velocityY > -460) {
        return 2;
      }
      return 3;
    }

    function matronSpriteChoice(options = {}) {
      const walkTime = options.walkTime || 0;
      if (options.mode === "approach") {
        return {
          name: "matronApproachWalk",
          frame: animationFrame(walkTime, SPRITE_MANIFEST.matronApproachWalk.frames.length, 6),
        };
      }
      if (options.ducking) {
        return {
          name: "matronDuck",
          frame: MATRON_DUCK_HOLD_FRAME,
        };
      }
      if ((options.jumpingOffset || 0) > 0) {
        return {
          name: "matronJump",
          frame: jumpFrame(options),
        };
      }
      return {
        name: "matronRun",
        frame: animationFrame(walkTime, SPRITE_MANIFEST.matronRun.frames.length, 12),
      };
    }

    function flyingSpearFrame(time = 0) {
      return animationFrame(time, SPRITE_MANIFEST.flyingSpear.frames.length, 12);
    }

    function obstacleSpriteChoice(type, time = 0) {
      if (type === "spear") {
        return {
          name: "flyingSpear",
          frame: flyingSpearFrame(time),
        };
      }
      if (type === "shield") {
        return { name: "romanShieldGuard", frame: 0 };
      }
      return { name: "romanSpearGuard", frame: 0 };
    }

    function spriteFrame(sprite, frameIndex) {
      const index = ((frameIndex % sprite.frames.length) + sprite.frames.length) % sprite.frames.length;
      return sprite.frames[index];
    }

    function spriteBox(spriteName, frameIndex, x, baselineY, scale, anchor = "center") {
      const sprite = sprites[spriteName];
      if (!sprite) {
        return null;
      }
      const frame = spriteFrame(sprite, frameIndex);
      const width = frame.width * scale;
      const height = frame.height * scale;
      return {
        x: anchor === "left" ? x : x - width / 2,
        y: baselineY - height,
        width,
        height,
      };
    }

    function drawSprite(context, spriteName, frameIndex, x, baselineY, scale, anchor = "center") {
      const sprite = sprites[spriteName];
      if (!sprite?.image.complete || sprite.image.naturalWidth <= 0) {
        return false;
      }

      const index = ((frameIndex % sprite.frames.length) + sprite.frames.length) % sprite.frames.length;
      const frame = spriteFrame(sprite, index);
      const sourceX = (index % sprite.cols) * sprite.cellSize;
      const sourceY = Math.floor(index / sprite.cols) * sprite.cellSize;
      const targetSize = sprite.cellSize * scale;
      const targetX = anchor === "left" ? x - frame.x * scale : x - (frame.x + frame.width / 2) * scale;
      const targetY = baselineY - (frame.y + frame.height) * scale;

      context.save();
      context.imageSmoothingEnabled = !sprite.pixelated;
      context.drawImage(
        sprite.image,
        sourceX,
        sourceY,
        sprite.cellSize,
        sprite.cellSize,
        targetX,
        targetY,
        targetSize,
        targetSize
      );
      context.restore();
      return true;
    }

    function flyingSpearBaseline(floorY, scale, baselineOffset = FLYING_SPEAR_STACK_OFFSETS[0]) {
      return floorY - baselineOffset * scale;
    }

    function flyingSpearHitBox(x, floorY, scale, time, baselineOffset) {
      return spriteBox(
        "flyingSpear",
        flyingSpearFrame(time),
        x,
        flyingSpearBaseline(floorY, scale, baselineOffset),
        scale,
        "left"
      );
    }

    return {
      getMatronHitBox(x, floorY, options = {}) {
        const scale = options.scale || 1;
        const choice = matronSpriteChoice(options);
        const baselineY = floorY - (options.jumpingOffset || 0);
        return spriteBox(choice.name, choice.frame, x, baselineY, scale);
      },
      getObstacleHitBox(type, x, floorY, options = {}) {
        const scale = options.scale || 1;
        if (type === "spear") {
          return flyingSpearHitBox(x, floorY, scale, options.time, options.baselineOffset);
        }
        const choice = obstacleSpriteChoice(type, options.time);
        return spriteBox(choice.name, choice.frame, x, floorY, scale, "left");
      },
      getFlyingSpearHitBox(x, floorY, options = {}) {
        const scale = options.scale || 1;
        return flyingSpearHitBox(x, floorY, scale, options.time, options.baselineOffset);
      },
      getObstacleWidth(type, layout, time = 0, scale = layout.spriteScale, floorY = layout.floorY) {
        const hitBox = this.getObstacleHitBox(type, 0, floorY, {
          scale,
          time,
        });
        return hitBox?.width || 0;
      },
      drawBackdrop(context, layout, mode) {
        if (mode === "runner" && runnerBackground.complete && runnerBackground.naturalWidth > 0) {
          drawCoverImage(context, runnerBackground, layout);
          return;
        }

        if (mode === "approach" && approachBackground.complete && approachBackground.naturalWidth > 0) {
          drawCoverImage(context, approachBackground, layout);
          return;
        }

        const gradient = context.createLinearGradient(0, 0, 0, layout.height);
        gradient.addColorStop(0, COLORS.skyTop);
        gradient.addColorStop(0.52, mode === "runner" ? "#50634d" : COLORS.skyBottom);
        gradient.addColorStop(1, COLORS.roadDark);
        context.fillStyle = gradient;
        context.fillRect(0, 0, layout.width, layout.height);

        context.fillStyle = COLORS.moon;
        context.beginPath();
        context.arc(layout.width * 0.13, layout.height * 0.17, layout.height * 0.05, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgba(255, 238, 188, 0.1)";
        for (let i = 0; i < 18; i += 1) {
          const x = (((i * 173) % 1000) / 1000) * layout.width;
          const y = (0.08 + ((i * 73) % 240) / 1000) * layout.height;
          context.fillRect(x, y, 2, 2);
        }

        context.fillStyle = "rgba(33, 40, 38, 0.42)";
        context.beginPath();
        context.moveTo(0, layout.height * 0.62);
        context.lineTo(layout.width * 0.2, layout.height * 0.5);
        context.lineTo(layout.width * 0.42, layout.height * 0.61);
        context.lineTo(layout.width * 0.68, layout.height * 0.48);
        context.lineTo(layout.width, layout.height * 0.57);
        context.lineTo(layout.width, layout.height);
        context.lineTo(0, layout.height);
        context.closePath();
        context.fill();

        context.fillStyle = COLORS.road;
        context.fillRect(0, layout.floorY, layout.width, layout.height - layout.floorY);
        context.fillStyle = "rgba(255, 233, 176, 0.08)";
        context.fillRect(0, layout.floorY + 4, layout.width, 5);
      },
      drawRunway(context, layout, elapsed, floorY = layout.floorY) {
        context.save();
        context.strokeStyle = "rgba(244, 220, 164, 0.26)";
        context.lineWidth = 3;
        const spacing = 96 * layout.spriteScale;
        const offset = (elapsed * 160 * layout.spriteScale) % spacing;
        for (let x = -spacing; x < layout.width + spacing; x += spacing) {
          context.beginPath();
          context.moveTo(x - offset, floorY + 46 * layout.spriteScale);
          context.lineTo(x + 42 * layout.spriteScale - offset, floorY + 37 * layout.spriteScale);
          context.stroke();
        }
        context.restore();
      },
      drawTomb(context, x, floorY, layout) {
        const scale = layout.spriteScale;
        context.save();
        context.translate(x, floorY);
        context.fillStyle = COLORS.shadow;
        context.beginPath();
        context.ellipse(0, 4 * scale, 125 * scale, 18 * scale, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = COLORS.stone;
        roundedRect(context, -132 * scale, -122 * scale, 210 * scale, 116 * scale, 18 * scale);
        context.fill();
        context.fillStyle = COLORS.stoneDark;
        roundedRect(context, -68 * scale, -92 * scale, 70 * scale, 86 * scale, 12 * scale);
        context.fill();
        context.fillStyle = "#2b2b2a";
        roundedRect(context, -55 * scale, -78 * scale, 48 * scale, 72 * scale, 10 * scale);
        context.fill();
        context.fillStyle = "#91897b";
        context.beginPath();
        context.arc(42 * scale, -39 * scale, 45 * scale, 0, Math.PI * 2);
        context.fill();
        context.restore();
      },
      drawMatron(context, x, floorY, options) {
        const scale = options.scale;
        const jump = options.jumpingOffset || 0;
        const duck = options.ducking;
        const choice = matronSpriteChoice(options);
        if (drawSprite(context, choice.name, choice.frame, x, floorY - jump, scale)) {
          return;
        }

        const bob = Math.sin((options.walkTime || 0) * 12) * 3 * scale;
        const bodyHeight = duck ? 58 * scale : 100 * scale;
        const y = floorY - jump + bob;

        context.save();
        context.translate(x, y);
        context.fillStyle = COLORS.shadow;
        context.beginPath();
        context.ellipse(0, 5 * scale, 36 * scale, 11 * scale, 0, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "#4d3125";
        context.lineWidth = 8 * scale;
        context.beginPath();
        context.moveTo(-11 * scale, -8 * scale);
        context.lineTo(-16 * scale, -38 * scale);
        context.moveTo(13 * scale, -8 * scale);
        context.lineTo(15 * scale, -38 * scale);
        context.stroke();

        context.fillStyle = COLORS.cloth;
        roundedRect(context, -20 * scale, -bodyHeight, 40 * scale, bodyHeight, 14 * scale);
        context.fill();
        context.fillStyle = "#6e4b8c";
        roundedRect(context, -25 * scale, -bodyHeight + 3 * scale, 50 * scale, 44 * scale, 20 * scale);
        context.fill();
        context.fillStyle = "rgba(42, 27, 55, 0.45)";
        roundedRect(context, -20 * scale, -bodyHeight + 13 * scale, 40 * scale, 27 * scale, 16 * scale);
        context.fill();
        context.fillStyle = "#6a3d2e";
        roundedRect(context, -21 * scale, -39 * scale, 42 * scale, 8 * scale, 4 * scale);
        context.fill();
        context.fillStyle = "#c88d65";
        context.beginPath();
        context.arc(0, -bodyHeight - 13 * scale, 13 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#6e4b8c";
        context.beginPath();
        context.arc(0, -bodyHeight - 15 * scale, 21 * scale, Math.PI * 0.7, Math.PI * 2.3);
        context.lineTo(19 * scale, -bodyHeight + 3 * scale);
        context.lineTo(-19 * scale, -bodyHeight + 3 * scale);
        context.closePath();
        context.fill();

        context.strokeStyle = "#f0d4ae";
        context.lineWidth = 5 * scale;
        context.beginPath();
        context.moveTo(-16 * scale, -bodyHeight + 23 * scale);
        context.lineTo(-29 * scale, -bodyHeight + (duck ? 47 : 58) * scale);
        context.moveTo(16 * scale, -bodyHeight + 22 * scale);
        context.lineTo(30 * scale, -bodyHeight + (duck ? 45 : 60) * scale);
        context.stroke();
        context.restore();
      },
      drawSoldier(context, x, floorY, options) {
        const scale = options.scale;
        const stance = options.stance;
        if (drawSprite(context, "romanSpearGuard", 0, x, floorY, scale, "left")) {
          return;
        }

        context.save();
        context.translate(x, floorY);
        context.fillStyle = COLORS.shadow;
        context.beginPath();
        context.ellipse(8 * scale, 5 * scale, 42 * scale, 11 * scale, 0, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "#342923";
        context.lineWidth = 8 * scale;
        context.beginPath();
        context.moveTo(-10 * scale, -8 * scale);
        context.lineTo(-16 * scale, -54 * scale);
        context.moveTo(20 * scale, -8 * scale);
        context.lineTo(15 * scale, -54 * scale);
        context.stroke();

        context.fillStyle = COLORS.guardRed;
        roundedRect(context, -23 * scale, -96 * scale, 52 * scale, 54 * scale, 8 * scale);
        context.fill();
        context.fillStyle = COLORS.guardGold;
        context.fillRect(-27 * scale, -76 * scale, 60 * scale, 10 * scale);
        context.fillStyle = "#c58a60";
        context.beginPath();
        context.arc(3 * scale, -111 * scale, 15 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#8e8b83";
        context.beginPath();
        context.arc(3 * scale, -126 * scale, 19 * scale, Math.PI, 0);
        context.lineTo(23 * scale, -112 * scale);
        context.lineTo(-16 * scale, -112 * scale);
        context.closePath();
        context.fill();

        context.strokeStyle = "#d8c090";
        context.lineWidth = 5 * scale;
        context.beginPath();
        if (stance === "spear") {
          context.moveTo(-28 * scale, -117 * scale);
          context.lineTo(87 * scale, -117 * scale);
          context.moveTo(87 * scale, -117 * scale);
          context.lineTo(72 * scale, -127 * scale);
          context.moveTo(87 * scale, -117 * scale);
          context.lineTo(72 * scale, -107 * scale);
        } else if (stance === "low") {
          context.moveTo(-26 * scale, -71 * scale);
          context.lineTo(52 * scale, -58 * scale);
          context.moveTo(52 * scale, -58 * scale);
          context.lineTo(39 * scale, -70 * scale);
          context.moveTo(52 * scale, -58 * scale);
          context.lineTo(37 * scale, -47 * scale);
        } else {
          context.moveTo(-28 * scale, -70 * scale);
          context.lineTo(41 * scale, -98 * scale);
        }
        context.stroke();
        context.restore();
      },
      drawFlyingSpear(context, x, floorY, options) {
        const scale = options.scale;
        const frame = flyingSpearFrame(options.elapsed);
        const baselineOffsets = options.baselineOffsets || [options.baselineOffset ?? FLYING_SPEAR_STACK_OFFSETS[0]];
        let spritesDrawn = true;

        baselineOffsets.forEach((baselineOffset) => {
          const baselineY = flyingSpearBaseline(floorY, scale, baselineOffset);
          spritesDrawn = drawSprite(context, "flyingSpear", frame, x, baselineY, scale, "left") && spritesDrawn;
        });

        if (spritesDrawn) {
          return;
        }

        context.save();
        context.translate(x, floorY);

        baselineOffsets.forEach((baselineOffset) => {
          const y = -(baselineOffset + 11) * scale;

          context.strokeStyle = "rgba(244, 220, 164, 0.32)";
          context.lineWidth = 2 * scale;
          context.beginPath();
          context.moveTo(-46 * scale, y + 4 * scale);
          context.lineTo(-18 * scale, y + 4 * scale);
          context.moveTo(-54 * scale, y - 5 * scale);
          context.lineTo(-25 * scale, y - 5 * scale);
          context.stroke();

          context.strokeStyle = "#d8c090";
          context.lineWidth = 6 * scale;
          context.beginPath();
          context.moveTo(-28 * scale, y);
          context.lineTo(72 * scale, y);
          context.stroke();

          context.fillStyle = "#c8ced0";
          context.beginPath();
          context.moveTo(92 * scale, y);
          context.lineTo(68 * scale, y - 12 * scale);
          context.lineTo(68 * scale, y + 12 * scale);
          context.closePath();
          context.fill();
        });

        context.restore();
      },
      drawShieldSoldier(context, x, floorY, options) {
        const scale = options.scale;
        if (drawSprite(context, "romanShieldGuard", 0, x, floorY, scale, "left")) {
          return;
        }

        context.save();
        context.translate(x, floorY);

        context.fillStyle = COLORS.shadow;
        context.beginPath();
        context.ellipse(10 * scale, 5 * scale, 45 * scale, 11 * scale, 0, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "#342923";
        context.lineWidth = 8 * scale;
        context.beginPath();
        context.moveTo(-14 * scale, -6 * scale);
        context.lineTo(-21 * scale, -42 * scale);
        context.moveTo(21 * scale, -6 * scale);
        context.lineTo(18 * scale, -40 * scale);
        context.stroke();

        context.fillStyle = COLORS.guardRed;
        roundedRect(context, -24 * scale, -84 * scale, 50 * scale, 46 * scale, 8 * scale);
        context.fill();
        context.fillStyle = COLORS.guardGold;
        context.fillRect(-27 * scale, -67 * scale, 58 * scale, 9 * scale);

        context.fillStyle = "#c58a60";
        context.beginPath();
        context.arc(2 * scale, -98 * scale, 14 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#8e8b83";
        context.beginPath();
        context.arc(2 * scale, -111 * scale, 18 * scale, Math.PI, 0);
        context.lineTo(22 * scale, -98 * scale);
        context.lineTo(-16 * scale, -98 * scale);
        context.closePath();
        context.fill();

        context.fillStyle = "#6f7b7c";
        roundedRect(context, -34 * scale, -88 * scale, 34 * scale, 58 * scale, 10 * scale);
        context.fill();
        context.strokeStyle = "#d8c090";
        context.lineWidth = 4 * scale;
        context.strokeRect(-29 * scale, -80 * scale, 24 * scale, 42 * scale);

        context.strokeStyle = "#d8c090";
        context.lineWidth = 5 * scale;
        context.beginPath();
        context.moveTo(12 * scale, -63 * scale);
        context.lineTo(50 * scale, -49 * scale);
        context.stroke();
        context.restore();
      },
      drawChasingSoldier(context, x, floorY, options) {
        const scale = options.scale;
        const runTime = options.runTime || 0;
        const frame = animationFrame(runTime, SPRITE_MANIFEST.romanChaserRun.frames.length, 12);
        if (drawSprite(context, "romanChaserRun", frame, x, floorY, scale)) {
          return;
        }

        const stride = Math.sin(runTime * 13) * 8 * scale;
        context.save();
        context.translate(x, floorY);

        context.fillStyle = COLORS.shadow;
        context.beginPath();
        context.ellipse(6 * scale, 5 * scale, 38 * scale, 10 * scale, 0, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "#342923";
        context.lineWidth = 7 * scale;
        context.beginPath();
        context.moveTo(-9 * scale, -6 * scale);
        context.lineTo((-20 * scale) + stride, -48 * scale);
        context.moveTo(18 * scale, -6 * scale);
        context.lineTo((20 * scale) - stride, -48 * scale);
        context.stroke();

        context.fillStyle = COLORS.guardRed;
        roundedRect(context, -22 * scale, -93 * scale, 49 * scale, 52 * scale, 8 * scale);
        context.fill();
        context.fillStyle = COLORS.guardGold;
        context.fillRect(-25 * scale, -73 * scale, 56 * scale, 9 * scale);

        context.fillStyle = "#c58a60";
        context.beginPath();
        context.arc(2 * scale, -107 * scale, 14 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#8e8b83";
        context.beginPath();
        context.arc(2 * scale, -120 * scale, 18 * scale, Math.PI, 0);
        context.lineTo(21 * scale, -107 * scale);
        context.lineTo(-16 * scale, -107 * scale);
        context.closePath();
        context.fill();

        context.strokeStyle = "#d8c090";
        context.lineWidth = 5 * scale;
        context.beginPath();
        context.moveTo(18 * scale, -70 * scale);
        context.lineTo(48 * scale, -88 * scale);
        context.stroke();
        context.restore();
      },
      drawGroundMist(context, layout, alpha, floorY = layout.floorY) {
        context.save();
        const gradient = context.createLinearGradient(0, floorY - 40, 0, floorY + 70);
        gradient.addColorStop(0, `rgba(226, 212, 181, ${alpha * 0.02})`);
        gradient.addColorStop(1, `rgba(226, 212, 181, ${alpha * 0.18})`);
        context.fillStyle = gradient;
        context.fillRect(0, floorY - 40, layout.width, 110);
        context.restore();
      },
      drawDialogueFocus(context, layout) {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.26)";
        context.fillRect(0, 0, layout.width, layout.height);
        context.restore();
      },
    };
  }

  function createUiHud({ state }) {
    const refs = {
      hud: document.querySelector("#hud"),
      scoreValue: document.querySelector("#scoreValue"),
      soundButton: document.querySelector("#soundButton"),
      titleScreen: document.querySelector("#titleScreen"),
      startButton: document.querySelector("#startButton"),
      dialogueScreen: document.querySelector("#dialogueScreen"),
      speakerName: document.querySelector("#speakerName"),
      dialogueText: document.querySelector("#dialogueText"),
      dialogueNextButton: document.querySelector("#dialogueNextButton"),
      gameOverScreen: document.querySelector("#gameOverScreen"),
      finalScoreValue: document.querySelector("#finalScoreValue"),
      restartButton: document.querySelector("#restartButton"),
      approachControls: document.querySelector("#approachControls"),
      moveLeftButton: document.querySelector("#moveLeftButton"),
      moveRightButton: document.querySelector("#moveRightButton"),
      interactButton: document.querySelector("#interactButton"),
      runnerControls: document.querySelector("#runnerControls"),
      duckButton: document.querySelector("#duckButton"),
      jumpButton: document.querySelector("#jumpButton"),
    };

    function setHidden(element, hidden) {
      if (!element) {
        return;
      }
      element.hidden = hidden;
    }

    function updateScore(score) {
      refs.scoreValue.textContent = String(score);
      refs.finalScoreValue.textContent = String(score);
    }

    function showState(snapshot) {
      const current = snapshot.current;
      setHidden(refs.titleScreen, current !== STATES.TITLE);
      setHidden(refs.dialogueScreen, current !== STATES.DIALOGUE);
      setHidden(refs.gameOverScreen, current !== STATES.GAME_OVER);
      setHidden(refs.hud, current !== STATES.RUNNER);
      setHidden(refs.approachControls, current !== STATES.APPROACH);
      setHidden(refs.runnerControls, current !== STATES.RUNNER);
      document.body.dataset.scene = current;
      updateScore(snapshot.score);
      refs.finalScoreValue.textContent = String(snapshot.score);
    }

    return {
      getInputTargets() {
        return {
          startButton: refs.startButton,
          restartButton: refs.restartButton,
          soundButton: refs.soundButton,
          dialogueNextButton: refs.dialogueNextButton,
          moveLeftButton: refs.moveLeftButton,
          moveRightButton: refs.moveRightButton,
          interactButton: refs.interactButton,
          duckButton: refs.duckButton,
          jumpButton: refs.jumpButton,
        };
      },
      showState,
      updateScore,
      updateSound(enabled = state.soundEnabled) {
        refs.soundButton.textContent = enabled ? "音效開啟" : "音效關閉";
        refs.soundButton.setAttribute("aria-pressed", String(enabled));
      },
      showDialogue(line) {
        refs.speakerName.textContent = `${line.speaker} ${line.index + 1}/${line.total}`;
        refs.dialogueText.textContent = line.text;
        refs.dialogueNextButton.textContent = line.index === line.total - 1 ? "快跑" : "下一句";
      },
    };
  }

  function createResponsiveLayout({ canvas }) {
    const layout = {
      width: 1024,
      height: 768,
      dpr: 1,
      floorY: 590,
      spriteScale: 1,
    };

    function recalc() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      layout.width = Math.max(320, rect.width);
      layout.height = Math.max(420, rect.height);
      layout.dpr = dpr;
      layout.floorY = layout.height * (layout.width < 720 ? 0.73 : 0.76);
      layout.spriteScale = Math.max(0.72, Math.min(1.25, layout.width / 1024));

      canvas.width = Math.round(layout.width * dpr);
      canvas.height = Math.round(layout.height * dpr);
      canvas.style.setProperty("--canvas-width", `${layout.width}px`);
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);

    return {
      current() {
        return { ...layout };
      },
    };
  }

  function createAudio({ state }) {
    let context;
    let masterGain;
    const bgm = new Audio(BGM_SOURCE);
    bgm.loop = true;
    bgm.preload = "auto";
    bgm.volume = BGM_VOLUME;

    function playBgm() {
      if (!state.soundEnabled) {
        return;
      }

      bgm.play().catch(() => {});
    }

    function pauseBgm() {
      bgm.pause();
    }

    state.onChange((event) => {
      if (event.type !== "soundChanged") {
        return;
      }

      if (event.soundEnabled) {
        playBgm();
        return;
      }

      pauseBgm();
    });

    function ensureContext() {
      if (context || (!window.AudioContext && !window.webkitAudioContext)) {
        return context;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
      masterGain = context.createGain();
      masterGain.gain.value = 0.16;
      masterGain.connect(context.destination);
      return context;
    }

    function resume() {
      const audioContext = ensureContext();
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
      playBgm();
    }

    function tone(frequency, duration, options = {}) {
      if (!state.soundEnabled) {
        return;
      }

      const audioContext = ensureContext();
      if (!audioContext || audioContext.state === "closed") {
        return;
      }

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      if (options.slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(options.volume || 0.24, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    }

    return {
      resume,
      play(name) {
        if (!state.soundEnabled) {
          return;
        }

        switch (name) {
          case "start":
            tone(260, 0.1, { type: "triangle" });
            tone(390, 0.12, { type: "triangle", volume: 0.18 });
            break;
          case "contact":
            tone(180, 0.16, { type: "sawtooth", volume: 0.1 });
            break;
          case "dialogue":
            tone(520, 0.045, { type: "square", volume: 0.08 });
            break;
          case "startRun":
            tone(330, 0.08, { type: "triangle" });
            tone(495, 0.08, { type: "triangle", volume: 0.18 });
            break;
          case "jump":
            tone(420, 0.16, { type: "triangle", slideTo: 760 });
            break;
          case "duck":
            tone(160, 0.08, { type: "triangle", volume: 0.12 });
            break;
          case "score":
            tone(740, 0.07, { type: "square", volume: 0.11 });
            break;
          case "hit":
            tone(120, 0.32, { type: "sawtooth", slideTo: 58, volume: 0.19 });
            break;
          case "toggle":
            tone(600, 0.07, { type: "triangle", volume: 0.12 });
            break;
          default:
            break;
        }
      },
    };
  }

  function createCollisionScore({ state }) {
    const listeners = new Map();
    let ended = false;

    function intersects(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

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
          const hitBoxes = obstacle.hitBoxes || (obstacle.hitBox ? [obstacle.hitBox] : []);
          if (hitBoxes.some((hitBox) => intersects(player.hitBox, hitBox))) {
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

  function createApproachScene({ assets }) {
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

    function reset(layout) {
      scene.playerX = startX(layout);
      scene.direction = 0;
      scene.contactTriggered = false;
      scene.walkTime = 0;
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
          mode: "approach",
          ducking: false,
          jumpingOffset: 0,
          walkTime: options.preview ? 0 : scene.walkTime,
        });
        assets.drawGroundMist(context, layout, options.preview ? 0.35 : 0.7);
      },
    };
  }

  function createDialogue() {
    const lines = [
      {
        speaker: "羅馬守衛",
        text: "你是誰，是來偷屍體的嗎？抓住她！",
      },
    ];
    const listeners = new Map();
    let active = false;
    let index = 0;

    function emit(type, detail = {}) {
      listeners.get(type)?.forEach((listener) => listener(detail));
    }

    function current() {
      return {
        ...lines[index],
        index,
        total: lines.length,
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

        if (index < lines.length - 1) {
          index += 1;
          emit("lineChanged", current());
          return;
        }

        active = false;
        emit("dialogueComplete");
      },
    };
  }

  function createRunner({ assets, collisionScore }) {
    const player = {
      x: 0,
      width: 44,
      offsetY: 0,
      velocityY: 0,
      ducking: false,
      duckHeld: false,
      runTime: 0,
    };

    let active = false;
    let elapsed = 0;
    let spawnTimer = 0;
    let obstacles = [];
    let pressureLevel = 0;
    let lastObstacleType = null;
    let lastObstacleAction = null;
    let nextObstacleType = null;

    function runnerSpriteScale(layout) {
      return layout.spriteScale * RUNNER_SPRITE_SCALE;
    }

    function runnerFloorY(layout) {
      return layout.height * 0.8;
    }

    function metrics(layout) {
      const scale = runnerSpriteScale(layout);
      const width = 44 * scale;
      const standingHeight = 104 * scale;
      const duckHeight = 62 * scale;
      return {
        scale,
        width,
        standingHeight,
        duckHeight,
        floorY: runnerFloorY(layout),
      };
    }

    function playerBox(layout) {
      return assets.getMatronHitBox(player.x, runnerFloorY(layout), {
        scale: runnerSpriteScale(layout),
        mode: "runner",
        ducking: player.ducking,
        jumpingOffset: player.offsetY,
        velocityY: player.velocityY,
        walkTime: player.runTime,
      });
    }

    function mergeHitBoxes(hitBoxes) {
      if (!hitBoxes.length) {
        return null;
      }

      const left = Math.min(...hitBoxes.map((hitBox) => hitBox.x));
      const top = Math.min(...hitBoxes.map((hitBox) => hitBox.y));
      const right = Math.max(...hitBoxes.map((hitBox) => hitBox.x + hitBox.width));
      const bottom = Math.max(...hitBoxes.map((hitBox) => hitBox.y + hitBox.height));
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
    }

    function obstacleBox(obstacle, layout) {
      const scale = runnerSpriteScale(layout);
      const floorY = runnerFloorY(layout);
      if (obstacle.type === "spear") {
        const hitBoxes = FLYING_SPEAR_STACK_OFFSETS.map((baselineOffset) =>
          assets.getFlyingSpearHitBox(obstacle.x, floorY, {
            scale,
            time: elapsed,
            baselineOffset,
          })
        ).filter(Boolean);
        const hitBox = mergeHitBoxes(hitBoxes);
        if (hitBox) {
          return {
            ...hitBox,
            hitBoxes,
          };
        }
      }

      const spriteHitBox = assets.getObstacleHitBox(obstacle.type, obstacle.x, floorY, {
        scale,
        time: elapsed,
      });
      if (spriteHitBox) {
        return spriteHitBox;
      }

      if (obstacle.type === "low" || obstacle.type === "shield") {
        return {
          x: obstacle.x + 11 * scale,
          y: floorY - 88 * scale,
          width: 34 * scale,
          height: 88 * scale,
        };
      }

      return {
        x: obstacle.x - 6 * scale,
        y: floorY - 130 * scale,
        width: 96 * scale,
        height: 34 * scale,
      };
    }

    function speed(layout) {
      return layout.width * 0.38 + pressureLevel * layout.width * 0.08;
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function randomDistanceFactor() {
      const roll = Math.random();
      let cumulativeWeight = 0;

      for (const bucket of RUNNER_DISTANCE_FACTOR_BUCKETS) {
        cumulativeWeight += bucket.weight;
        if (roll <= cumulativeWeight) {
          return randomBetween(bucket.min, bucket.max);
        }
      }

      const fallbackBucket =
        RUNNER_DISTANCE_FACTOR_BUCKETS[RUNNER_DISTANCE_FACTOR_BUCKETS.length - 1];
      return randomBetween(fallbackBucket.min, fallbackBucket.max);
    }

    function obstacleAction(type) {
      return RUNNER_OBSTACLE_ACTIONS[type] || "jump";
    }

    function chooseObstacleType(previousType = lastObstacleType) {
      const candidates = RUNNER_OBSTACLE_TYPES.filter((type) => type !== previousType);
      const pool = candidates.length ? candidates : RUNNER_OBSTACLE_TYPES;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function baseSpawnInterval() {
      return Math.max(1.05, 2.15 - pressureLevel * 0.18);
    }

    function safeSpawnInterval(previousAction, nextAction) {
      if (!previousAction || !nextAction) {
        return 0.95;
      }
      return RUNNER_ACTION_SAFE_INTERVALS[`${previousAction}:${nextAction}`] || 0.95;
    }

    function spawnInterval(layout, previousAction, nextAction) {
      const currentSpeed = speed(layout);
      const baseDistance = baseSpawnInterval() * currentSpeed;
      const randomizedDistance = baseDistance * randomDistanceFactor();
      const randomizedInterval = randomizedDistance / currentSpeed;
      return Math.max(safeSpawnInterval(previousAction, nextAction), randomizedInterval);
    }

    function queueNextObstacle() {
      nextObstacleType = chooseObstacleType(lastObstacleType);
      return nextObstacleType;
    }

    function initialSpawnInterval() {
      return randomBetween(0.45, 0.75);
    }

    function spawn(layout) {
      const type = nextObstacleType || queueNextObstacle();
      const scale = runnerSpriteScale(layout);
      const floorY = runnerFloorY(layout);
      const fallbackWidth = type === "spear" ? 100 * scale : 58 * scale;
      obstacles.push({
        type,
        x: layout.width + 80,
        width: assets.getObstacleWidth(type, layout, elapsed, scale, floorY) || fallbackWidth,
        scored: false,
      });
      lastObstacleType = type;
      lastObstacleAction = obstacleAction(type);
      queueNextObstacle();
      spawnTimer = spawnInterval(layout, lastObstacleAction, obstacleAction(nextObstacleType));
    }

    function resetPlayer(layout) {
      player.x = layout.width * 0.2;
      player.offsetY = 0;
      player.velocityY = 0;
      player.ducking = false;
      player.duckHeld = false;
      player.runTime = 0;
    }

    return {
      get pressureLevel() {
        return pressureLevel;
      },
      reset() {
        active = false;
        elapsed = 0;
        spawnTimer = 0;
        pressureLevel = 0;
        lastObstacleType = null;
        lastObstacleAction = null;
        nextObstacleType = null;
        obstacles = [];
      },
      start(layout) {
        this.reset();
        resetPlayer(layout);
        active = true;
        queueNextObstacle();
        spawnTimer = initialSpawnInterval();
      },
      stop() {
        active = false;
        player.ducking = false;
        player.duckHeld = false;
      },
      jump() {
        if (!active || player.offsetY > 0 || player.ducking) {
          return false;
        }
        player.velocityY = 760;
        player.offsetY = 2;
        return true;
      },
      setDucking(isDucking) {
        player.duckHeld = Boolean(isDucking);
        player.ducking = active && player.duckHeld && player.offsetY <= 0;
      },
      update(dt, layout) {
        if (!active) {
          return;
        }

        elapsed += dt;
        player.runTime += dt;
        pressureLevel = Math.floor(elapsed / 10);

        if (player.offsetY > 0 || player.velocityY > 0) {
          player.offsetY += player.velocityY * dt;
          player.velocityY -= 1850 * dt;
          if (player.offsetY <= 0) {
            player.offsetY = 0;
            player.velocityY = 0;
          }
        }

        player.ducking = player.duckHeld && player.offsetY <= 0;

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawn(layout);
        }

        const currentSpeed = speed(layout);
        obstacles.forEach((obstacle) => {
          obstacle.x -= currentSpeed * dt;
          obstacle.hitBox = obstacleBox(obstacle, layout);
          obstacle.hitBoxes = obstacle.hitBox.hitBoxes || null;
          obstacle.width = obstacle.hitBox.width;
        });
        obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -30);

        collisionScore.evaluate({
          player: {
            ...player,
            hitBox: playerBox(layout),
          },
          obstacles,
        });
      },
      draw(context, layout) {
        this.drawBackground(context, layout);
        const runnerScale = runnerSpriteScale(layout);
        const floorY = runnerFloorY(layout);
        const chaserScale = runnerScale * CHASER_SCALE_MULTIPLIER;
        const chaserDistance = MATRON_RUN_BODY_WIDTH * CHASER_DISTANCE_BODY_WIDTHS * runnerScale;
        const chaserMinX = (CHASER_BODY_WIDTH * chaserScale) / 2;
        const chaserX = Math.max(chaserMinX, player.x - chaserDistance);

        obstacles.forEach((obstacle) => {
          if (obstacle.type === "low") {
            assets.drawSoldier(context, obstacle.x, floorY, {
              scale: runnerScale,
              stance: "low",
            });
          } else if (obstacle.type === "shield") {
            assets.drawShieldSoldier(context, obstacle.x, floorY, {
              scale: runnerScale,
            });
          } else {
            assets.drawFlyingSpear(context, obstacle.x, floorY, {
              scale: runnerScale,
              elapsed,
              baselineOffsets: FLYING_SPEAR_STACK_OFFSETS,
            });
          }
        });

        assets.drawChasingSoldier(context, chaserX, floorY, {
          scale: chaserScale,
          runTime: player.runTime,
        });

        assets.drawMatron(context, player.x, floorY, {
          scale: runnerScale,
          mode: "runner",
          ducking: player.ducking,
          jumpingOffset: player.offsetY,
          velocityY: player.velocityY,
          walkTime: player.runTime,
        });
      },
      drawBackground(context, layout) {
        const floorY = runnerFloorY(layout);
        assets.drawBackdrop(context, layout, "runner");
        assets.drawRunway(context, layout, elapsed, floorY);
        assets.drawGroundMist(context, layout, 0.5, floorY);
      },
    };
  }

  function createSceneFlow({
    state,
    assets,
    ui,
    audio,
    approachScene,
    dialogue,
    runner,
    collisionScore,
    getLayout,
  }) {
    let leftHeld = false;
    let rightHeld = false;

    function syncApproachDirection() {
      const direction = Number(rightHeld) - Number(leftHeld);
      approachScene.setDirection(direction);
    }

    function showCurrentState() {
      ui.showState(state.snapshot());
      ui.updateSound(state.soundEnabled);
    }

    function startApproach() {
      leftHeld = false;
      rightHeld = false;
      collisionScore.reset();
      runner.reset();
      approachScene.start(getLayout());
      dialogue.reset();
      showCurrentState();
    }

    function startDialogue() {
      approachScene.stop();
      dialogue.start();
      ui.showState(state.snapshot());
      ui.showDialogue(dialogue.current());
      audio.play("contact");
    }

    function startRunner() {
      runner.start(getLayout());
      ui.showState(state.snapshot());
      audio.play("startRun");
    }

    approachScene.on("contactSoldier", () => {
      if (state.transition("contactSoldier")) {
        startDialogue();
      }
    });

    dialogue.on("lineChanged", (line) => {
      ui.showDialogue(line);
      audio.play("dialogue");
    });

    dialogue.on("dialogueComplete", () => {
      if (state.transition("dialogueComplete")) {
        startRunner();
      }
    });

    collisionScore.on("scoreChanged", ({ score }) => {
      ui.updateScore(score);
      audio.play("score");
    });

    collisionScore.on("hitSoldier", () => {
      if (state.transition("hitSoldier")) {
        runner.stop();
        ui.showState(state.snapshot());
        audio.play("hit");
      }
    });

    state.onChange((event) => {
      if (event.type === "soundChanged") {
        ui.updateSound(event.soundEnabled);
      }
      if (event.type === "scoreChanged") {
        ui.updateScore(event.score);
      }
    });

    function handleAction(action) {
      if (action.type === "toggleSound" && action.phase === "pressed") {
        const enabled = state.toggleSound();
        if (enabled) {
          audio.resume();
          audio.play("toggle");
        }
        return;
      }

      if (state.current === STATES.TITLE && action.type === "start" && action.phase === "pressed") {
        audio.resume();
        if (state.transition("start")) {
          audio.play("start");
          startApproach();
        }
        return;
      }

      if (state.current === STATES.APPROACH) {
        if (action.type === "moveLeft") {
          leftHeld = action.phase === "pressed";
          if (action.phase === "pressed") {
            approachScene.nudge(-1, getLayout());
          }
          syncApproachDirection();
        }
        if (action.type === "moveRight") {
          rightHeld = action.phase === "pressed";
          if (action.phase === "pressed") {
            approachScene.nudge(1, getLayout());
          }
          syncApproachDirection();
        }
        if (action.type === "interact" && action.phase === "pressed") {
          approachScene.interact(getLayout());
        }
        return;
      }

      if (state.current === STATES.DIALOGUE && action.type === "start" && action.phase === "pressed") {
        dialogue.advance();
        return;
      }

      if (state.current === STATES.RUNNER) {
        if (action.type === "jump" && action.phase === "pressed") {
          runner.jump();
          audio.play("jump");
        }
        if (action.type === "duck") {
          runner.setDucking(action.phase === "pressed");
          if (action.phase === "pressed") {
            audio.play("duck");
          }
        }
        return;
      }

      if (state.current === STATES.GAME_OVER && action.type === "restart" && action.phase === "pressed") {
        audio.resume();
        if (state.transition("restart")) {
          collisionScore.reset();
          startRunner();
        }
      }

    }

    return {
      initialize() {
        approachScene.preparePreview(getLayout());
        showCurrentState();
      },
      handleAction,
      update(dt) {
        const layout = getLayout();
        if (state.current === STATES.APPROACH) {
          approachScene.update(dt, layout);
        }
        if (state.current === STATES.RUNNER) {
          runner.update(dt, layout);
        }
      },
      render(context, layout) {
        context.clearRect(0, 0, layout.width, layout.height);

        if (state.current === STATES.RUNNER) {
          runner.draw(context, layout);
          return;
        }

        if (state.current === STATES.GAME_OVER) {
          runner.drawBackground(context, layout);
          return;
        }

        approachScene.draw(context, layout, {
          preview: state.current === STATES.TITLE,
        });

        if (state.current === STATES.DIALOGUE) {
          assets.drawDialogueFocus(context, layout);
        }
      },
    };
  }

  function createInput({ targets, getState }) {
    const pointerEndEvents = ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"];
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

    function bindTouchTap(button, action) {
      if (!button) {
        return;
      }

      let touchStarted = false;

      button.addEventListener("touchstart", () => {
        touchStarted = true;
      }, { passive: true });

      button.addEventListener("touchcancel", () => {
        touchStarted = false;
      }, { passive: true });

      button.addEventListener("touchend", (event) => {
        if (!touchStarted) {
          return;
        }
        touchStarted = false;
        event.preventDefault();
        emitOnce(action, "touch");
      }, { passive: false });
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

      pointerEndEvents.forEach((eventName) => {
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

      function clearTextSelection() {
        const selection = window.getSelection?.();
        if (selection?.rangeCount) {
          selection.removeAllRanges();
        }
      }

      ["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
        button.addEventListener(eventName, (event) => {
          event.preventDefault();
          clearTextSelection();
        });
      });

      ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((eventName) => {
        button.addEventListener(eventName, (event) => {
          event.preventDefault();
          clearTextSelection();
        }, { passive: false });
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
    bindTouchTap(targets.jumpButton, "jump");
    preventLongPressSelection(targets.jumpButton);

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

  const canvas = document.querySelector("#gameCanvas");
  const context = canvas.getContext("2d", { alpha: false });

  const state = createGameState();
  const assets = createAssetStore();
  const ui = createUiHud({ state });
  const layout = createResponsiveLayout({ canvas });
  const audio = createAudio({ state });
  const collisionScore = createCollisionScore({ state });
  const approachScene = createApproachScene({ assets });
  const dialogue = createDialogue();
  const runner = createRunner({ assets, collisionScore });

  const sceneFlow = createSceneFlow({
    state,
    assets,
    ui,
    audio,
    approachScene,
    dialogue,
    runner,
    collisionScore,
    getLayout: layout.current,
  });

  const input = createInput({
    targets: ui.getInputTargets(),
    getState: () => state.current,
  });

  input.onAction(sceneFlow.handleAction);
  sceneFlow.initialize();

  let lastTime = performance.now();

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    sceneFlow.update(dt);

    const frameLayout = layout.current();
    context.setTransform(frameLayout.dpr, 0, 0, frameLayout.dpr, 0, 0);
    sceneFlow.render(context, frameLayout);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}());
