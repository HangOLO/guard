import { STATES } from "./game-state.js";

export function createSceneFlow({
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

  function update(dt) {
    const layout = getLayout();
    if (state.current === STATES.APPROACH) {
      approachScene.update(dt, layout);
    }
    if (state.current === STATES.RUNNER) {
      runner.update(dt, layout);
    }
  }

  function render(context, layout) {
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
  }

  return {
    initialize() {
      approachScene.preparePreview(getLayout());
      showCurrentState();
    },
    handleAction,
    update,
    render,
  };
}
