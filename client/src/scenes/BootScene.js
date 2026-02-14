// ============================================================
// BootScene — Generates all placeholder assets programmatically
// No external asset files needed! Everything is drawn here.
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // We generate all assets programmatically — no file loads needed!
    this._createProgressBar();
  }

  create() {
    // Generate texture assets
    this._generateTextures();

    // Connect to server
    SocketManager.connect();

    // Transition to title screen
    this.time.delayedCall(500, () => {
      this.scene.start("TitleScene");
    });
  }

  _createProgressBar() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barW = 400;
    const barH = 30;

    const bg = this.add.rectangle(w / 2, h / 2 + 50, barW, barH, 0x333333);
    const fill = this.add.rectangle(
      w / 2 - barW / 2,
      h / 2 + 50,
      0,
      barH,
      CONFIG.COLORS.GOLD,
    );
    fill.setOrigin(0, 0.5);

    const title = this.add
      .text(w / 2, h / 2 - 60, "🧠 BattleBrains", CONFIG.FONT.TITLE)
      .setOrigin(0.5);
    const loadText = this.add
      .text(w / 2, h / 2 + 100, "Generating arena...", CONFIG.FONT.SMALL)
      .setOrigin(0.5);

    this.load.on("progress", (val) => {
      fill.width = barW * val;
    });
  }

  _generateTextures() {
    const g = this.make.graphics({ add: false });

    // ── Button texture ──
    g.clear();
    g.fillStyle(0x6c5ce7);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-purple", 280, 60);

    g.clear();
    g.fillStyle(CONFIG.COLORS.RED);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-red", 280, 60);

    g.clear();
    g.fillStyle(CONFIG.COLORS.BLUE);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-blue", 280, 60);

    g.clear();
    g.fillStyle(CONFIG.COLORS.GREEN);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-green", 280, 60);

    g.clear();
    g.fillStyle(CONFIG.COLORS.ORANGE);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-orange", 280, 60);

    g.clear();
    g.fillStyle(0x444466);
    g.fillRoundedRect(0, 0, 280, 60, 16);
    g.generateTexture("btn-dark", 280, 60);

    // ── Option buttons (wider for answers) ──
    g.clear();
    g.fillStyle(0x2d3436);
    g.fillRoundedRect(0, 0, 260, 50, 12);
    g.generateTexture("option-default", 260, 50);

    g.clear();
    g.fillStyle(CONFIG.COLORS.GREEN);
    g.fillRoundedRect(0, 0, 260, 50, 12);
    g.generateTexture("option-correct", 260, 50);

    g.clear();
    g.fillStyle(CONFIG.COLORS.RED);
    g.fillRoundedRect(0, 0, 260, 50, 12);
    g.generateTexture("option-wrong", 260, 50);

    // ── Rope segment ──
    g.clear();
    g.fillStyle(0xc0915e);
    g.fillRect(0, 0, 40, 20);
    g.generateTexture("rope-segment", 40, 20);

    // ── Rope knot / flag ──
    g.clear();
    g.fillStyle(0xffd700);
    g.fillCircle(15, 15, 15);
    g.generateTexture("rope-knot", 30, 30);

    // ── Mud puddle ──
    g.clear();
    g.fillStyle(CONFIG.COLORS.MUD);
    g.fillEllipse(100, 30, 200, 60);
    g.generateTexture("mud", 200, 60);

    // ── Rocket ──
    g.clear();
    g.fillStyle(CONFIG.COLORS.RED);
    g.fillTriangle(20, 0, 0, 50, 40, 50);
    g.fillRect(5, 50, 30, 20);
    g.generateTexture("rocket-red", 40, 70);

    g.clear();
    g.fillStyle(CONFIG.COLORS.BLUE);
    g.fillTriangle(20, 0, 0, 50, 40, 50);
    g.fillRect(5, 50, 30, 20);
    g.generateTexture("rocket-blue", 40, 70);

    // ── Castle ──
    g.clear();
    g.fillStyle(0x7f8c8d);
    g.fillRect(0, 30, 80, 50);
    g.fillRect(5, 0, 15, 30);
    g.fillRect(30, 0, 15, 30);
    g.fillRect(60, 0, 15, 30);
    g.generateTexture("castle", 80, 80);

    // ── Boulder / projectile ──
    g.clear();
    g.fillStyle(0x636e72);
    g.fillCircle(12, 12, 12);
    g.generateTexture("boulder", 24, 24);

    // ── Star particle ──
    g.clear();
    g.fillStyle(0xffd700);
    g.fillCircle(6, 6, 6);
    g.generateTexture("particle-star", 12, 12);

    // ── Fire particle ──
    g.clear();
    g.fillStyle(0xff6600);
    g.fillCircle(5, 5, 5);
    g.generateTexture("particle-fire", 10, 10);

    // ── Smoke particle ──
    g.clear();
    g.fillStyle(0x888888);
    g.fillCircle(8, 8, 8);
    g.generateTexture("particle-smoke", 16, 16);

    // ── Health bar background ──
    g.clear();
    g.fillStyle(0x333333);
    g.fillRoundedRect(0, 0, 200, 20, 6);
    g.generateTexture("healthbar-bg", 200, 20);

    // ── Power-up icons ──
    g.clear();
    g.fillStyle(0xf39c12);
    g.fillRoundedRect(0, 0, 50, 50, 10);
    g.generateTexture("powerup-double", 50, 50);

    g.clear();
    g.fillStyle(0x00cec9);
    g.fillRoundedRect(0, 0, 50, 50, 10);
    g.generateTexture("powerup-freeze", 50, 50);

    g.clear();
    g.fillStyle(0x6c5ce7);
    g.fillRoundedRect(0, 0, 50, 50, 10);
    g.generateTexture("powerup-shield", 50, 50);

    // ── Team indicator ──
    g.clear();
    g.fillStyle(CONFIG.COLORS.RED);
    g.fillCircle(10, 10, 10);
    g.generateTexture("team-red", 20, 20);

    g.clear();
    g.fillStyle(CONFIG.COLORS.BLUE);
    g.fillCircle(10, 10, 10);
    g.generateTexture("team-blue", 20, 20);

    g.destroy();
    console.log("✅ All textures generated");
  }
}
