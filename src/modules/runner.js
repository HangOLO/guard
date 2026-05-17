export function createRunner({ assets, collisionScore }) {
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
  let sequence = 0;
  let obstacles = [];
  let pressureLevel = 0;

  function metrics(layout) {
    const scale = layout.spriteScale;
    const width = 44 * scale;
    const standingHeight = 104 * scale;
    const duckHeight = 62 * scale;
    return {
      scale,
      width,
      standingHeight,
      duckHeight,
      floorY: layout.floorY,
    };
  }

  function playerBox(layout) {
    const m = metrics(layout);
    const height = player.ducking ? m.duckHeight : m.standingHeight;
    return {
      x: player.x - m.width * 0.42,
      y: m.floorY - player.offsetY - height,
      width: m.width * 0.84,
      height,
    };
  }

  function obstacleBox(obstacle, layout) {
    const scale = layout.spriteScale;
    const floorY = layout.floorY;

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

  function spawnInterval() {
    return Math.max(1.05, 2.15 - pressureLevel * 0.18);
  }

  function spawn(layout) {
    const pattern = ["low", "spear", "shield"];
    const type = pattern[sequence % pattern.length];
    sequence += 1;
    obstacles.push({
      type,
      x: layout.width + 80,
      width: type === "spear" ? 100 * layout.spriteScale : 58 * layout.spriteScale,
      scored: false,
    });
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
      sequence = 0;
      pressureLevel = 0;
      obstacles = [];
    },
    start(layout) {
      this.reset();
      resetPlayer(layout);
      active = true;
      spawnTimer = 1.25;
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
        spawnTimer = spawnInterval();
      }

      const currentSpeed = speed(layout);
      obstacles.forEach((obstacle) => {
        obstacle.x -= currentSpeed * dt;
        obstacle.hitBox = obstacleBox(obstacle, layout);
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

      obstacles.forEach((obstacle) => {
        if (obstacle.type === "low") {
          assets.drawSoldier(context, obstacle.x, layout.floorY, {
            scale: layout.spriteScale,
            stance: "low",
          });
        } else if (obstacle.type === "shield") {
          assets.drawShieldSoldier(context, obstacle.x, layout.floorY, {
            scale: layout.spriteScale,
          });
        } else {
          assets.drawFlyingSpear(context, obstacle.x, layout.floorY, {
            scale: layout.spriteScale,
          });
        }
      });

      assets.drawChasingSoldier(context, Math.max(40 * layout.spriteScale, player.x - 86 * layout.spriteScale), layout.floorY, {
        scale: layout.spriteScale * 0.88,
        runTime: player.runTime,
      });

      assets.drawMatron(context, player.x, layout.floorY, {
        scale: layout.spriteScale,
        ducking: player.ducking,
        jumpingOffset: player.offsetY,
        walkTime: player.runTime,
      });
    },
    drawBackground(context, layout) {
      assets.drawBackdrop(context, layout, "runner");
      assets.drawRunway(context, layout, elapsed);
      assets.drawGroundMist(context, layout, 0.5);
    },
  };
}
