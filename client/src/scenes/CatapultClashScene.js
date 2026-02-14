// ============================================================
// CatapultClashScene — Two castles with health bars
// Correct answer → launch boulder at enemy castle
// First to destroy enemy castle wins!
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";
import { QuestionOverlay } from "../ui/QuestionOverlay.js";
import { HUD } from "../ui/HUD.js";
import { PowerUpBar } from "../ui/PowerUpBar.js";

export class CatapultClashScene extends Phaser.Scene {
  constructor() {
    super({ key: "CatapultClashScene" });
  }

  init(data) {
    this.gameState = data.state || {};
    this.currentQuestion = data.question || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x1a1a3e);

    // ── Sky with gradient ──
    this._drawSky(W, H);

    // ── Ground ──
    this.add.rectangle(W / 2, H - 30, W, 60, 0x6c5e3b);
    this.add.rectangle(W / 2, H - 5, W, 10, 0x4a3f2a);

    // ── Grass on top of ground ──
    for (let i = 0; i < W; i += 20) {
      this.add.rectangle(i, H - 60, 3, 8 + Math.random() * 6, 0x2ecc71, 0.6);
    }

    // ── Castle positions ──
    const castleY = H - 130;
    this.redCastleX = 140;
    this.blueCastleX = W - 140;

    // ── Red Castle ──
    this.redCastle = this._buildCastle(
      this.redCastleX,
      castleY,
      CONFIG.COLORS.RED,
      "🔴",
    );

    // ── Blue Castle ──
    this.blueCastle = this._buildCastle(
      this.blueCastleX,
      castleY,
      CONFIG.COLORS.BLUE,
      "🔵",
    );

    // ── Catapults ──
    this._drawCatapult(this.redCastleX + 100, H - 80, true);
    this._drawCatapult(this.blueCastleX - 100, H - 80, false);

    // ── Health Bars ──
    this.redHealthBg = this.add
      .rectangle(this.redCastleX, castleY - 90, 150, 18, 0x333333)
      .setStrokeStyle(1, 0x666);
    this.redHealthFill = this.add
      .rectangle(this.redCastleX - 75, castleY - 90, 150, 14, CONFIG.COLORS.RED)
      .setOrigin(0, 0.5);
    this.redHealthText = this.add
      .text(this.redCastleX, castleY - 90, "100 HP", {
        fontSize: "12px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.blueHealthBg = this.add
      .rectangle(this.blueCastleX, castleY - 90, 150, 18, 0x333333)
      .setStrokeStyle(1, 0x666);
    this.blueHealthFill = this.add
      .rectangle(
        this.blueCastleX - 75,
        castleY - 90,
        150,
        14,
        CONFIG.COLORS.BLUE,
      )
      .setOrigin(0, 0.5);
    this.blueHealthText = this.add
      .text(this.blueCastleX, castleY - 90, "100 HP", {
        fontSize: "12px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Team Labels ──
    this.add
      .text(this.redCastleX, 30, "🔴 RED CASTLE", {
        fontSize: "20px",
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(this.blueCastleX, 30, "🔵 BLUE CASTLE", {
        fontSize: "20px",
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Shot counters ──
    this.redShotsText = this.add
      .text(this.redCastleX, 55, "Shots: 0", {
        fontSize: "14px",
        color: "#ff6b6b",
      })
      .setOrigin(0.5);
    this.blueShotsText = this.add
      .text(this.blueCastleX, 55, "Shots: 0", {
        fontSize: "14px",
        color: "#74b9ff",
      })
      .setOrigin(0.5);

    // ── Timer ──
    this.timerText = this.add
      .text(W / 2, 25, "⏰ 100", {
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

    // ── Impact particles ──
    this.impactParticles = this.add.particles(0, 0, "particle-smoke", {
      speed: { min: 50, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
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

  _buildCastle(x, y, color, emoji) {
    const container = this.add.container(x, y);

    // Main wall
    const wall = this.add
      .rectangle(0, 0, 100, 80, 0x7f8c8d)
      .setStrokeStyle(2, 0x636e72);
    // Towers
    const tower1 = this.add
      .rectangle(-40, -30, 25, 50, 0x95a5a6)
      .setStrokeStyle(1, 0x636e72);
    const tower2 = this.add
      .rectangle(40, -30, 25, 50, 0x95a5a6)
      .setStrokeStyle(1, 0x636e72);
    // Battlements
    for (let i = -45; i <= 45; i += 15) {
      container.add(this.add.rectangle(i, -45, 10, 12, 0xbdc3c7));
    }
    // Gate
    const gate = this.add.rectangle(0, 20, 25, 35, 0x2d3436);
    const gateArch = this.add.arc(0, 3, 12.5, 180, 360, false, 0x2d3436);
    // Flag
    const flagPole = this.add.rectangle(0, -65, 3, 30, 0x636e72);
    const flag = this.add.rectangle(12, -72, 20, 12, color);
    // Emoji
    const label = this.add
      .text(0, -90, emoji, { fontSize: "28px" })
      .setOrigin(0.5);

    container.add([
      wall,
      tower1,
      tower2,
      gate,
      gateArch,
      flagPole,
      flag,
      label,
    ]);
    return container;
  }

  _drawCatapult(x, y, faceRight) {
    const dir = faceRight ? 1 : -1;
    // Base
    this.add.rectangle(x, y, 40, 15, 0x8b6914);
    // Arm
    this.add
      .line(0, 0, x, y - 5, x + dir * 35, y - 30, 0xc0915e, 1)
      .setLineWidth(4);
    // Bucket
    this.add.arc(x + dir * 35, y - 32, 10, 0, 180, false, 0x636e72);
  }

  _drawSky(W, H) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x2d1b4e, 0x2d1b4e);
    sky.fillRect(0, 0, W, H - 60);

    // Clouds
    for (let i = 0; i < 5; i++) {
      const cx = 100 + i * 250;
      const cy = 80 + Math.random() * 80;
      this.add.ellipse(cx, cy, 80 + Math.random() * 40, 30, 0xffffff, 0.08);
    }
  }

  // ── Health bar update ──
  _updateHealth() {
    if (!this.gameState) return;
    const redHP = this.gameState.redHealth ?? 100;
    const blueHP = this.gameState.blueHealth ?? 100;

    // Update fill widths (max 150px at 100HP)
    this.tweens.add({
      targets: this.redHealthFill,
      width: (redHP / 100) * 150,
      duration: 300,
    });
    this.tweens.add({
      targets: this.blueHealthFill,
      width: (blueHP / 100) * 150,
      duration: 300,
    });

    // Color change at low health
    if (redHP <= 30) this.redHealthFill.setFillStyle(0xff0000);
    if (blueHP <= 30) this.blueHealthFill.setFillStyle(0xff0000);

    this.redHealthText.setText(`${Math.round(redHP)} HP`);
    this.blueHealthText.setText(`${Math.round(blueHP)} HP`);

    this.redShotsText.setText(`Shots: ${this.gameState.redShots || 0}`);
    this.blueShotsText.setText(`Shots: ${this.gameState.blueShots || 0}`);
  }

  // ── Boulder launch animation ──
  _launchBoulder(attackerTeam) {
    const H = this.scale.height;
    const startX =
      attackerTeam === "red" ? this.redCastleX + 130 : this.blueCastleX - 130;
    const endX = attackerTeam === "red" ? this.blueCastleX : this.redCastleX;
    const startY = H - 150;
    const endY = H - 130;

    const boulder = this.add
      .circle(startX, startY, 12, 0x636e72)
      .setStrokeStyle(2, 0x444);
    const trail = this.add.particles(startX, startY, "particle-smoke", {
      follow: boulder,
      speed: 30,
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      frequency: 40,
      quantity: 1,
    });

    // Parabolic arc
    this.tweens.add({
      targets: boulder,
      x: endX,
      duration: 800,
      ease: "Linear",
    });
    this.tweens.add({
      targets: boulder,
      y: { from: startY, to: startY - 200 },
      duration: 400,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        // Impact!
        trail.destroy();
        boulder.destroy();
        this._showImpact(endX, endY, attackerTeam);
      },
    });
  }

  _showImpact(x, y, attackerTeam) {
    // Particles
    this.impactParticles.setPosition(x, y);
    this.impactParticles.explode(25);

    // Shake target castle
    const target = attackerTeam === "red" ? this.blueCastle : this.redCastle;
    this.tweens.add({
      targets: target,
      x: target.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 5,
    });

    this.cameras.main.shake(200, 0.008);

    // Damage number
    const dmg = this.add
      .text(x, y - 30, `-${this.gameState.damage || 12}`, {
        fontSize: "32px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: dmg,
      y: y - 80,
      alpha: 0,
      duration: 800,
      onComplete: () => dmg.destroy(),
    });
  }

  // ── Socket Listeners ──
  _setupListeners() {
    SocketManager.on("state-update", (data) => {
      this.gameState = data.state;
      this._updateHealth();
      if (data.lastAction && data.lastAction.type === "hit") {
        this._launchBoulder(data.team);
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
          `${teamLabel} +${data.pointsEarned} 💥`,
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
      this._updateHealth();
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
      this._updateHealth();
    });

    SocketManager.on("game-over", (data) => {
      this._cleanupListeners();
      this.scene.start("WinScene", {
        winner: data.winner,
        state: data.state,
        mode: "catapult-clash",
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

  update() {}
}
