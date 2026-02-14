// ============================================================
// TitleScene — Animated opening splash screen
// Floating particles, glowing brain, orbiting mode icons,
// pulsing title text, and a fun "Enter Arena" button
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Deep space gradient background ──
    this._drawBackground(W, H);

    // ── Floating particle field (stars + sparks) ──
    this._createParticleField(W, H);

    // ── Animated grid lines (cyber / arena feel) ──
    this._drawGridLines(W, H);

    // ── Central glowing brain orb ──
    this._createBrainOrb(W, H);

    // ── Title text with staggered letter animation ──
    this._createAnimatedTitle(W, H);

    // ── Subtitle ──
    const subtitle = this.add
      .text(W / 2, H / 2 - 20, "⚔️ Quiz Battle Arena for Teams! ⚔️", {
        fontSize: "22px",
        fontFamily: "Arial, sans-serif",
        color: "#aaaacc",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: H / 2 - 10,
      duration: 1200,
      delay: 1800,
      ease: "Power2",
    });

    // ── Orbiting game mode icons ──
    this._createOrbitingIcons(W, H);

    // ── Animated features text ──
    this._createFeatureBadges(W, H);

    // ── "Enter Arena" button with glow pulse ──
    this._createEnterButton(W, H);

    // ── Floating emoji decorations ──
    this._createFloatingEmojis(W, H);

    // ── Bottom credit bar ──
    const credit = this.add
      .text(
        W / 2,
        H - 25,
        "🎮 Press ENTER or click to begin  |  Built by RunTime Terror",
        {
          fontSize: "13px",
          fontFamily: "Arial, sans-serif",
          color: "#555577",
        },
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: credit,
      alpha: 0.4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // ── Keyboard shortcut ──
    this.input.keyboard.on("keydown-ENTER", () => this._goToLobby());
    this.input.keyboard.on("keydown-SPACE", () => this._goToLobby());

    // ── Lightning flash on entry ──
    const flash = this.add
      .rectangle(W / 2, H / 2, W, H, 0xffffff, 0.6)
      .setDepth(200);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: "Power3",
      onComplete: () => flash.destroy(),
    });
  }

  // ── Background with layered gradients ──
  _drawBackground(W, H) {
    const bg = this.add.graphics();
    // Deep purple-blue gradient
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x24243e);
    bg.fillRect(0, 0, W, H);

    // Vignette corners
    const vig = this.add.graphics();
    vig.fillStyle(0x000000, 0.4);
    vig.fillCircle(0, 0, 300);
    vig.fillCircle(W, 0, 300);
    vig.fillCircle(0, H, 300);
    vig.fillCircle(W, H, 300);
    vig.setAlpha(0.3);

    // Subtle nebula blobs
    const nebulaColors = [0x6c5ce7, 0xe74c3c, 0x3498db, 0x2ecc71];
    for (let i = 0; i < 6; i++) {
      const nx = Phaser.Math.Between(100, W - 100);
      const ny = Phaser.Math.Between(80, H - 80);
      const nr = Phaser.Math.Between(80, 200);
      const color = nebulaColors[i % nebulaColors.length];
      const nebula = this.add.circle(nx, ny, nr, color, 0.04);
      this.tweens.add({
        targets: nebula,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.08,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ── Floating star particles ──
  _createParticleField(W, H) {
    // Twinkling stars
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = Math.random() * 2.5 + 0.5;
      const alpha = Math.random() * 0.7 + 0.3;
      const star = this.add.circle(x, y, size, 0xffffff, alpha);

      this.tweens.add({
        targets: star,
        alpha: alpha * 0.2,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Rising sparkles
    for (let i = 0; i < 20; i++) {
      const sparkX = Math.random() * W;
      const spark = this.add.circle(sparkX, H + 10, 3, 0xffd700, 0.6);

      this.tweens.add({
        targets: spark,
        y: -20,
        x: sparkX + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: 5000 + Math.random() * 5000,
        delay: Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          spark.x = Math.random() * W;
          spark.y = H + 10;
          spark.alpha = 0.6;
        },
      });
    }
  }

  // ── Cyber grid lines ──
  _drawGridLines(W, H) {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x6c5ce7, 0.06);

    // Horizontal
    for (let y = 0; y < H; y += 60) {
      grid.lineBetween(0, y, W, y);
    }
    // Vertical
    for (let x = 0; x < W; x += 60) {
      grid.lineBetween(x, 0, x, H);
    }

    // Scanning line effect
    const scanLine = this.add.rectangle(W / 2, -5, W, 2, 0x6c5ce7, 0.3);
    this.tweens.add({
      targets: scanLine,
      y: H + 5,
      duration: 4000,
      repeat: -1,
      ease: "Linear",
    });
  }

  // ── Big brain orb in center ──
  _createBrainOrb(W, H) {
    const cx = W / 2;
    const cy = H / 2 - 120;

    // Outer glow rings
    for (let r = 80; r >= 30; r -= 10) {
      const ring = this.add.circle(
        cx,
        cy,
        r,
        0x6c5ce7,
        0.03 + (80 - r) * 0.005,
      );
      this.tweens.add({
        targets: ring,
        scaleX: 1.15 + (80 - r) * 0.01,
        scaleY: 1.15 + (80 - r) * 0.01,
        alpha: 0.01,
        duration: 2000 + r * 20,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Core orb
    const orb = this.add.circle(cx, cy, 28, 0xffd700, 0.9);
    const orbGlow = this.add.circle(cx, cy, 35, 0xffd700, 0.2);

    this.tweens.add({
      targets: orb,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: orbGlow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Brain emoji
    const brain = this.add
      .text(cx, cy, "🧠", { fontSize: "52px" })
      .setOrigin(0.5);
    this.tweens.add({
      targets: brain,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: "Linear",
    });

    // Electric arcs around brain
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const arcDist = 55;
      const ax = cx + Math.cos(angle) * arcDist;
      const ay = cy + Math.sin(angle) * arcDist;
      const arc = this.add.circle(ax, ay, 2, 0x74b9ff, 0.8);

      this.tweens.add({
        targets: arc,
        x: cx + Math.cos(angle + Math.PI) * arcDist,
        y: cy + Math.sin(angle + Math.PI) * arcDist,
        alpha: 0,
        duration: 1200,
        delay: i * 200,
        repeat: -1,
        yoyo: true,
        ease: "Power2",
      });
    }
  }

  // ── Staggered letter animation for title ──
  _createAnimatedTitle(W, H) {
    const titleBase = "BATTLEBRAINS";
    const titleY = H / 2 - 55;
    const letterSpacing = 42;
    const startX =
      W / 2 - (titleBase.length * letterSpacing) / 2 + letterSpacing / 2;

    const colors = [
      "#ff6b6b",
      "#ffd700",
      "#ffd700",
      "#74b9ff",
      "#2ecc71",
      "#ffd700",
      "#ff6b6b",
      "#74b9ff",
      "#ffd700",
      "#2ecc71",
      "#ffd700",
      "#ff6b6b",
    ];

    this.titleLetters = [];
    titleBase.split("").forEach((char, i) => {
      const letter = this.add
        .text(startX + i * letterSpacing, titleY + 50, char, {
          fontSize: "56px",
          fontFamily: "Arial Rounded MT Bold, Arial Black, Impact, sans-serif",
          color: colors[i % colors.length],
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(0);

      this.tweens.add({
        targets: letter,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: titleY,
        duration: 500,
        delay: 300 + i * 80,
        ease: "Back.easeOut",
      });

      // Continuous subtle float
      this.tweens.add({
        targets: letter,
        y: titleY - 4,
        duration: 1200 + i * 100,
        delay: 1500 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.titleLetters.push(letter);
    });

    // Underline swoosh
    const lineY = titleY + 32;
    const swoosh = this.add.graphics();
    swoosh.setAlpha(0);

    this.time.delayedCall(1600, () => {
      swoosh.lineStyle(3, 0xffd700, 0.8);
      swoosh.lineBetween(
        startX - 20,
        lineY,
        startX + titleBase.length * letterSpacing - 20,
        lineY,
      );
      this.tweens.add({
        targets: swoosh,
        alpha: 1,
        duration: 600,
        ease: "Power2",
      });
    });
  }

  // ── 3 orbiting game-mode icons ──
  _createOrbitingIcons(W, H) {
    const cx = W / 2;
    const cy = H / 2 + 80;
    const radius = 160;
    const icons = [
      { emoji: "⚡", label: "Tug-of-War", color: "#ff6b6b" },
      { emoji: "🚀", label: "Rocket Rush", color: "#74b9ff" },
      { emoji: "🏰", label: "Catapult Clash", color: "#2ecc71" },
    ];

    icons.forEach((icon, i) => {
      const startAngle = (i / icons.length) * Math.PI * 2;
      const container = this.add.container(
        cx + Math.cos(startAngle) * radius,
        cy + Math.sin(startAngle) * radius * 0.4, // elliptical orbit
      );

      // Icon circle background
      const bg = this.add
        .circle(0, 0, 35, 0x1a1a3e, 0.9)
        .setStrokeStyle(
          2,
          Phaser.Display.Color.HexStringToColor(icon.color).color,
        );
      const emoji = this.add
        .text(0, -3, icon.emoji, { fontSize: "30px" })
        .setOrigin(0.5);
      const label = this.add
        .text(0, 28, icon.label, {
          fontSize: "12px",
          fontFamily: "Arial, sans-serif",
          color: icon.color,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      container.add([bg, emoji, label]);
      container.setAlpha(0);

      // Fade in
      this.tweens.add({
        targets: container,
        alpha: 1,
        duration: 600,
        delay: 2200 + i * 300,
        ease: "Power2",
      });

      // Orbit animation
      this.tweens.addCounter({
        from: startAngle * Phaser.Math.RAD_TO_DEG,
        to: startAngle * Phaser.Math.RAD_TO_DEG + 360,
        duration: 12000,
        repeat: -1,
        ease: "Linear",
        onUpdate: (tween) => {
          const angle = Phaser.Math.DegToRad(tween.getValue());
          container.x = cx + Math.cos(angle) * radius;
          container.y = cy + Math.sin(angle) * radius * 0.4;
          // Depth based on y for pseudo-3D
          container.setScale(0.8 + Math.sin(angle) * 0.2);
          container.setAlpha(0.6 + Math.sin(angle) * 0.4);
        },
      });
    });
  }

  // ── Feature badges with staggered pop-in ──
  _createFeatureBadges(W, H) {
    const badges = [
      { text: "🎯 Live Quiz Battles", x: 180, y: H - 120 },
      { text: "👥 Team vs Team", x: 460, y: H - 120 },
      { text: "⚡ Power-Ups", x: 700, y: H - 120 },
      { text: "🏆 3 Epic Modes", x: 970, y: H - 120 },
    ];

    badges.forEach((badge, i) => {
      const bg = this.add
        .rectangle(badge.x, badge.y, 200, 36, 0x1a1a3e, 0.8)
        .setStrokeStyle(1, 0x6c5ce7);

      const txt = this.add
        .text(badge.x, badge.y, badge.text, {
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          color: "#ccccee",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      bg.setAlpha(0).setScale(0.5);
      txt.setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: [bg, txt],
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        delay: 2800 + i * 200,
        ease: "Back.easeOut",
      });

      // Gentle hover
      this.tweens.add({
        targets: [bg, txt],
        y: badge.y - 3,
        duration: 2000 + i * 300,
        delay: 3500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  // ── Enter Arena button ──
  _createEnterButton(W, H) {
    const btnY = H / 2 + 165;

    // Glow behind button
    const glow = this.add.circle(W / 2, btnY, 100, 0x6c5ce7, 0.15);
    this.tweens.add({
      targets: glow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Button
    const btn = this.add
      .text(W / 2, btnY, "🎮  ENTER THE ARENA  🎮", {
        fontSize: "30px",
        fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#6c5ce7",
        padding: { x: 36, y: 16 },
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    // Pop in
    this.tweens.add({
      targets: btn,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 700,
      delay: 2500,
      ease: "Back.easeOut",
    });

    // Continuous pulse
    this.tweens.add({
      targets: btn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      delay: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Hover effects
    btn.on("pointerover", () => {
      btn.setStyle({ backgroundColor: "#a29bfe" });
      this.tweens.add({
        targets: btn,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 150,
      });
    });
    btn.on("pointerout", () => {
      btn.setStyle({ backgroundColor: "#6c5ce7" });
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 150 });
    });
    btn.on("pointerdown", () => this._goToLobby());
  }

  // ── Floating background emojis ──
  _createFloatingEmojis(W, H) {
    const emojis = [
      "🧠",
      "💡",
      "⚡",
      "🔥",
      "✨",
      "🎯",
      "🏆",
      "🚀",
      "🏰",
      "💥",
      "🎮",
      "📚",
    ];

    for (let i = 0; i < 14; i++) {
      const emoji = emojis[i % emojis.length];
      const x = Phaser.Math.Between(40, W - 40);
      const y = Phaser.Math.Between(40, H - 40);

      const txt = this.add
        .text(x, y, emoji, {
          fontSize: `${Phaser.Math.Between(16, 28)}px`,
        })
        .setOrigin(0.5)
        .setAlpha(0.08);

      this.tweens.add({
        targets: txt,
        y: y - Phaser.Math.Between(20, 60),
        x: x + Phaser.Math.Between(-30, 30),
        angle: Phaser.Math.Between(-20, 20),
        alpha: 0.15,
        duration: 4000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Math.random() * 3000,
      });
    }
  }

  // ── Transition to lobby ──
  _goToLobby() {
    // Prevent double-trigger
    if (this._transitioning) return;
    this._transitioning = true;

    // Flash + zoom out all title letters
    this.titleLetters?.forEach((letter, i) => {
      this.tweens.add({
        targets: letter,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        ease: "Power3",
      });
    });

    // White flash
    const W = this.scale.width;
    const H = this.scale.height;
    const flash = this.add
      .rectangle(W / 2, H / 2, W, H, 0xffffff, 0)
      .setDepth(200);
    this.tweens.add({
      targets: flash,
      alpha: 0.8,
      duration: 400,
      delay: 200,
      onComplete: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(350, () => {
          this.scene.start("LobbyScene");
        });
      },
    });
  }
}
