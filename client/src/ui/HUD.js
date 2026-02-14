// ============================================================
// HUD — Heads-Up Display (floating text, notifications)
// Shared across all game modes
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.notifContainer = scene.add
      .container(scene.scale.width / 2, 120)
      .setDepth(200);
  }

  // Show floating score text (e.g., "+10")
  showFloatingText(text, color = CONFIG.COLORS.GREEN) {
    const hex = "#" + color.toString(16).padStart(6, "0");
    const floater = this.scene.add
      .text(
        this.scene.scale.width / 2 + Phaser.Math.Between(-100, 100),
        this.scene.scale.height / 2,
        text,
        {
          fontSize: "32px",
          color: hex,
          fontStyle: "bold",
          stroke: "#000",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setDepth(200);

    this.scene.tweens.add({
      targets: floater,
      y: floater.y - 80,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => floater.destroy(),
    });
  }

  // Show power-up notification banner
  showPowerUpNotification(type, team, description) {
    const icons = { double: "⚡", freeze: "❄️", shield: "🛡️" };
    const icon = icons[type] || "✨";
    const color = team === "red" ? "#ff6b6b" : "#74b9ff";

    const bg = this.scene.add
      .rectangle(0, 0, 500, 50, 0x111122, 0.9)
      .setStrokeStyle(
        2,
        team === "red" ? CONFIG.COLORS.RED : CONFIG.COLORS.BLUE,
      );
    const txt = this.scene.add
      .text(0, 0, `${icon} ${description}`, {
        fontSize: "22px",
        color: color,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.notifContainer.add([bg, txt]);
    this.notifContainer.setAlpha(1);

    this.scene.tweens.add({
      targets: this.notifContainer,
      alpha: 0,
      duration: 3000,
      delay: 1000,
      onComplete: () => {
        bg.destroy();
        txt.destroy();
      },
    });
  }
}
