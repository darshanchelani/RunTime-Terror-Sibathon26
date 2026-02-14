// ============================================================
// TugOfWarScene — Rope physics, question overlay, pull logic
// Correct answer → pull rope toward your team
// First team to drag opponent into the mud wins!
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";
import { QuestionOverlay } from "../ui/QuestionOverlay.js";
import { HUD } from "../ui/HUD.js";
import { PowerUpBar } from "../ui/PowerUpBar.js";

export class TugOfWarScene extends Phaser.Scene {
  constructor() {
    super({ key: "TugOfWarScene" });
  }

  init(data) {
    this.gameState = data.state || {};
    this.currentQuestion = data.question || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = CONFIG.s(this);

    this.cameras.main.setBackgroundColor(0x1a3a2a);

    // ── Sky gradient background ──
    this._drawBackground(W, H, s);

    // ── Ground / grass ──
    this.add.rectangle(W / 2, H - Math.round(40 * s), W, Math.round(80 * s), 0x2ecc71);
    this.add.rectangle(W / 2, H - Math.round(5 * s), W, Math.round(10 * s), 0x27ae60);

    // ── Mud pit (center) ──
    this.mudPit = this.add.ellipse(
      W / 2,
      H - Math.round(100 * s),
      Math.round(200 * s),
      Math.round(50 * s),
      CONFIG.COLORS.MUD,
      0.8,
    );
    this.add
      .text(W / 2, H - Math.round(100 * s), "💩 MUD", { fontSize: CONFIG.fs(this, 14), color: "#fff" })
      .setOrigin(0.5);

    // ── Center line ──
    this.add.line(0, 0, W / 2, 0, W / 2, H, 0xffffff, 0.3).setOrigin(0);

    // ── Rope system ──
    this.ropeSegments = [];
    this.ropeY = H - Math.round(140 * s);
    const segCount = 20;
    this._segWidth = Math.max(8, Math.round(35 * s));
    const segWidth = this._segWidth;
    const totalWidth = segCount * segWidth;
    const startX = (W - totalWidth) / 2;

    for (let i = 0; i < segCount; i++) {
      const x = startX + i * segWidth;
      const color =
        i < segCount / 2 ? CONFIG.COLORS.RED_LIGHT : CONFIG.COLORS.BLUE_LIGHT;
      const seg = this.add
        .rectangle(x, this.ropeY, segWidth - 2, Math.max(6, Math.round(14 * s)), 0xc0915e)
        .setStrokeStyle(Math.max(1, Math.round(2 * s)), 0x8b6914);
      this.ropeSegments.push(seg);
    }

    // ── Rope knot (center marker) ──
    this.ropeKnot = this.add
      .circle(W / 2, this.ropeY, Math.max(8, Math.round(16 * s)), CONFIG.COLORS.GOLD)
      .setStrokeStyle(Math.max(1, Math.round(3 * s)), 0xe67e22);
    this.knotLabel = this.add
      .text(W / 2, this.ropeY - Math.round(30 * s), "⚡", { fontSize: CONFIG.fs(this, 24) })
      .setOrigin(0.5);

    // ── Team characters (stick figures) ──
    this.redTeamX = Math.round(W * 0.08);
    this.blueTeamX = W - Math.round(W * 0.08);

    this.redTeamGroup = this.add.container(this.redTeamX, this.ropeY);
    this.blueTeamGroup = this.add.container(this.blueTeamX, this.ropeY);

    this._drawTeamCharacter(this.redTeamGroup, CONFIG.COLORS.RED, true, s);
    this._drawTeamCharacter(this.blueTeamGroup, CONFIG.COLORS.BLUE, false, s);

    // ── Team labels ──
    this.add.text(Math.round(16 * s), Math.round(20 * s), "🔴 RED TEAM", {
      fontSize: CONFIG.fs(this, 20),
      color: "#ff6b6b",
      fontStyle: "bold",
    });
    this.add.text(W - Math.round(16 * s), Math.round(20 * s), "🔵 BLUE TEAM", {
      fontSize: CONFIG.fs(this, 20),
      color: "#74b9ff",
      fontStyle: "bold",
    }).setOrigin(1, 0);

    // ── Rope position indicator ──
    this.posText = this.add
      .text(W / 2, Math.round(55 * s), "PULL!", {
        fontSize: CONFIG.fs(this, 20),
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Score display ──
    this.redScoreText = this.add.text(Math.round(16 * s), Math.round(50 * s), "Pulls: 0", {
      fontSize: CONFIG.fs(this, 16),
      color: "#ff6b6b",
    });
    this.blueScoreText = this.add.text(W - Math.round(16 * s), Math.round(50 * s), "Pulls: 0", {
      fontSize: CONFIG.fs(this, 16),
      color: "#74b9ff",
    }).setOrigin(1, 0);

    // ── Timer ──
    this.timerText = this.add
      .text(W / 2, Math.round(20 * s), "⏰ 100", {
        fontSize: CONFIG.fs(this, 26),
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── HUD ──
    this.hud = new HUD(this);

    // ── Power-Up Bar ──
    this.powerUpBar = new PowerUpBar(this);

    // ── Question Overlay (bottom center) ──
    this.questionOverlay = new QuestionOverlay(this, (answerIndex) => {
      SocketManager.submitAnswer(answerIndex, SocketManager.team);
    });

    if (this.currentQuestion) {
      this.questionOverlay.showQuestion(this.currentQuestion);
    }

    // ── Particle emitter for pull effects ──
    this.pullParticles = this.add.particles(0, 0, "particle-star", {
      speed: { min: 100, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: "ADD",
      emitting: false,
    });

    // ── Quit Game button (top-right corner) ──
    this._createQuitButton(W, s);

    // ── Socket listeners ──
    this._setupListeners();

    // ── Keyboard input for single-device mode ──
    this._setupKeyboard();

    // ── Handle window resize / orientation change ──
    this.scale.on('resize', this._handleResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this._handleResize, this));
  }

  _handleResize() {
    if (this._resizeDebounce) clearTimeout(this._resizeDebounce);
    this._resizeDebounce = setTimeout(() => {
      if (this.scene.isActive('TugOfWarScene')) {
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

    // Dim background
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(400).setInteractive();
    // Panel
    const panel = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e, 0.97).setStrokeStyle(Math.max(1, Math.round(3 * s)), 0xe74c3c).setDepth(401);
    const shadow = this.add.rectangle(W / 2 + Math.round(6 * s), H / 2 + Math.round(8 * s), panelW, panelH, 0x000000, 0.3).setDepth(400);
    const title = this.add.text(W / 2, H / 2 - Math.round(55 * s), "⚠️  Quit Game?", {
      fontSize: CONFIG.fs(this, 26), fontStyle: "bold", color: "#ffd700",
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(402);
    const msg = this.add.text(W / 2, H / 2 - Math.round(10 * s), "You will leave the current match.", {
      fontSize: CONFIG.fs(this, 14), color: "#ccc",
    }).setOrigin(0.5).setDepth(402);

    // Yes button
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

    // Cancel button
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

  // ── Background ──
  _drawBackground(W, H, s) {
    s = s || CONFIG.s(this);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a3a2a, 0x1a3a2a, 0x0a2a1a, 0x0a2a1a);
    bg.fillRect(0, 0, W, H);

    // Trees / decorations
    const treeCount = Math.max(3, Math.min(8, Math.floor(W / 160)));
    const treeSpacing = W / (treeCount + 1);
    for (let i = 0; i < treeCount; i++) {
      const tx = treeSpacing * (i + 1);
      this.add.circle(
        tx,
        H - Math.round(120 * s),
        Math.round((25 + Math.random() * 15) * s),
        0x228b22,
        0.5,
      );
    }
  }

  // ── Team character (simple) ──
  _drawTeamCharacter(container, color, faceRight, s) {
    s = s || CONFIG.s(this);
    const dir = faceRight ? 1 : -1;
    // Body
    container.add(this.add.circle(0, Math.round(-20 * s), Math.round(15 * s), color));
    container.add(this.add.rectangle(0, Math.round(10 * s), Math.round(10 * s), Math.round(30 * s), color));
    // Arms pulling rope
    container.add(
      this.add.line(0, 0, 0, 0, dir * Math.round(30 * s), Math.round(-5 * s), color, 1).setLineWidth(Math.max(1, Math.round(3 * s))),
    );
    container.add(
      this.add.line(0, 0, 0, Math.round(10 * s), dir * Math.round(30 * s), Math.round(5 * s), color, 1).setLineWidth(Math.max(1, Math.round(3 * s))),
    );
    // Legs
    container.add(
      this.add.line(0, 0, 0, Math.round(25 * s), Math.round(-10 * s), Math.round(45 * s), color, 1).setLineWidth(Math.max(1, Math.round(3 * s))),
    );
    container.add(this.add.line(0, 0, 0, Math.round(25 * s), Math.round(10 * s), Math.round(45 * s), color, 1).setLineWidth(Math.max(1, Math.round(3 * s))));
  }

  // ── Socket Listeners ──
  _setupListeners() {
    SocketManager.on("state-update", (data) => {
      this.gameState = data.state;
      this._updateRope();
      if (data.lastAction && data.lastAction.type === "pull") {
        this._showPullEffect(data.team);
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
        this.hud.showFloatingText(`${teamLabel} +${data.pointsEarned}`, color);
      }
    });

    SocketManager.on("answer-rejected", (data) => {
      const msg = data?.reason || "Already answered!";
      this.hud.showFloatingText(msg, CONFIG.COLORS.GRAY);
    });

    SocketManager.on("new-question", (data) => {
      this.gameState = data.state;
      this.currentQuestion = data.question;
      this._updateRope();
      this.questionOverlay.showQuestion(data.question);
      // Reset per-team answered tracking for next round
      if (this.teamAnswered) this.teamAnswered = { red: false, blue: false };
    });

    SocketManager.on("timer-tick", (data) => {
      this.timerText.setText(`⏰ ${data.timeLeft}`);
      if (data.timeLeft <= 10) {
        this.timerText.setColor("#ff0000");
        this.tweens.add({
          targets: this.timerText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          yoyo: true,
        });
      } else {
        this.timerText.setColor("#ffd700");
      }
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
      if (data.type === "freeze") {
        this._showFreezeEffect(data.effect.target);
      }
      this.gameState = data.state;
      this._updateRope();
    });

    SocketManager.on("game-over", (data) => {
      this._cleanupListeners();
      this.scene.start("WinScene", {
        winner: data.winner,
        state: data.state,
        mode: "tug-of-war",
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

    // Auto-redirect after 5s
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

  // ── Keyboard (single device + multi-device multiplayer) ──
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

      // Red team answers via QWER (single-device mode)
      const redIdx = redKeys.indexOf(key);
      if (redIdx !== -1 && !this.teamAnswered.red) {
        this.teamAnswered.red = true;
        SocketManager.submitAnswer(redIdx, "red");
        this.questionOverlay.highlightOption(redIdx, "red");
      }

      // Blue team answers via UIOP (single-device mode)
      const blueIdx = blueKeys.indexOf(key);
      if (blueIdx !== -1 && !this.teamAnswered.blue) {
        this.teamAnswered.blue = true;
        SocketManager.submitAnswer(blueIdx, "blue");
        this.questionOverlay.highlightOption(blueIdx, "blue");
      }

      // Power-ups
      if (key === CONFIG.KEYS.RED.POWERUP) {
        this.powerUpBar.useNext("red");
      }
      if (key === CONFIG.KEYS.BLUE.POWERUP) {
        this.powerUpBar.useNext("blue");
      }
    });
  }

  // ── Update rope visual based on server state ──
  _updateRope() {
    if (!this.gameState) return;
    const pos = this.gameState.ropePosition || 0;
    const s = CONFIG.s(this);
    const maxShift = Math.round(300 * s); // max pixel shift — proportional
    const normalizedPos = (pos / this.gameState.mudThreshold) * maxShift;

    // Move knot
    this.ropeKnot.x = this.scale.width / 2 + normalizedPos;
    this.knotLabel.x = this.ropeKnot.x;

    // Shift rope segments
    const segCount = this.ropeSegments.length;
    const segWidth = this._segWidth || Math.max(8, Math.round(35 * s));
    const totalWidth = segCount * segWidth;
    const startX = (this.scale.width - totalWidth) / 2 + normalizedPos;

    this.ropeSegments.forEach((seg, i) => {
      seg.x = startX + i * segWidth;
    });

    // Update position text
    const pct = Math.abs(Math.round((pos / this.gameState.mudThreshold) * 100));
    if (pos < -10)
      this.posText.setText(`← RED pulling! ${pct}%`).setColor("#ff6b6b");
    else if (pos > 10)
      this.posText.setText(`BLUE pulling! ${pct}% →`).setColor("#74b9ff");
    else this.posText.setText("⚡ TIED!").setColor("#ffd700");

    // Update pull counts
    this.redScoreText.setText(`Pulls: ${this.gameState.redPulls || 0}`);
    this.blueScoreText.setText(`Pulls: ${this.gameState.bluePulls || 0}`);
  }

  // ── Visual Effects ──
  _showPullEffect(team) {
    const W = this.scale.width;
    const H = this.scale.height;
    const x = team === "red" ? W / 2 - 100 : W / 2 + 100;

    this.pullParticles.setPosition(x, this.ropeY);
    this.pullParticles.explode(15);

    // Shake camera slightly
    this.cameras.main.shake(150, 0.005);

    // Flash team side
    const flash = this.add.rectangle(
      team === "red" ? W / 4 : (3 * W) / 4,
      H / 2,
      W / 2,
      H,
      team === "red" ? CONFIG.COLORS.RED : CONFIG.COLORS.BLUE,
      0.15,
    );
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  _showFreezeEffect(team) {
    const W = this.scale.width;
    const H = this.scale.height;
    const x = team === "red" ? W / 4 : (3 * W) / 4;
    const freeze = this.add.rectangle(x, H / 2, W / 2, H, 0x00cec9, 0.3);
    const txt = this.add
      .text(x, H / 2, "❄️ FROZEN!", {
        fontSize: CONFIG.fs(this, 42),
        color: "#00cec9",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [freeze, txt],
      alpha: 0,
      duration: 4500,
      delay: 500,
      onComplete: () => {
        freeze.destroy();
        txt.destroy();
      },
    });
  }

  update() {
    // Smooth rope animation could go here
  }
}
