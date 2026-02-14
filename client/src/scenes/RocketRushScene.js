// ============================================================
// RocketRushScene — Two rockets racing to the top
// Correct answer → rocket thrust/boost
// First to reach the finish line (stars) wins!
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";
import { QuestionOverlay } from "../ui/QuestionOverlay.js";
import { HUD } from "../ui/HUD.js";
import { PowerUpBar } from "../ui/PowerUpBar.js";

export class RocketRushScene extends Phaser.Scene {
  constructor() {
    super({ key: "RocketRushScene" });
  }

  init(data) {
    this.gameState = data.state || {};
    this.currentQuestion = data.question || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0a0a2e);

    // ── Starfield background ──
    this._drawStarfield(W, H);

    // ── Finish line at top ──
    this.add.rectangle(W / 2, 50, W, 4, CONFIG.COLORS.GOLD);
    this.add
      .text(W / 2, 25, "🏁 FINISH LINE 🏁", {
        fontSize: "20px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Launch pad at bottom ──
    this.add.rectangle(W / 2, H - 30, W, 60, 0x2d3436);
    this.add
      .text(W / 4, H - 30, "🔴 RED PAD", { fontSize: "14px", color: "#ff6b6b" })
      .setOrigin(0.5);
    this.add
      .text((3 * W) / 4, H - 30, "🔵 BLUE PAD", {
        fontSize: "14px",
        color: "#74b9ff",
      })
      .setOrigin(0.5);

    // ── Track lanes ──
    const laneRedX = W / 4;
    const laneBlueX = (3 * W) / 4;

    // Lane divider
    this.add.line(0, 0, W / 2, 60, W / 2, H - 60, 0xffffff, 0.15).setOrigin(0);

    // ── Altitude markers ──
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = this._altitudeToY(pct);
      this.add.line(0, 0, 20, y, W - 20, y, 0xffffff, 0.1).setOrigin(0);
      this.add.text(10, y - 10, `${pct}%`, { fontSize: "12px", color: "#666" });
    }

    // ── Rockets ──
    this.trackTop = 70;
    this.trackBottom = H - 70;

    this.redRocket = this._createRocket(
      laneRedX,
      this.trackBottom,
      CONFIG.COLORS.RED,
      "🔴",
    );
    this.blueRocket = this._createRocket(
      laneBlueX,
      this.trackBottom,
      CONFIG.COLORS.BLUE,
      "🔵",
    );

    // ── Exhaust particles ──
    this.redExhaust = this.add.particles(
      laneRedX,
      this.trackBottom + 30,
      "particle-fire",
      {
        speed: { min: 50, max: 150 },
        angle: { min: 80, max: 100 },
        scale: { start: 0.8, end: 0 },
        lifespan: 400,
        frequency: 50,
        blendMode: "ADD",
        tint: [0xff4444, 0xff8800, 0xffff00],
      },
    );

    this.blueExhaust = this.add.particles(
      laneBlueX,
      this.trackBottom + 30,
      "particle-fire",
      {
        speed: { min: 50, max: 150 },
        angle: { min: 80, max: 100 },
        scale: { start: 0.8, end: 0 },
        lifespan: 400,
        frequency: 50,
        blendMode: "ADD",
        tint: [0x4444ff, 0x0088ff, 0x00ffff],
      },
    );

    // ── Altitude text ──
    this.redAltText = this.add
      .text(laneRedX, H - 10, "Alt: 0%", {
        fontSize: "16px",
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.blueAltText = this.add
      .text(laneBlueX, H - 10, "Alt: 0%", {
        fontSize: "16px",
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Timer ──
    this.timerText = this.add
      .text(W / 2, 80, "⏰ 100", {
        fontSize: "28px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── HUD + Power-ups ──
    this.hud = new HUD(this);
    this.powerUpBar = new PowerUpBar(this);

    // ── Question Overlay ──
    this.questionOverlay = new QuestionOverlay(this, (answerIndex) => {
      SocketManager.submitAnswer(answerIndex, SocketManager.team);
    });

    if (this.currentQuestion) {
      this.questionOverlay.showQuestion(this.currentQuestion);
    }

    // ── Boost particles ──
    this.boostParticles = this.add.particles(0, 0, "particle-star", {
      speed: { min: 100, max: 300 },
      scale: { start: 1.2, end: 0 },
      lifespan: 500,
      blendMode: "ADD",
      emitting: false,
    });

    // ── Quit Game button (top-right corner) ──
    this._createQuitButton(W);

    // ── Socket + keyboard ──
    this._setupListeners();
    this._setupKeyboard();
  }

  _createQuitButton(W) {
    const quitBtn = this.add.text(W - 16, 16, "✖ Quit Game", {
      fontSize: "16px",
      fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
      color: "#ff6b6b",
      backgroundColor: "#1a1a2e",
      padding: { x: 14, y: 8 },
      stroke: "#000",
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(300)
      .setAlpha(0.9);

    quitBtn.on("pointerover", () => {
      quitBtn.setStyle({ backgroundColor: "#e74c3c", color: "#fff" });
      this.tweens.add({ targets: quitBtn, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    quitBtn.on("pointerout", () => {
      quitBtn.setStyle({ backgroundColor: "#1a1a2e", color: "#ff6b6b" });
      this.tweens.add({ targets: quitBtn, scaleX: 1, scaleY: 1, duration: 100 });
    });
    quitBtn.on("pointerdown", () => {
      this._showQuitConfirm();
    });
  }

  _showQuitConfirm() {
    if (this._quitOverlay) return;
    const W = this.scale.width;
    const H = this.scale.height;

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(400).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, 420, 200, 0x1a1a2e, 0.97).setStrokeStyle(3, 0xe74c3c).setDepth(401);
    const shadow = this.add.rectangle(W / 2 + 6, H / 2 + 8, 420, 200, 0x000000, 0.3).setDepth(400);
    const title = this.add.text(W / 2, H / 2 - 55, "⚠️  Quit Game?", {
      fontSize: "28px", fontStyle: "bold", color: "#ffd700",
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(402);
    const msg = this.add.text(W / 2, H / 2 - 10, "You will leave the current match.", {
      fontSize: "16px", color: "#ccc",
    }).setOrigin(0.5).setDepth(402);

    const yesBtn = this.add.text(W / 2 - 80, H / 2 + 50, "Yes, Quit", {
      fontSize: "18px", fontStyle: "bold", color: "#fff", backgroundColor: "#e74c3c",
      padding: { x: 18, y: 8 }, stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(402);
    yesBtn.on("pointerover", () => yesBtn.setStyle({ backgroundColor: "#ff4444" }));
    yesBtn.on("pointerout", () => yesBtn.setStyle({ backgroundColor: "#e74c3c" }));
    yesBtn.on("pointerdown", () => {
      this._cleanupListeners();
      SocketManager.leaveRoom();
      this.scene.start("LobbyScene");
    });

    const noBtn = this.add.text(W / 2 + 80, H / 2 + 50, "Cancel", {
      fontSize: "18px", fontStyle: "bold", color: "#fff", backgroundColor: "#636e72",
      padding: { x: 18, y: 8 }, stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(402);
    noBtn.on("pointerover", () => noBtn.setStyle({ backgroundColor: "#74b9ff" }));
    noBtn.on("pointerout", () => noBtn.setStyle({ backgroundColor: "#636e72" }));
    noBtn.on("pointerdown", () => {
      [dim, panel, shadow, title, msg, yesBtn, noBtn].forEach(o => o.destroy());
      this._quitOverlay = null;
    });

    this._quitOverlay = { dim, panel, shadow, title, msg, yesBtn, noBtn };
  }

  _createRocket(x, y, color, emoji) {
    const container = this.add.container(x, y);

    // Rocket body
    const body = this.add
      .rectangle(0, 0, 30, 50, color)
      .setStrokeStyle(2, 0xffffff);
    const nose = this.add.triangle(0, -35, -15, 0, 15, 0, 0, -20, color);
    const fin1 = this.add.triangle(-18, 20, 0, -10, 0, 10, -12, 10, color);
    const fin2 = this.add.triangle(18, 20, 0, -10, 0, 10, 12, 10, color);
    const window = this.add.circle(0, -8, 8, 0x74b9ff);
    const label = this.add
      .text(0, -60, emoji, { fontSize: "24px" })
      .setOrigin(0.5);

    container.add([body, nose, fin1, fin2, window, label]);
    return container;
  }

  _drawStarfield(W, H) {
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.8 + 0.2;
      const star = this.add.circle(x, y, size, 0xffffff, alpha);

      // Twinkle
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.3,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  _altitudeToY(altitude) {
    // 0% = trackBottom, 100% = trackTop
    return (
      this.trackBottom - (altitude / 100) * (this.trackBottom - this.trackTop)
    );
  }

  // ── Socket Listeners ──
  _setupListeners() {
    SocketManager.on("state-update", (data) => {
      this.gameState = data.state;
      this._updateRockets();
      if (data.lastAction && data.lastAction.type === "boost") {
        this._showBoostEffect(data.team);
      }
      if (data.lastAction && data.lastAction.type === "shielded") {
        this.hud.showFloatingText(`🛡️ ${data.lastAction.description}`, CONFIG.COLORS.PURPLE);
      }
    });

    SocketManager.on("answer-result", (data) => {
      this.questionOverlay.showResult(data.correct, data.team);
      if (data.correct) {
        const color =
          data.team === "red"
            ? CONFIG.COLORS.RED_LIGHT
            : CONFIG.COLORS.BLUE_LIGHT;
        const teamLabel = data.team === "red" ? "RED" : "BLUE";
        this.hud.showFloatingText(
          `${teamLabel} +${data.pointsEarned} 🚀`,
          color,
        );
      }
    });

    SocketManager.on("answer-rejected", (data) => {
      const msg = data?.reason || "Already answered!";
      this.hud.showFloatingText(msg, CONFIG.COLORS.GRAY);
    });

    SocketManager.on("new-question", (data) => {
      this.gameState = data.state;
      this._updateRockets();
      this.questionOverlay.showQuestion(data.question);
      // Reset per-team answered tracking for next round
      if (this.teamAnswered) this.teamAnswered = { red: false, blue: false };
    });

    SocketManager.on("timer-tick", (data) => {
      this.timerText.setText(`⏰ ${data.timeLeft}`);
      if (data.timeLeft <= 10) this.timerText.setColor("#ff0000");
      else this.timerText.setColor("#ffd700");
    });

    SocketManager.on("both-wrong", (data) => {
      this.hud.showFloatingText(
        data.message || "Both wrong! Next question...",
        CONFIG.COLORS.ORANGE,
      );
    });

    SocketManager.on("powerup-activated", (data) => {
      this.hud.showPowerUpNotification(
        data.type,
        data.team,
        data.effect.description,
      );
      this.gameState = data.state;
      this._updateRockets();
    });

    SocketManager.on("game-over", (data) => {
      this._cleanupListeners();
      this.scene.start("WinScene", {
        winner: data.winner,
        state: data.state,
        mode: "rocket-rush",
      });
    });

    SocketManager.on("opponent-left", (data) => {
      this._showOpponentLeftOverlay(data.message || "Your opponent has left the match!");
    });
  }

  _showOpponentLeftOverlay(message) {
    if (this._opponentLeftShown) return;
    this._opponentLeftShown = true;
    const W = this.scale.width;
    const H = this.scale.height;

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(500).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, 480, 220, 0x1a1a2e, 0.97).setStrokeStyle(3, 0xffd700).setDepth(501);
    const shadow = this.add.rectangle(W / 2 + 6, H / 2 + 8, 480, 220, 0x000000, 0.3).setDepth(500);
    const icon = this.add.text(W / 2, H / 2 - 60, "🚪", { fontSize: "48px" }).setOrigin(0.5).setDepth(502);
    const title = this.add.text(W / 2, H / 2 - 15, "Opponent Left!", {
      fontSize: "28px", fontStyle: "bold", color: "#ffd700",
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(502);
    const msg = this.add.text(W / 2, H / 2 + 25, message, {
      fontSize: "16px", color: "#ccc",
    }).setOrigin(0.5).setDepth(502);
    const okBtn = this.add.text(W / 2, H / 2 + 70, "Back to Lobby", {
      fontSize: "20px", fontStyle: "bold", color: "#fff", backgroundColor: "#6c5ce7",
      padding: { x: 24, y: 10 }, stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(502);
    okBtn.on("pointerover", () => okBtn.setStyle({ backgroundColor: "#a29bfe" }));
    okBtn.on("pointerout", () => okBtn.setStyle({ backgroundColor: "#6c5ce7" }));
    okBtn.on("pointerdown", () => {
      this._cleanupListeners();
      this.scene.start("LobbyScene");
    });

    this.time.delayedCall(5000, () => {
      if (this._opponentLeftShown) {
        this._cleanupListeners();
        this.scene.start("LobbyScene");
      }
    });
  }

  _cleanupListeners() {
    [
      "state-update",
      "answer-result",
      "answer-rejected",
      "both-wrong",
      "new-question",
      "timer-tick",
      "powerup-activated",
      "game-over",
      "opponent-left",
      "player-left",
    ].forEach((e) => SocketManager.off(e));
  }

  _setupKeyboard() {
    const redKeys = CONFIG.KEYS.RED.ANSWER;
    const blueKeys = CONFIG.KEYS.BLUE.ANSWER;
    const numberKeys = ["1", "2", "3", "4"]; // multi-device: submits for YOUR team
    this.teamAnswered = { red: false, blue: false };

    this.input.keyboard.on("keydown", (event) => {
      const key = event.key.toUpperCase();

      // Number keys 1-4: submit for YOUR assigned team (multi-device mode)
      const numIdx = numberKeys.indexOf(event.key);
      if (numIdx !== -1) {
        const myTeam = SocketManager.team || "red";
        if (!this.teamAnswered[myTeam]) {
          this.teamAnswered[myTeam] = true;
          SocketManager.submitAnswer(numIdx, myTeam);
          this.questionOverlay.highlightOption(numIdx, myTeam);
        }
        return;
      }

      const redIdx = redKeys.indexOf(key);
      if (redIdx !== -1 && !this.teamAnswered.red) {
        this.teamAnswered.red = true;
        SocketManager.submitAnswer(redIdx, "red");
        this.questionOverlay.highlightOption(redIdx, "red");
      }
      const blueIdx = blueKeys.indexOf(key);
      if (blueIdx !== -1 && !this.teamAnswered.blue) {
        this.teamAnswered.blue = true;
        SocketManager.submitAnswer(blueIdx, "blue");
        this.questionOverlay.highlightOption(blueIdx, "blue");
      }
      if (key === CONFIG.KEYS.RED.POWERUP) this.powerUpBar.useNext("red");
      if (key === CONFIG.KEYS.BLUE.POWERUP) this.powerUpBar.useNext("blue");
    });
  }

  // ── Update rockets based on server state ──
  _updateRockets() {
    if (!this.gameState) return;

    const redAlt = this.gameState.redAltitude || 0;
    const blueAlt = this.gameState.blueAltitude || 0;

    // Animate rockets
    const redY = this._altitudeToY(redAlt);
    const blueY = this._altitudeToY(blueAlt);

    this.tweens.add({
      targets: this.redRocket,
      y: redY,
      duration: 300,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.blueRocket,
      y: blueY,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Move exhaust
    this.redExhaust.setPosition(this.redRocket.x, redY + 35);
    this.blueExhaust.setPosition(this.blueRocket.x, blueY + 35);

    // Update text
    this.redAltText.setText(`Alt: ${Math.round(redAlt)}%`);
    this.blueAltText.setText(`Alt: ${Math.round(blueAlt)}%`);
  }

  _showBoostEffect(team) {
    const rocket = team === "red" ? this.redRocket : this.blueRocket;
    this.boostParticles.setPosition(rocket.x, rocket.y);
    this.boostParticles.explode(20);

    // Brief scale pop
    this.tweens.add({
      targets: rocket,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
    });

    this.cameras.main.shake(100, 0.003);
  }

  update() {
    // Exhaust follows rockets smoothly
    if (this.redRocket && this.redExhaust) {
      this.redExhaust.setPosition(this.redRocket.x, this.redRocket.y + 35);
    }
    if (this.blueRocket && this.blueExhaust) {
      this.blueExhaust.setPosition(this.blueRocket.x, this.blueRocket.y + 35);
    }
  }
}
