// ============================================================
// WinScene — Victory screen with celebration effects
// Shows winner, scores, and quick rematch button
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";

export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  init(data) {
    this.winner = data.winner || "red";
    this.gameState = data.state || {};
    this.mode = data.mode || "tug-of-war";
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = CONFIG.s(this);

    // ── Background ──
    const winColor = this.winner === "red" ? 0x2d1515 : 0x15152d;
    this.cameras.main.setBackgroundColor(winColor);

    // ── Celebration particles ──
    this._createCelebration(W, H);

    // ── Winner announcement ──
    const teamColor = this.winner === "red" ? "#ff6b6b" : "#74b9ff";
    const teamEmoji = this.winner === "red" ? "🔴" : "🔵";
    const teamName = this.winner === "red" ? "RED TEAM" : "BLUE TEAM";

    this.add
      .text(W / 2, Math.round(80 * s), "🏆 VICTORY! 🏆", {
        fontSize: CONFIG.fs(this, 58),
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: Math.max(3, Math.round(6 * s)),
      })
      .setOrigin(0.5);

    const winnerText = this.add
      .text(W / 2, Math.round(160 * s), `${teamEmoji} ${teamName} WINS! ${teamEmoji}`, {
        fontSize: CONFIG.fs(this, 38),
        color: teamColor,
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: Math.max(2, Math.round(4 * s)),
      })
      .setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: winnerText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // ── Mode-specific results ──
    const modeLabels = {
      "tug-of-war": "⚡ Tug-of-War",
      "rocket-rush": "🚀 Rocket Rush Race",
      "catapult-clash": "🏰 Catapult Castle Clash",
    };
    this.add
      .text(W / 2, Math.round(220 * s), modeLabels[this.mode] || this.mode, {
        fontSize: CONFIG.fs(this, 22),
        color: "#aaa",
      })
      .setOrigin(0.5);

    // ── Score summary ──
    this._showScoreSummary(W, H, s);

    // ── Rematch Button ──
    this._createButton(
      W / 2,
      H - Math.round(130 * s),
      "🔄 QUICK REMATCH",
      CONFIG.COLORS.GREEN,
      () => {
        SocketManager.rematch();
      },
      s,
    );

    // ── Back to Lobby ──
    this._createButton(
      W / 2,
      H - Math.round(65 * s),
      "🏠 Back to Lobby",
      CONFIG.COLORS.PURPLE,
      () => {
        SocketManager.off("rematch-started");
        this.scene.start("LobbyScene");
      },
      s,
    );

    // ── Listen for rematch ──
    SocketManager.on("rematch-started", (data) => {
      const sceneMap = {
        "tug-of-war": "TugOfWarScene",
        "rocket-rush": "RocketRushScene",
        "catapult-clash": "CatapultClashScene",
      };
      SocketManager.off("rematch-started");
      this.scene.start(sceneMap[this.mode], {
        state: data.state,
        question: data.question,
        mode: this.mode,
      });
    });

    // ── Keyboard shortcuts ──
    this.input.keyboard.on("keydown-R", () => {
      SocketManager.rematch();
    });
    this.input.keyboard.on("keydown-ESC", () => {
      SocketManager.off("rematch-started");
      this.scene.start("LobbyScene");
    });

    // Screen shake on entry
    this.cameras.main.shake(300, 0.01);

    // ── Handle window resize / orientation change ──
    this.scale.on('resize', this._handleResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this._handleResize, this));
  }

  _handleResize() {
    if (this._resizeDebounce) clearTimeout(this._resizeDebounce);
    this._resizeDebounce = setTimeout(() => {
      if (this.scene.isActive('WinScene')) {
        SocketManager.off('rematch-started');
        this.scene.restart({ winner: this.winner, state: this.gameState, mode: this.mode });
      }
    }, 250);
  }

  _showScoreSummary(W, H, s) {
    const scores = this.gameState.scores || { red: 0, blue: 0 };
    const centerY = Math.round(300 * s);
    const panelW = Math.min(Math.round(500 * s), W - 30);
    const panelH = Math.round(150 * s);

    // Panel
    this.add
      .rectangle(W / 2, centerY + Math.round(30 * s), panelW, panelH, 0x111122, 0.8)
      .setStrokeStyle(2, 0x333366);

    this.add
      .text(W / 2, centerY - Math.round(30 * s), "📊 Final Scores", {
        fontSize: CONFIG.fs(this, 22),
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Red score
    this.add
      .text(W / 2 - Math.round(90 * s), centerY + Math.round(10 * s), `🔴 Red: ${scores.red}`, {
        fontSize: CONFIG.fs(this, 26),
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Blue score
    this.add
      .text(W / 2 + Math.round(90 * s), centerY + Math.round(10 * s), `🔵 Blue: ${scores.blue}`, {
        fontSize: CONFIG.fs(this, 26),
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Mode-specific stats
    let statsText = "";
    switch (this.mode) {
      case "tug-of-war":
        statsText = `Red Pulls: ${this.gameState.redPulls || 0}  |  Blue Pulls: ${this.gameState.bluePulls || 0}`;
        break;
      case "rocket-rush":
        statsText = `Red Alt: ${Math.round(this.gameState.redAltitude || 0)}%  |  Blue Alt: ${Math.round(this.gameState.blueAltitude || 0)}%`;
        break;
      case "catapult-clash":
        statsText = `Red HP: ${this.gameState.redHealth || 0}  |  Blue HP: ${this.gameState.blueHealth || 0}  |  Shots: ${(this.gameState.redShots || 0) + (this.gameState.blueShots || 0)}`;
        break;
    }
    this.add
      .text(W / 2, centerY + Math.round(55 * s), statsText, {
        fontSize: CONFIG.fs(this, 15),
        color: "#888",
      })
      .setOrigin(0.5);

    // Hint text
    if (W > 500) {
      this.add
        .text(W / 2, centerY + Math.round(85 * s), "Press R for rematch  |  ESC for lobby", {
          fontSize: CONFIG.fs(this, 13),
          color: "#555",
        })
        .setOrigin(0.5);
    }
  }

  _createCelebration(W, H) {
    const colors = [0xffd700, 0xff6b6b, 0x74b9ff, 0x2ecc71, 0xe67e22, 0x9b59b6];

    // Confetti particles
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * W;
      const y = -20 - Math.random() * 200;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 4 + Math.random() * 8;

      const confetti = this.add
        .rectangle(x, y, size, size * 1.5, color)
        .setAngle(Math.random() * 360);

      this.tweens.add({
        targets: confetti,
        y: H + 50,
        angle: confetti.angle + Phaser.Math.Between(-360, 360),
        duration: 2000 + Math.random() * 3000,
        delay: Math.random() * 1000,
        repeat: -1,
        onRepeat: () => {
          confetti.y = -20;
          confetti.x = Math.random() * W;
        },
      });
    }

    // Star burst from center
    if (this.textures.exists("particle-star")) {
      const burst = this.add.particles(W / 2, 80, "particle-star", {
        speed: { min: 100, max: 400 },
        scale: { start: 1.5, end: 0 },
        lifespan: 1500,
        quantity: 3,
        frequency: 200,
        blendMode: "ADD",
        tint: [0xffd700, 0xff6b6b, 0x74b9ff],
      });
    }
  }

  _createButton(x, y, label, color, onClick, s) {
    s = s || CONFIG.s(this);
    const hex = "#" + color.toString(16).padStart(6, "0");
    const padX = Math.max(12, Math.round(24 * s));
    const padY = Math.max(8, Math.round(12 * s));
    const btn = this.add
      .text(x, y, label, {
        fontSize: CONFIG.fs(this, 24),
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: hex,
        padding: { x: padX, y: padY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setScale(1.05));
    btn.on("pointerout", () => btn.setScale(1));
    btn.on("pointerdown", () => {
      btn.setScale(0.95);
      onClick();
    });
    btn.on("pointerup", () => btn.setScale(1));

    return btn;
  }
}
