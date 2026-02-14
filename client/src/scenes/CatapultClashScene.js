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
    const s = CONFIG.s(this);

    this.cameras.main.setBackgroundColor(0x1a1a3e);

    // ── Sky with gradient ──
    this._drawSky(W, H, s);

    // ── Ground ──
    this.add.rectangle(W / 2, H - Math.round(30 * s), W, Math.round(60 * s), 0x6c5e3b);
    this.add.rectangle(W / 2, H - Math.round(5 * s), W, Math.round(10 * s), 0x4a3f2a);

    // ── Grass on top of ground ──
    const grassSpacing = Math.max(10, Math.round(20 * s));
    for (let i = 0; i < W; i += grassSpacing) {
      this.add.rectangle(i, H - Math.round(60 * s), Math.max(2, Math.round(3 * s)), Math.round((8 + Math.random() * 6) * s), 0x2ecc71, 0.6);
    }

    // ── Castle positions ──
    const castleY = H - Math.round(130 * s);
    this.redCastleX = Math.max(Math.round(80 * s), Math.round(W * 0.12));
    this.blueCastleX = W - Math.max(Math.round(80 * s), Math.round(W * 0.12));
    this._sceneScale = s;

    // ── Red Castle ──
    this.redCastle = this._buildCastle(
      this.redCastleX,
      castleY,
      CONFIG.COLORS.RED,
      "🔴",
      s,
    );

    // ── Blue Castle ──
    this.blueCastle = this._buildCastle(
      this.blueCastleX,
      castleY,
      CONFIG.COLORS.BLUE,
      "🔵",
      s,
    );

    // ── Catapults ──
    this._drawCatapult(this.redCastleX + Math.round(80 * s), H - Math.round(80 * s), true, s);
    this._drawCatapult(this.blueCastleX - Math.round(80 * s), H - Math.round(80 * s), false, s);

    // ── Health Bars ──
    const hpW = Math.min(Math.round(150 * s), (this.blueCastleX - this.redCastleX) / 2 - 10);
    this._healthBarW = hpW;
    this.redHealthBg = this.add
      .rectangle(this.redCastleX, castleY - Math.round(90 * s), hpW, Math.round(18 * s), 0x333333)
      .setStrokeStyle(1, 0x666);
    this.redHealthFill = this.add
      .rectangle(this.redCastleX - hpW / 2, castleY - Math.round(90 * s), hpW, Math.round(14 * s), CONFIG.COLORS.RED)
      .setOrigin(0, 0.5);
    this.redHealthText = this.add
      .text(this.redCastleX, castleY - Math.round(90 * s), "100 HP", {
        fontSize: CONFIG.fs(this, 11),
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.blueHealthBg = this.add
      .rectangle(this.blueCastleX, castleY - Math.round(90 * s), hpW, Math.round(18 * s), 0x333333)
      .setStrokeStyle(1, 0x666);
    this.blueHealthFill = this.add
      .rectangle(
        this.blueCastleX - hpW / 2,
        castleY - Math.round(90 * s),
        hpW,
        Math.round(14 * s),
        CONFIG.COLORS.BLUE,
      )
      .setOrigin(0, 0.5);
    this.blueHealthText = this.add
      .text(this.blueCastleX, castleY - Math.round(90 * s), "100 HP", {
        fontSize: CONFIG.fs(this, 11),
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Team Labels ──
    this.add
      .text(this.redCastleX, Math.round(30 * s), "🔴 RED CASTLE", {
        fontSize: CONFIG.fs(this, 18),
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(this.blueCastleX, Math.round(30 * s), "🔵 BLUE CASTLE", {
        fontSize: CONFIG.fs(this, 18),
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Shot counters ──
    this.redShotsText = this.add
      .text(this.redCastleX, Math.round(55 * s), "Shots: 0", {
        fontSize: CONFIG.fs(this, 13),
        color: "#ff6b6b",
      })
      .setOrigin(0.5);
    this.blueShotsText = this.add
      .text(this.blueCastleX, Math.round(55 * s), "Shots: 0", {
        fontSize: CONFIG.fs(this, 13),
        color: "#74b9ff",
      })
      .setOrigin(0.5);

    // ── Timer ──
    this.timerText = this.add
      .text(W / 2, Math.round(25 * s), "⏰ 100", {
        fontSize: CONFIG.fs(this, 26),
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
    this._createQuitButton(W, s);

    // ── Socket + keyboard ──
    this._setupListeners();
    this._setupKeyboard();

    // ── Handle window resize / orientation change ──
    this.scale.on('resize', this._handleResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this._handleResize, this));
  }

  _handleResize() {
    if (this._resizeDebounce) clearTimeout(this._resizeDebounce);
    this._resizeDebounce = setTimeout(() => {
      if (this.scene.isActive('CatapultClashScene')) {
        this._cleanupListeners();
        this.scene.restart({ state: this.gameState, question: this.currentQuestion });
      }
    }, 300);
  }

  _createQuitButton(W, s) {
    s = s || CONFIG.s(this);
    const quitBtn = this.add.text(W - Math.round(16 * s), Math.round(16 * s), "✖ Quit Game", {
      fontSize: CONFIG.fs(this, 14),
      fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
      color: "#ff6b6b",
      backgroundColor: "#1a1a2e",
      padding: { x: Math.round(12 * s), y: Math.round(6 * s) },
      stroke: "#000",
      strokeThickness: Math.max(1, Math.round(2 * s)),
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
    const s = CONFIG.s(this);
    const panelW = Math.min(Math.round(420 * s), W - 20);
    const panelH = Math.min(Math.round(200 * s), H - 20);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(400).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e, 0.97).setStrokeStyle(Math.max(1, Math.round(3 * s)), 0xe74c3c).setDepth(401);
    const shadow = this.add.rectangle(W / 2 + Math.round(6 * s), H / 2 + Math.round(8 * s), panelW, panelH, 0x000000, 0.3).setDepth(400);
    const title = this.add.text(W / 2, H / 2 - Math.round(55 * s), "⚠️  Quit Game?", {
      fontSize: CONFIG.fs(this, 26), fontStyle: "bold", color: "#ffd700",
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(402);
    const msg = this.add.text(W / 2, H / 2 - Math.round(10 * s), "You will leave the current match.", {
      fontSize: CONFIG.fs(this, 14), color: "#ccc",
    }).setOrigin(0.5).setDepth(402);

    const yesBtn = this.add.text(W / 2 - Math.round(80 * s), H / 2 + Math.round(50 * s), "Yes, Quit", {
      fontSize: CONFIG.fs(this, 16), fontStyle: "bold", color: "#fff", backgroundColor: "#e74c3c",
      padding: { x: Math.round(16 * s), y: Math.round(7 * s) }, stroke: "#000", strokeThickness: Math.max(1, Math.round(2 * s)),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(402);
    yesBtn.on("pointerover", () => yesBtn.setStyle({ backgroundColor: "#ff4444" }));
    yesBtn.on("pointerout", () => yesBtn.setStyle({ backgroundColor: "#e74c3c" }));
    yesBtn.on("pointerdown", () => {
      this._cleanupListeners();
      SocketManager.leaveRoom();
      this.scene.start("LobbyScene");
    });

    const noBtn = this.add.text(W / 2 + Math.round(80 * s), H / 2 + Math.round(50 * s), "Cancel", {
      fontSize: CONFIG.fs(this, 16), fontStyle: "bold", color: "#fff", backgroundColor: "#636e72",
      padding: { x: Math.round(16 * s), y: Math.round(7 * s) }, stroke: "#000", strokeThickness: Math.max(1, Math.round(2 * s)),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(402);
    noBtn.on("pointerover", () => noBtn.setStyle({ backgroundColor: "#74b9ff" }));
    noBtn.on("pointerout", () => noBtn.setStyle({ backgroundColor: "#636e72" }));
    noBtn.on("pointerdown", () => {
      [dim, panel, shadow, title, msg, yesBtn, noBtn].forEach(o => o.destroy());
      this._quitOverlay = null;
    });

    this._quitOverlay = { dim, panel, shadow, title, msg, yesBtn, noBtn };
  }

  _buildCastle(x, y, color, emoji, s) {
    s = s || CONFIG.s(this);
    const container = this.add.container(x, y);

    // Main wall
    const ww = Math.round(100 * s), wh = Math.round(80 * s);
    const wall = this.add
      .rectangle(0, 0, ww, wh, 0x7f8c8d)
      .setStrokeStyle(Math.max(1, Math.round(2 * s)), 0x636e72);
    // Towers
    const tw = Math.round(25 * s), th = Math.round(50 * s);
    const tower1 = this.add
      .rectangle(Math.round(-40 * s), Math.round(-30 * s), tw, th, 0x95a5a6)
      .setStrokeStyle(1, 0x636e72);
    const tower2 = this.add
      .rectangle(Math.round(40 * s), Math.round(-30 * s), tw, th, 0x95a5a6)
      .setStrokeStyle(1, 0x636e72);
    // Battlements
    for (let i = Math.round(-45 * s); i <= Math.round(45 * s); i += Math.max(8, Math.round(15 * s))) {
      container.add(this.add.rectangle(i, Math.round(-45 * s), Math.round(10 * s), Math.round(12 * s), 0xbdc3c7));
    }
    // Gate
    const gate = this.add.rectangle(0, Math.round(20 * s), Math.round(25 * s), Math.round(35 * s), 0x2d3436);
    const gateArch = this.add.arc(0, Math.round(3 * s), Math.round(12.5 * s), 180, 360, false, 0x2d3436);
    // Flag
    const flagPole = this.add.rectangle(0, Math.round(-65 * s), Math.max(2, Math.round(3 * s)), Math.round(30 * s), 0x636e72);
    const flag = this.add.rectangle(Math.round(12 * s), Math.round(-72 * s), Math.round(20 * s), Math.round(12 * s), color);
    // Emoji
    const label = this.add
      .text(0, Math.round(-90 * s), emoji, { fontSize: CONFIG.fs(this, 24) })
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

  _drawCatapult(x, y, faceRight, s) {
    s = s || CONFIG.s(this);
    const dir = faceRight ? 1 : -1;
    // Base
    this.add.rectangle(x, y, Math.round(40 * s), Math.round(15 * s), 0x8b6914);
    // Arm
    this.add
      .line(0, 0, x, y - Math.round(5 * s), x + dir * Math.round(35 * s), y - Math.round(30 * s), 0xc0915e, 1)
      .setLineWidth(Math.max(2, Math.round(4 * s)));
    // Bucket
    this.add.arc(x + dir * Math.round(35 * s), y - Math.round(32 * s), Math.round(10 * s), 0, 180, false, 0x636e72);
  }

  _drawSky(W, H, s) {
    s = s || CONFIG.s(this);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x2d1b4e, 0x2d1b4e);
    sky.fillRect(0, 0, W, H - Math.round(60 * s));

    // Clouds
    const cloudCount = Math.max(2, Math.min(5, Math.floor(W / 250)));
    const cloudSpacing = W / (cloudCount + 1);
    for (let i = 0; i < cloudCount; i++) {
      const cx = cloudSpacing * (i + 1);
      const cy = Math.round((80 + Math.random() * 80) * s);
      this.add.ellipse(cx, cy, Math.round((80 + Math.random() * 40) * s), Math.round(30 * s), 0xffffff, 0.08);
    }
  }

  // ── Health bar update ──
  _updateHealth() {
    if (!this.gameState) return;
    const redHP = this.gameState.redHealth ?? 100;
    const blueHP = this.gameState.blueHealth ?? 100;
    const hpW = this._healthBarW || Math.round(150 * (this._sceneScale || CONFIG.s(this)));

    // Update fill widths
    this.tweens.add({
      targets: this.redHealthFill,
      width: (redHP / 100) * hpW,
      duration: 300,
    });
    this.tweens.add({
      targets: this.blueHealthFill,
      width: (blueHP / 100) * hpW,
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
    const s = this._sceneScale || CONFIG.s(this);
    const startX =
      attackerTeam === "red" ? this.redCastleX + Math.round(100 * s) : this.blueCastleX - Math.round(100 * s);
    const endX = attackerTeam === "red" ? this.blueCastleX : this.redCastleX;
    const startY = H - Math.round(150 * s);
    const endY = H - Math.round(130 * s);

    const boulder = this.add
      .circle(startX, startY, Math.max(6, Math.round(12 * s)), 0x636e72)
      .setStrokeStyle(Math.max(1, Math.round(2 * s)), 0x444);
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
      y: { from: startY, to: startY - Math.round(200 * s) },
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
    const s2 = this._sceneScale || CONFIG.s(this);
    const dmg = this.add
      .text(x, y - Math.round(30 * s2), `-${this.gameState.damage || 12}`, {
        fontSize: CONFIG.fs(this, 28),
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: dmg,
      y: y - Math.round(80 * s2),
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
      this.currentQuestion = data.question;
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
    const s = CONFIG.s(this);
    const panelW = Math.min(Math.round(480 * s), W - 20);
    const panelH = Math.min(Math.round(220 * s), H - 20);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(500).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e, 0.97).setStrokeStyle(Math.max(1, Math.round(3 * s)), 0xffd700).setDepth(501);
    const shadow = this.add.rectangle(W / 2 + Math.round(6 * s), H / 2 + Math.round(8 * s), panelW, panelH, 0x000000, 0.3).setDepth(500);
    const icon = this.add.text(W / 2, H / 2 - Math.round(60 * s), "🚪", { fontSize: CONFIG.fs(this, 42) }).setOrigin(0.5).setDepth(502);
    const title = this.add.text(W / 2, H / 2 - Math.round(15 * s), "Opponent Left!", {
      fontSize: CONFIG.fs(this, 26), fontStyle: "bold", color: "#ffd700",
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(502);
    const msg = this.add.text(W / 2, H / 2 + Math.round(25 * s), message, {
      fontSize: CONFIG.fs(this, 14), color: "#ccc",
    }).setOrigin(0.5).setDepth(502);
    const okBtn = this.add.text(W / 2, H / 2 + Math.round(70 * s), "Back to Lobby", {
      fontSize: CONFIG.fs(this, 18), fontStyle: "bold", color: "#fff", backgroundColor: "#6c5ce7",
      padding: { x: Math.round(20 * s), y: Math.round(8 * s) }, stroke: "#000", strokeThickness: Math.max(1, Math.round(2 * s)),
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
