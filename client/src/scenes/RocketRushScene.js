// ============================================================
// RocketRushScene — Two rockets racing to the top
// Correct answer → rocket thrust/boost
// First to reach the finish line (stars) wins!
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SocketManager } from '../network/SocketManager.js';
import { QuestionOverlay } from '../ui/QuestionOverlay.js';
import { HUD } from '../ui/HUD.js';
import { PowerUpBar } from '../ui/PowerUpBar.js';

export class RocketRushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RocketRushScene' });
  }

  init(data) {
    this.gameState = data.state || {};
    this.currentQuestion = data.question || null;
  }

  create() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    this.cameras.main.setBackgroundColor(0x0a0a2e);

    // ── Starfield background ──
    this._drawStarfield(W, H);

    // ── Finish line at top ──
    this.add.rectangle(W / 2, 50, W, 4, CONFIG.COLORS.GOLD);
    this.add.text(W / 2, 25, '🏁 FINISH LINE 🏁', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── Launch pad at bottom ──
    this.add.rectangle(W / 2, H - 30, W, 60, 0x2d3436);
    this.add.text(W / 4, H - 30, '🔴 RED PAD', { fontSize: '14px', color: '#ff6b6b' }).setOrigin(0.5);
    this.add.text(3 * W / 4, H - 30, '🔵 BLUE PAD', { fontSize: '14px', color: '#74b9ff' }).setOrigin(0.5);

    // ── Track lanes ──
    const laneRedX = W / 4;
    const laneBlueX = 3 * W / 4;
    
    // Lane divider
    this.add.line(0, 0, W / 2, 60, W / 2, H - 60, 0xffffff, 0.15).setOrigin(0);

    // ── Altitude markers ──
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = this._altitudeToY(pct);
      this.add.line(0, 0, 20, y, W - 20, y, 0xffffff, 0.1).setOrigin(0);
      this.add.text(10, y - 10, `${pct}%`, { fontSize: '12px', color: '#666' });
    }

    // ── Rockets ──
    this.trackTop = 70;
    this.trackBottom = H - 70;

    this.redRocket = this._createRocket(laneRedX, this.trackBottom, CONFIG.COLORS.RED, '🔴');
    this.blueRocket = this._createRocket(laneBlueX, this.trackBottom, CONFIG.COLORS.BLUE, '🔵');

    // ── Exhaust particles ──
    this.redExhaust = this.add.particles(laneRedX, this.trackBottom + 30, 'particle-fire', {
      speed: { min: 50, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      frequency: 50,
      blendMode: 'ADD',
      tint: [0xff4444, 0xff8800, 0xffff00]
    });

    this.blueExhaust = this.add.particles(laneBlueX, this.trackBottom + 30, 'particle-fire', {
      speed: { min: 50, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      frequency: 50,
      blendMode: 'ADD',
      tint: [0x4444ff, 0x0088ff, 0x00ffff]
    });

    // ── Altitude text ──
    this.redAltText = this.add.text(laneRedX, H - 10, 'Alt: 0%', {
      fontSize: '16px', color: '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.blueAltText = this.add.text(laneBlueX, H - 10, 'Alt: 0%', {
      fontSize: '16px', color: '#74b9ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── Timer ──
    this.timerText = this.add.text(W / 2, 80, '⏰ 15', {
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

    // ── Boost particles ──
    this.boostParticles = this.add.particles(0, 0, 'particle-star', {
      speed: { min: 100, max: 300 },
      scale: { start: 1.2, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false
    });

    // ── Socket + keyboard ──
    this._setupListeners();
    this._setupKeyboard();
  }

  _createRocket(x, y, color, emoji) {
    const container = this.add.container(x, y);
    
    // Rocket body
    const body = this.add.rectangle(0, 0, 30, 50, color).setStrokeStyle(2, 0xffffff);
    const nose = this.add.triangle(0, -35, -15, 0, 15, 0, 0, -20, color);
    const fin1 = this.add.triangle(-18, 20, 0, -10, 0, 10, -12, 10, color);
    const fin2 = this.add.triangle(18, 20, 0, -10, 0, 10, 12, 10, color);
    const window = this.add.circle(0, -8, 8, 0x74b9ff);
    const label = this.add.text(0, -60, emoji, { fontSize: '24px' }).setOrigin(0.5);

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
        repeat: -1
      });
    }
  }

  _altitudeToY(altitude) {
    // 0% = trackBottom, 100% = trackTop
    return this.trackBottom - (altitude / 100) * (this.trackBottom - this.trackTop);
  }

  // ── Socket Listeners ──
  _setupListeners() {
    SocketManager.on('state-update', (data) => {
      this.gameState = data.state;
      this._updateRockets();
      if (data.lastAction && data.lastAction.type === 'boost') {
        this._showBoostEffect(data.team);
      }
    });

    SocketManager.on('answer-result', (data) => {
      this.questionOverlay.showResult(data.correct);
      if (data.correct) {
        this.hud.showFloatingText(`+${data.pointsEarned} 🚀`, CONFIG.COLORS.GREEN);
      }
    });

    SocketManager.on('new-question', (data) => {
      this.gameState = data.state;
      this._updateRockets();
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
      this._updateRockets();
    });

    SocketManager.on('game-over', (data) => {
      this._cleanupListeners();
      this.scene.start('WinScene', {
        winner: data.winner,
        state: data.state,
        mode: 'rocket-rush'
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

  // ── Update rockets based on server state ──
  _updateRockets() {
    if (!this.gameState) return;

    const redAlt = this.gameState.redAltitude || 0;
    const blueAlt = this.gameState.blueAltitude || 0;

    // Animate rockets
    const redY = this._altitudeToY(redAlt);
    const blueY = this._altitudeToY(blueAlt);

    this.tweens.add({ targets: this.redRocket, y: redY, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.blueRocket, y: blueY, duration: 300, ease: 'Back.easeOut' });

    // Move exhaust
    this.redExhaust.setPosition(this.redRocket.x, redY + 35);
    this.blueExhaust.setPosition(this.blueRocket.x, blueY + 35);

    // Update text
    this.redAltText.setText(`Alt: ${Math.round(redAlt)}%`);
    this.blueAltText.setText(`Alt: ${Math.round(blueAlt)}%`);
  }

  _showBoostEffect(team) {
    const rocket = team === 'red' ? this.redRocket : this.blueRocket;
    this.boostParticles.setPosition(rocket.x, rocket.y);
    this.boostParticles.explode(20);

    // Brief scale pop
    this.tweens.add({
      targets: rocket,
      scaleX: 1.3, scaleY: 1.3,
      duration: 150,
      yoyo: true
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
