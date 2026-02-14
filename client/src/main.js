// ============================================================
// BattleBrains — Main Entry Point (Phaser 3 Game Config)
// ============================================================

import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { LobbyScene } from "./scenes/LobbyScene.js";
import { TugOfWarScene } from "./scenes/TugOfWarScene.js";
import { RocketRushScene } from "./scenes/RocketRushScene.js";
import { CatapultClashScene } from "./scenes/CatapultClashScene.js";
import { WinScene } from "./scenes/WinScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#0a0a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: "100%",
    height: "100%",
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    LobbyScene,
    TugOfWarScene,
    RocketRushScene,
    CatapultClashScene,
    WinScene,
  ],
  input: {
    activePointers: 4, // support multi-touch
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(config);

// Hide loading screen once Phaser is ready
window.addEventListener("load", () => {
  setTimeout(() => {
    const el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, 800);
});

export default game;
