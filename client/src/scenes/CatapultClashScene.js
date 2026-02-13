// ============================================================
// CatapultClashScene — Two castles with health bars
// Correct answer → launch boulder at enemy castle
// First to destroy enemy castle wins!
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SocketManager } from '../network/SocketManager.js';
import { QuestionOverlay } from '../ui/QuestionOverlay.js';
import { HUD } from '../ui/HUD.js';
import { PowerUpBar } from '../ui/PowerUpBar.js';

export class CatapultClashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CatapultClashScene' });
  }

  init(data) {
    this.gameState = data.state || {};
    this.currentQuestion = data.question || null;
  }

  create() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

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
    this.redCastle = this._buildCastle(this.redCastleX, castleY, CONFIG.COLORS.RED, '🔴');
    
    // ── Blue Castle ──
    this.blueCastle = this._buildCastle(this.blueCastleX, castleY, CONFIG.COLORS.BLUE, '🔵');

    // ── Catapults ──
    this._drawCatapult(this.redCastleX + 100, H - 80, true);
    this._drawCatapult(this.blueCastleX - 100, H - 80, false);

    // ── Health Bars ──
    this.redHealthBg = this.add.rectangle(this.redCastleX, castleY - 90, 150, 18, 0x333333).setStrokeStyle(1, 0x666);
    this.redHealthFill = this.add.rectangle(this.redCastleX - 75, castleY - 90, 150, 14, CONFIG.COLORS.RED).setOrigin(0, 0.5);
    this.redHealthText = this.add.text(this.redCastleX, castleY - 90, '100 HP', {
      fontSize: '12px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.blueHealthBg = this.add.rectangle(this.blueCastleX, castleY - 90, 150, 18, 0x333333).setStrokeStyle(1, 0x666);
    this.blueHealthFill = this.add.rectangle(this.blueCastleX - 75, castleY - 90, 150, 14, CONFIG.COLORS.BLUE).setOrigin(0, 0.5);
    this.blueHealthText = this.add.text(this.blueCastleX, castleY - 90, '100 HP', {
      fontSize: '12px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── Team Labels ──
    this.add.text(this.redCastleX, 30, '🔴 RED CASTLE', {
      fontSize: '20px', color: '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(this.blueCastleX, 30, '🔵 BLUE CASTLE', {
      fontSize: '20px', color: '#74b9ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── Shot counters ──
    this.redShotsText = this.add.text(this.redCastleX, 55, 'Shots: 0', {
      fontSize: '14px', color: '#ff6b6b'
    }).setOrigin(0.5);
    this.blueShotsText = this.add.text(this.blueCastleX, 55, 'Shots: 0', {
      fontSize: '14px', color: '#74b9ff'
    }).setOrigin(0.5);

    // ── Timer ──
    this.timerText = this.add.text(W / 2, 25, '⏰ 15', {
      fontSize: '28px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── HUD + Power-ups ──
    this.hud = new HUD(this);
    this.powerUpBar = new PowerUpBar(this);

    // ── Question Overlay ──
    this.questionOverlay = new QuestionOverlay(this, (answerIndex) => {
      SocketManager.submitAnswer(answerIndex);
    });

    if (this.currentQuestion) {
      this.questionOverlay.showQuestion(this.currentQuestion);
    }

    // ── Impact particles ──
    this.impactParticles = this.add.particles(0, 0, 'particle-smoke', {
      speed: { min: 50, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      emitting: false
    });

    // ── Socket + keyboard ──
    this._setupListeners();
    this._setupKeyboard();
  }

  _buildCastle(x, y, color, emoji) {
    const container = this.add.container(x, y);

    // Main wall
    const wall = this.add.rectangle(0, 0, 100, 80, 0x7f8c8d).setStrokeStyle(2, 0x636e72);
    // Towers
    const tower1 = this.add.rectangle(-40, -30, 25, 50, 0x95a5a6).setStrokeStyle(1, 0x636e72);
    const tower2 = this.add.rectangle(40, -30, 25, 50, 0x95a5a6).setStrokeStyle(1, 0x636e72);
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
    const label = this.add.text(0, -90, emoji, { fontSize: '28px' }).setOrigin(0.5);

    container.add([wall, tower1, tower2, gate, gateArch, flagPole, flag, label]);
    return container;
  }

  _drawCatapult(x, y, faceRight) {
    const dir = faceRight ? 1 : -1;
    // Base
    this.add.rectangle(x, y, 40, 15, 0x8B6914);
    // Arm
    this.add.line(0, 0, x, y - 5, x + dir * 35, y - 30, 0xc0915e, 1).setLineWidth(4);
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
    this.tweens.add({ targets: this.redHealthFill, width: (redHP / 100) * 150, duration: 300 });
    this.tweens.add({ targets: this.blueHealthFill, width: (blueHP / 100) * 150, duration: 300 });

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
    const W = CONFIG.WIDTH;
    const startX = attackerTeam === 'red' ? this.redCastleX + 130 : this.blueCastleX - 130;
    const endX = attackerTeam === 'red' ? this.blueCastleX : this.redCastleX;
    const startY = CONFIG.HEIGHT - 150;
    const endY = CONFIG.HEIGHT - 130;

    const boulder = this.add.circle(startX, startY, 12, 0x636e72).setStrokeStyle(2, 0x444);
    const trail = this.add.particles(startX, startY, 'particle-smoke', {
      follow: boulder,
      speed: 30,
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      frequency: 40,
      quantity: 1
    });

    // Parabolic arc
    this.tweens.add({
      targets: boulder,
      x: endX,
      duration: 800,
      ease: 'Linear'
    });
    this.tweens.add({
      targets: boulder,
      y: { from: startY, to: startY - 200 },
      duration: 400,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        // Impact!
        trail.destroy();
        boulder.destroy();
        this._showImpact(endX, endY, attackerTeam);
      }
    });
  }

  _showImpact(x, y, attackerTeam) {
    // Particles
    this.impactParticles.setPosition(x, y);
    this.impactParticles.explode(25);

    // Shake target castle
    const target = attackerTeam === 'red' ? this.blueCastle : this.redCastle;
    this.tweens.add({
      targets: target,
      x: target.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 5
    });

    this.cameras.main.shake(200, 0.008);

    // Damage number
    const dmg = this.add.text(x, y - 30, `-${this.gameState.damage || 12}`, {
      fontSize: '32px', color: '#ff0000', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: dmg,
      y: y - 80,
      alpha: 0,
      duration: 800,
      onComplete: () => dmg.destroy()
    });
  }

  // ── Socket Listeners ──
  _setupListeners() {
    SocketManager.on('state-update', (data) => {
      this.gameState = data.state;
      this._updateHealth();
      if (data.lastAction && data.lastAction.type === 'hit') {
        this._launchBoulder(data.team);
      }
    });

    SocketManager.on('answer-result', (data) => {
      this.questionOverlay.showResult(data.correct);
      if (data.correct) {
        this.hud.showFloatingText(`+${data.pointsEarned} 💥`, CONFIG.COLORS.GREEN);
      }
    });

    SocketManager.on('new-question', (data) => {
      this.gameState = data.state;
      this._updateHealth();
      this.questionOverlay.showQuestion(data.question);
    });

    SocketManager.on('timer-tick', (data) => {
      this.timerText.setText(`⏰ ${data.timeLeft}`);
      if (data.timeLeft <= 5) this.timerText.setColor('#ff0000');
    });

    SocketManager.on('round-over', () => {
      this.timerText.setText('⏰ --').setColor('#ffd700');
    });

    SocketManager.on('powerup-activated', (data) => {
      this.hud.showPowerUpNotification(data.type, data.team, data.effect.description);
      this.gameState = data.state;
      this._updateHealth();
    });

    SocketManager.on('game-over', (data) => {
      this._cleanupListeners();
      this.scene.start('WinScene', {
        winner: data.winner,
        state: data.state,
        mode: 'catapult-clash'
      });
    });
  }

  _cleanupListeners() {
    ['state-update', 'answer-result', 'new-question', 'timer-tick', 'round-over', 'powerup-activated', 'game-over']
      .forEach(e => SocketManager.off(e));
  }

  _setupKeyboard() {
    const redKeys = CONFIG.KEYS.RED.ANSWER;
    const blueKeys = CONFIG.KEYS.BLUE.ANSWER;

    this.input.keyboard.on('keydown', (event) => {
      const key = event.key.toUpperCase();
      const redIdx = redKeys.indexOf(key);
      if (redIdx !== -1) {
        SocketManager.submitAnswer(redIdx);
        this.questionOverlay.highlightOption(redIdx, 'red');
      }
      const blueIdx = blueKeys.indexOf(key);
      if (blueIdx !== -1) {
        SocketManager.submitAnswer(blueIdx);
        this.questionOverlay.highlightOption(blueIdx, 'blue');
      }
      if (key === CONFIG.KEYS.RED.POWERUP) this.powerUpBar.useNext('red');
      if (key === CONFIG.KEYS.BLUE.POWERUP) this.powerUpBar.useNext('blue');
    });
  }

  update() {}
}
