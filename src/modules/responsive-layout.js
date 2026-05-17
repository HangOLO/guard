export function createResponsiveLayout({ canvas }) {
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
