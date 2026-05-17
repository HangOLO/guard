import { STATES } from "./game-state.js";

function setHidden(element, hidden) {
  if (!element) {
    return;
  }
  element.hidden = hidden;
}

export function createUiHud({ state }) {
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
