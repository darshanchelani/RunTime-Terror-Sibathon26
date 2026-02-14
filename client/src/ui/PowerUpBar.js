// ============================================================
// PowerUpBar — Shows available power-ups for each team
// Touch-tap or keyboard to activate
// ============================================================

import { CONFIG } from '../config.js';
import { SocketManager } from '../network/SocketManager.js';

export class PowerUpBar {
  constructor(scene) {
    this.scene = scene;
    this.powerUps = ['double', 'freeze', 'shield'];
    this._build();
  }

  _build() {
    const W = this.scene.scale.width;
    const icons = { double: '⚡ 2x', freeze: '❄️ Ice', shield: '🛡️ Def' };
    const colors = { double: 0xf39c12, freeze: 0x00cec9, shield: 0x6c5ce7 };

    // Red team power-ups (left side)
    this.redButtons = [];
    this.powerUps.forEach((type, i) => {
      const x = 30 + i * 60;
      const y = this.scene.scale.height / 2 - 50;
      
      const bg = this.scene.add.rectangle(x, y, 52, 52, colors[type], 0.8)
        .setStrokeStyle(2, 0xff6b6b)
        .setInteractive({ useHandCursor: true })
        .setDepth(90);
      
      const label = this.scene.add.text(x, y, icons[type], {
        fontSize: '12px', color: '#fff', align: 'center'
      }).setOrigin(0.5).setDepth(91);

      const keyHint = this.scene.add.text(x, y + 32, `[${CONFIG.KEYS.RED.POWERUP}]`, {
        fontSize: '10px', color: '#ff6b6b'
      }).setOrigin(0.5).setDepth(91);

      bg.on('pointerdown', () => {
        SocketManager.usePowerUp(type);
        bg.setAlpha(0.3);
      });

      this.redButtons.push({ bg, label, type });
    });

    // Blue team power-ups (right side)
    this.blueButtons = [];
    this.powerUps.forEach((type, i) => {
      const x = W - 30 - i * 60;
      const y = this.scene.scale.height / 2 - 50;
      
      const bg = this.scene.add.rectangle(x, y, 52, 52, colors[type], 0.8)
        .setStrokeStyle(2, 0x74b9ff)
        .setInteractive({ useHandCursor: true })
        .setDepth(90);
      
      const label = this.scene.add.text(x, y, icons[type], {
        fontSize: '12px', color: '#fff', align: 'center'
      }).setOrigin(0.5).setDepth(91);

      const keyHint = this.scene.add.text(x, y + 32, `[${CONFIG.KEYS.BLUE.POWERUP}]`, {
        fontSize: '10px', color: '#74b9ff'
      }).setOrigin(0.5).setDepth(91);

      bg.on('pointerdown', () => {
        SocketManager.usePowerUp(type);
        bg.setAlpha(0.3);
      });

      this.blueButtons.push({ bg, label, type });
    });
  }

  useNext(team) {
    const buttons = team === 'red' ? this.redButtons : this.blueButtons;
    const available = buttons.find(b => b.bg.alpha > 0.5);
    if (available) {
      SocketManager.usePowerUp(available.type);
      available.bg.setAlpha(0.3);
    }
  }
}
