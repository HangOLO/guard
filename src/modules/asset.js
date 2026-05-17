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

export function createAssetStore() {
  const approachBackground = new Image();
  approachBackground.src = "assets/approach-background.png";
  const runnerBackground = new Image();
  runnerBackground.src = "assets/runner-background.png";

  return {
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
        const x = ((i * 173) % 1000) / 1000 * layout.width;
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
    drawRunway(context, layout, elapsed) {
      context.save();
      context.strokeStyle = "rgba(244, 220, 164, 0.26)";
      context.lineWidth = 3;
      const spacing = 96 * layout.spriteScale;
      const offset = (elapsed * 160 * layout.spriteScale) % spacing;
      for (let x = -spacing; x < layout.width + spacing; x += spacing) {
        context.beginPath();
        context.moveTo(x - offset, layout.floorY + 46 * layout.spriteScale);
        context.lineTo(x + 42 * layout.spriteScale - offset, layout.floorY + 37 * layout.spriteScale);
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
      const y = -117 * scale;
      context.save();
      context.translate(x, floorY);

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

      context.restore();
    },
    drawShieldSoldier(context, x, floorY, options) {
      const scale = options.scale;
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
    drawGroundMist(context, layout, alpha) {
      context.save();
      const gradient = context.createLinearGradient(0, layout.floorY - 40, 0, layout.floorY + 70);
      gradient.addColorStop(0, `rgba(226, 212, 181, ${alpha * 0.02})`);
      gradient.addColorStop(1, `rgba(226, 212, 181, ${alpha * 0.18})`);
      context.fillStyle = gradient;
      context.fillRect(0, layout.floorY - 40, layout.width, 110);
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
