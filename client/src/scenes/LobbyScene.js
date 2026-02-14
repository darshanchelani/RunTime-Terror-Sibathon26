// ============================================================
// LobbyScene — Fancy animated lobby with game mode cards,
// room creation/joining, team select, and polished UI
// Touch + Keyboard friendly for classroom use
// ============================================================

import Phaser from "phaser";
import { CONFIG } from "../config.js";
import { SocketManager } from "../network/SocketManager.js";

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── State ──
    this.selectedMode = "tug-of-war";
    this.playerName = "Player" + Math.floor(Math.random() * 999);
    this.roomInput = "";
    this.inRoom = false;

    // ── Animated Background ──
    this._drawBackground(W, H);
    this._createParticles(W, H);

    // ── Header Section ──
    this._createHeader(W);

    // ── Game Mode Cards ──
    this._createModeCards(W);

    // ── Player Setup Section ──
    this._createPlayerSection(W);

    // ── Room Action Buttons ──
    this._createRoomActions(W);

    // ── Waiting Room Panel (hidden initially) ──
    this._createWaitingPanel(W, H);

    // ── Keyboard input for room code ──
    this._setupKeyboard();

    // ── Socket Listeners ──
    this._setupSocketListeners();

    // ── Footer ──
    this._createFooter(W, H);

    // ── Back button ──
    this._createBackButton();

    // ── Entry animation — fade in from black ──
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════
  //  BACKGROUND & PARTICLES
  // ═══════════════════════════════════════════════════════════

  _drawBackground(W, H) {
    // Deep gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2e, 0x0f0c29, 0x1a1040, 0x0a0a2e);
    bg.fillRect(0, 0, W, H);

    // Subtle grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x6c5ce7, 0.04);
    for (let y = 0; y < H; y += 50) grid.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 50) grid.lineBetween(x, 0, x, H);

    // Ambient glow orbs
    const glowColors = [0x6c5ce7, 0xe74c3c, 0x3498db, 0x2ecc71, 0xffd700];
    for (let i = 0; i < 5; i++) {
      const gx = Phaser.Math.Between(100, W - 100);
      const gy = Phaser.Math.Between(60, H - 60);
      const gr = Phaser.Math.Between(100, 220);
      const glow = this.add.circle(gx, gy, gr, glowColors[i], 0.03);
      this.tweens.add({
        targets: glow,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.06,
        duration: 4000 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  _createParticles(W, H) {
    // Floating stars
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const star = this.add.circle(
        sx,
        sy,
        Math.random() * 2 + 0.5,
        0xffffff,
        Math.random() * 0.5 + 0.2,
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
    // Rising sparks
    for (let i = 0; i < 10; i++) {
      const spark = this.add.circle(
        Math.random() * W,
        H + 10,
        2,
        0xffd700,
        0.5,
      );
      this.tweens.add({
        targets: spark,
        y: -20,
        x: spark.x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        duration: 6000 + Math.random() * 4000,
        delay: Math.random() * 3000,
        repeat: -1,
        onRepeat: () => {
          spark.x = Math.random() * W;
          spark.y = H + 10;
          spark.alpha = 0.5;
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  HEADER
  // ═══════════════════════════════════════════════════════════

  _createHeader(W) {
    // Glowing line under header
    const headerLine = this.add.rectangle(W / 2, 100, 600, 2, 0xffd700, 0.5);
    this.tweens.add({
      targets: headerLine,
      scaleX: 1.1,
      alpha: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Title with glow
    const titleGlow = this.add
      .text(W / 2, 42, "🧠 BattleBrains", {
        fontSize: "44px",
        fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
        color: "#ffd700",
        stroke: "#ffa500",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0.3);

    const title = this.add
      .text(W / 2, 40, "🧠 BattleBrains", {
        fontSize: "44px",
        fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
        color: "#ffd700",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Pulse glow
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.1,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle slide in
    const subtitle = this.add
      .text(W / 2, 75, "Choose Your Battle Arena", {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#aabbdd",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: 72,
      duration: 800,
      delay: 300,
      ease: "Power2",
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  GAME MODE CARDS (the main attraction!)
  // ═══════════════════════════════════════════════════════════

  _createModeCards(W) {
    const cardY = 215;
    const cardW = 320;
    const cardH = 200;
    const gap = 40;
    const totalWidth = 3 * cardW + 2 * gap;
    const startX = (W - totalWidth) / 2 + cardW / 2;

    const modes = [
      {
        key: "tug-of-war",
        title: "Tug-of-War",
        emoji: "⚡",
        desc: "Pull the rope!\nDrag your opponent\ninto the mud pit!",
        color: 0xe74c3c,
        colorHex: "#e74c3c",
        accentHex: "#ff6b6b",
        icon2: "🪢",
        icon3: "💪",
      },
      {
        key: "rocket-rush",
        title: "Rocket Rush",
        emoji: "🚀",
        desc: "Race to the stars!\nBoost your rocket\nto the finish line!",
        color: 0x3498db,
        colorHex: "#3498db",
        accentHex: "#74b9ff",
        icon2: "🌟",
        icon3: "🔥",
      },
      {
        key: "catapult-clash",
        title: "Catapult Clash",
        emoji: "🏰",
        desc: "Siege warfare!\nDestroy the enemy\ncastle walls!",
        color: 0x2ecc71,
        colorHex: "#2ecc71",
        accentHex: "#55efc4",
        icon2: "💣",
        icon3: "🛡️",
      },
    ];

    this.modeCards = [];

    modes.forEach((mode, i) => {
      const cx = startX + i * (cardW + gap);
      const container = this.add.container(cx, cardY);

      // ── Card background ──
      const cardBg = this.add
        .rectangle(0, 0, cardW, cardH, 0x12122e, 0.95)
        .setStrokeStyle(2, 0x333366);
      container.add(cardBg);

      // ── Top color band ──
      const band = this.add.rectangle(
        0,
        -cardH / 2 + 15,
        cardW - 4,
        30,
        mode.color,
        0.8,
      );
      container.add(band);

      // ── Glow layer (shows on selection) ──
      const glowBorder = this.add
        .rectangle(0, 0, cardW + 6, cardH + 6, mode.color, 0)
        .setStrokeStyle(3, mode.color);
      glowBorder.setAlpha(0);
      container.add(glowBorder);

      // ── Big emoji icon ──
      const bigEmoji = this.add
        .text(0, -25, mode.emoji, {
          fontSize: "52px",
        })
        .setOrigin(0.5);
      container.add(bigEmoji);

      // ── Orbiting mini icons ──
      const orbit1 = this.add
        .text(-50, -20, mode.icon2, { fontSize: "18px" })
        .setOrigin(0.5)
        .setAlpha(0.5);
      const orbit2 = this.add
        .text(50, -20, mode.icon3, { fontSize: "18px" })
        .setOrigin(0.5)
        .setAlpha(0.5);
      container.add([orbit1, orbit2]);

      // Orbit animation
      this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 8000 + i * 1000,
        repeat: -1,
        onUpdate: (tween) => {
          const ang = Phaser.Math.DegToRad(tween.getValue());
          orbit1.x = Math.cos(ang) * 55;
          orbit1.y = -25 + Math.sin(ang) * 20;
          orbit2.x = Math.cos(ang + Math.PI) * 55;
          orbit2.y = -25 + Math.sin(ang + Math.PI) * 20;
        },
      });

      // ── Title ──
      const titleText = this.add
        .text(0, 25, mode.title, {
          fontSize: "22px",
          fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
          color: mode.accentHex,
          fontStyle: "bold",
          stroke: "#000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      container.add(titleText);

      // ── Description ──
      const descText = this.add
        .text(0, 62, mode.desc, {
          fontSize: "13px",
          fontFamily: "Arial, sans-serif",
          color: "#8899bb",
          align: "center",
          lineSpacing: 2,
        })
        .setOrigin(0.5);
      container.add(descText);

      // ── Selection indicator dot ──
      const selDot = this.add.circle(0, cardH / 2 - 15, 5, mode.color, 0);
      container.add(selDot);

      // ── Hit area (transparent interactive rect) ──
      const hitArea = this.add
        .rectangle(0, 0, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      container.add(hitArea);

      // Entry animation — cards slide up and fade in
      container.setAlpha(0).setScale(0.8);
      container.y = cardY + 40;
      this.tweens.add({
        targets: container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: cardY,
        duration: 500,
        delay: 200 + i * 150,
        ease: "Back.easeOut",
      });

      // Hover effects
      hitArea.on("pointerover", () => {
        if (this.selectedMode !== mode.key) {
          this.tweens.add({
            targets: container,
            scaleX: 1.04,
            scaleY: 1.04,
            duration: 150,
            ease: "Power2",
          });
          cardBg.setFillStyle(0x1a1a44);
        }
      });
      hitArea.on("pointerout", () => {
        if (this.selectedMode !== mode.key) {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: "Power2",
          });
          cardBg.setFillStyle(0x12122e);
        }
      });
      hitArea.on("pointerdown", () => {
        this.selectedMode = mode.key;
        this._updateModeCards();

        // Click ripple
        const ripple = this.add.circle(cx, cardY, 10, mode.color, 0.4);
        this.tweens.add({
          targets: ripple,
          scaleX: 8,
          scaleY: 8,
          alpha: 0,
          duration: 500,
          ease: "Power2",
          onComplete: () => ripple.destroy(),
        });
      });

      this.modeCards.push({
        container,
        cardBg,
        glowBorder,
        selDot,
        bigEmoji,
        mode,
      });
    });

    // Set initial selection
    this._updateModeCards();
  }

  _updateModeCards() {
    this.modeCards.forEach((card) => {
      const isSelected = card.mode.key === this.selectedMode;

      if (isSelected) {
        this.tweens.add({
          targets: card.container,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 250,
          ease: "Back.easeOut",
        });
        card.cardBg.setFillStyle(0x1e1e4a);
        card.cardBg.setStrokeStyle(2, card.mode.color);

        // Glow pulse
        this.tweens.add({
          targets: card.glowBorder,
          alpha: 0.6,
          duration: 300,
          ease: "Power2",
        });

        // Dot appear
        this.tweens.add({
          targets: card.selDot,
          alpha: 1,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 300,
          yoyo: true,
          ease: "Back.easeOut",
        });

        // Emoji bounce
        this.tweens.add({
          targets: card.bigEmoji,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          ease: "Back.easeOut",
        });
      } else {
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: "Power2",
        });
        card.cardBg.setFillStyle(0x12122e);
        card.cardBg.setStrokeStyle(2, 0x333366);
        this.tweens.add({
          targets: card.glowBorder,
          alpha: 0,
          duration: 200,
        });
        card.selDot.setAlpha(0);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  PLAYER NAME SECTION
  // ═══════════════════════════════════════════════════════════

  _createPlayerSection(W) {
    const sectionY = 345;

    // Decorative divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x6c5ce7, 0.3);
    divider.lineBetween(W / 2 - 250, sectionY - 20, W / 2 + 250, sectionY - 20);

    // Label with icon
    this.add
      .text(W / 2, sectionY, "👤  Your Commander Name", {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#8899bb",
      })
      .setOrigin(0.5);

    // Name display (styled input look)
    const nameBg = this.add
      .rectangle(W / 2, sectionY + 35, 300, 38, 0x1a1a3e, 0.9)
      .setStrokeStyle(1, 0x6c5ce7)
      .setInteractive({ useHandCursor: true });

    this.nameText = this.add
      .text(W / 2, sectionY + 35, this.playerName, {
        fontSize: "20px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const editIcon = this.add
      .text(W / 2 + 130, sectionY + 35, "✏️", {
        fontSize: "16px",
      })
      .setOrigin(0.5);

    // Hover glow
    nameBg.on("pointerover", () => {
      nameBg.setStrokeStyle(2, 0xa29bfe);
      this.tweens.add({
        targets: editIcon,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 150,
      });
    });
    nameBg.on("pointerout", () => {
      nameBg.setStrokeStyle(1, 0x6c5ce7);
      this.tweens.add({
        targets: editIcon,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });
    nameBg.on("pointerdown", () => this._promptName());
  }

  // ═══════════════════════════════════════════════════════════
  //  ROOM ACTION BUTTONS
  // ═══════════════════════════════════════════════════════════

  _createRoomActions(W) {
    const btnY = 430;

    // Create Room button
    this._createFancyButton(
      W / 2 - 180,
      btnY,
      "🏠  Create Room",
      0x6c5ce7,
      "#a29bfe",
      () => this._createRoom(),
    );

    // Join Room button
    this._createFancyButton(
      W / 2 + 180,
      btnY,
      "🎮  Join Room",
      0xe67e22,
      "#f0932b",
      () => this._joinRoom(),
    );

    // Room code input area
    const inputY = btnY + 60;
    this.add
      .text(W / 2, inputY, "Room Code:", {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#667799",
      })
      .setOrigin(0.5);

    const codeBg = this.add
      .rectangle(W / 2, inputY + 30, 220, 36, 0x1a1a3e, 0.9)
      .setStrokeStyle(1, 0x444477)
      .setInteractive({ useHandCursor: true });

    this.roomCodeText = this.add
      .text(W / 2, inputY + 30, "_ _ _ _ _ _", {
        fontSize: "22px",
        fontFamily: "Courier New, monospace",
        color: "#ffd700",
        fontStyle: "bold",
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    // Blinking cursor effect
    const cursor = this.add.rectangle(W / 2 + 80, inputY + 30, 2, 20, 0xffd700);
    this.tweens.add({
      targets: cursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    codeBg.on("pointerover", () => codeBg.setStrokeStyle(2, 0x6c5ce7));
    codeBg.on("pointerout", () => codeBg.setStrokeStyle(1, 0x444477));
    codeBg.on("pointerdown", () => this._promptRoomCode());
  }

  _createFancyButton(x, y, label, color, hoverColor, onClick) {
    const btnW = 240;
    const btnH = 46;

    // Glow behind
    const glow = this.add.rectangle(x, y, btnW + 8, btnH + 8, color, 0.15);
    this.tweens.add({
      targets: glow,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Button bg
    const btnBg = this.add
      .rectangle(x, y, btnW, btnH, color, 0.9)
      .setStrokeStyle(1, 0xffffff)
      .setInteractive({ useHandCursor: true });

    // Label
    const txt = this.add
      .text(x, y, label, {
        fontSize: "18px",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Hover
    btnBg.on("pointerover", () => {
      this.tweens.add({
        targets: [btnBg, glow],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 150,
      });
      this.tweens.add({
        targets: txt,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 150,
      });
      btnBg.setAlpha(1);
    });
    btnBg.on("pointerout", () => {
      this.tweens.add({
        targets: [btnBg, glow],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
      this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 150 });
      btnBg.setAlpha(0.9);
    });
    btnBg.on("pointerdown", () => {
      // Press effect
      this.tweens.add({
        targets: [btnBg, txt],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: "Power2",
        onComplete: () => onClick(),
      });
    });

    return btnBg;
  }

  // ═══════════════════════════════════════════════════════════
  //  WAITING ROOM PANEL
  // ═══════════════════════════════════════════════════════════

  _createWaitingPanel(W, H) {
    this.waitingPanel = this.add
      .container(W / 2, H / 2 + 40)
      .setVisible(false)
      .setDepth(50);

    // Dimmer overlay
    this.dimmer = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.6);
    this.waitingPanel.add(this.dimmer);

    // Panel background
    const panelW = 650;
    const panelH = 340;
    const panelBg = this.add
      .rectangle(0, 0, panelW, panelH, 0x12122e, 0.98)
      .setStrokeStyle(2, 0xffd700);
    this.waitingPanel.add(panelBg);

    // Decorative corner accents
    const corners = [
      { x: -panelW / 2 + 10, y: -panelH / 2 + 10 },
      { x: panelW / 2 - 10, y: -panelH / 2 + 10 },
      { x: -panelW / 2 + 10, y: panelH / 2 - 10 },
      { x: panelW / 2 - 10, y: panelH / 2 - 10 },
    ];
    corners.forEach((c) => {
      const corner = this.add.circle(c.x, c.y, 4, 0xffd700, 0.8);
      this.waitingPanel.add(corner);
      this.tweens.add({
        targets: corner,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Room title
    this.waitingTitle = this.add
      .text(0, -panelH / 2 + 40, "Room: ------", {
        fontSize: "28px",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        color: "#ffd700",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.waitingPanel.add(this.waitingTitle);

    // Divider line
    const panelLine = this.add.rectangle(
      0,
      -panelH / 2 + 65,
      panelW - 60,
      1,
      0xffd700,
      0.3,
    );
    this.waitingPanel.add(panelLine);

    // Team columns
    // Red team box
    const redBox = this.add
      .rectangle(-140, 10, 230, 120, 0x2d1515, 0.8)
      .setStrokeStyle(1, 0xff6b6b);
    const redHeader = this.add
      .text(-140, -45, "🔴 RED TEAM", {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.redTeamText = this.add
      .text(-140, 20, "(waiting...)", {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#ff9999",
        align: "center",
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5);
    this.waitingPanel.add([redBox, redHeader, this.redTeamText]);

    // VS badge
    const vsBadge = this.add
      .text(0, 10, "⚔️", { fontSize: "32px" })
      .setOrigin(0.5);
    this.waitingPanel.add(vsBadge);
    this.tweens.add({
      targets: vsBadge,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Blue team box
    const blueBox = this.add
      .rectangle(140, 10, 230, 120, 0x151530, 0.8)
      .setStrokeStyle(1, 0x74b9ff);
    const blueHeader = this.add
      .text(140, -45, "🔵 BLUE TEAM", {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.blueTeamText = this.add
      .text(140, 20, "(waiting...)", {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#99bbff",
        align: "center",
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5);
    this.waitingPanel.add([blueBox, blueHeader, this.blueTeamText]);

    // Status text
    this.waitingStatus = this.add
      .text(0, 85, "Waiting for players...", {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#8899bb",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
    this.waitingPanel.add(this.waitingStatus);

    // Animated dots for waiting
    this._waitingDots = this.add
      .text(0, 100, "● ● ●", {
        fontSize: "12px",
        color: "#6c5ce7",
      })
      .setOrigin(0.5);
    this.waitingPanel.add(this._waitingDots);
    this.tweens.add({
      targets: this._waitingDots,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Action buttons row
    const btnRow = 140;

    // Start button (green, prominent)
    const startGlow = this.add.rectangle(-100, btnRow, 210, 48, 0x2ecc71, 0.2);
    this.tweens.add({
      targets: startGlow,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.waitingPanel.add(startGlow);

    const startBg = this.add
      .rectangle(-100, btnRow, 200, 42, 0x2ecc71, 0.95)
      .setStrokeStyle(1, 0x55efc4)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(-100, btnRow, "🚀 START BATTLE!", {
        fontSize: "18px",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.waitingPanel.add([startBg, startTxt]);

    startBg.on("pointerover", () => {
      this.tweens.add({
        targets: [startBg, startTxt],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 120,
      });
    });
    startBg.on("pointerout", () => {
      this.tweens.add({
        targets: [startBg, startTxt],
        scaleX: 1,
        scaleY: 1,
        duration: 120,
      });
    });
    startBg.on("pointerdown", () => {
      this.tweens.add({
        targets: [startBg, startTxt],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: () => SocketManager.startGame(),
      });
    });

    // Switch team button
    const switchBg = this.add
      .rectangle(100, btnRow, 180, 42, 0x6c5ce7, 0.9)
      .setStrokeStyle(1, 0xa29bfe)
      .setInteractive({ useHandCursor: true });
    const switchTxt = this.add
      .text(100, btnRow, "🔄 Switch Team", {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.waitingPanel.add([switchBg, switchTxt]);

    switchBg.on("pointerover", () => {
      this.tweens.add({
        targets: [switchBg, switchTxt],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 120,
      });
    });
    switchBg.on("pointerout", () => {
      this.tweens.add({
        targets: [switchBg, switchTxt],
        scaleX: 1,
        scaleY: 1,
        duration: 120,
      });
    });
    switchBg.on("pointerdown", () => {
      this.tweens.add({
        targets: [switchBg, switchTxt],
        angle: 360,
        duration: 400,
        ease: "Power2",
        onComplete: () => {
          switchBg.setAngle(0);
          switchTxt.setAngle(0);
          SocketManager.switchTeam();
        },
      });
    });
  }

  _showWaitingPanel(roomCode) {
    this.waitingPanel.setVisible(true);
    this.waitingPanel.setScale(0.7).setAlpha(0);
    this.tweens.add({
      targets: this.waitingPanel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: "Back.easeOut",
    });
    this.waitingTitle.setText(`🏠 Room: ${roomCode}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  KEYBOARD INPUT
  // ═══════════════════════════════════════════════════════════

  _setupKeyboard() {
    this.input.keyboard.on("keydown", (e) => {
      if (!this.inRoom && e.key.length === 1 && /[A-Za-z0-9]/.test(e.key)) {
        this.roomInput = (this.roomInput + e.key.toUpperCase()).slice(0, 6);
        this.roomCodeText.setText(this.roomInput || "_ _ _ _ _ _");
      }
      if (e.key === "Backspace") {
        this.roomInput = this.roomInput.slice(0, -1);
        this.roomCodeText.setText(this.roomInput || "_ _ _ _ _ _");
      }
      if (e.key === "Enter" && this.roomInput.length >= 4) {
        this._joinRoom();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  FOOTER & BACK BUTTON
  // ═══════════════════════════════════════════════════════════

  _createFooter(W, H) {
    // Divider
    this.add.rectangle(W / 2, H - 50, W - 60, 1, 0x333366, 0.3);

    // Key hints with colored labels
    const footerY = H - 28;
    this.add
      .text(
        W / 2,
        footerY,
        "🔴 RED: Q W E R    |    🔵 BLUE: U I O P    |    📱 Touch: Tap answers!",
        {
          fontSize: "13px",
          fontFamily: "Arial, sans-serif",
          color: "#556688",
        },
      )
      .setOrigin(0.5);
  }

  _createBackButton() {
    const backBg = this.add
      .rectangle(55, 25, 80, 28, 0x1a1a3e, 0.8)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });

    const backTxt = this.add
      .text(55, 25, "◀ Back", {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#778899",
      })
      .setOrigin(0.5);

    backBg.on("pointerover", () => {
      backBg.setStrokeStyle(1, 0x6c5ce7);
      backTxt.setColor("#ffffff");
      this.tweens.add({
        targets: [backBg, backTxt],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });
    backBg.on("pointerout", () => {
      backBg.setStrokeStyle(1, 0x444466);
      backTxt.setColor("#778899");
      this.tweens.add({
        targets: [backBg, backTxt],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
    backBg.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("TitleScene"));
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SOCKET LISTENERS
  // ═══════════════════════════════════════════════════════════

  _setupSocketListeners() {
    SocketManager.on("player-joined", (data) => {
      this._updateWaitingRoom(data.teamRed, data.teamBlue);
    });

    SocketManager.on("player-left", (data) => {
      this._updateWaitingRoom(data.teamRed, data.teamBlue);
    });

    SocketManager.on("teams-updated", (data) => {
      this._updateWaitingRoom(data.teamRed, data.teamBlue);
      if (
        data.switchedPlayer &&
        data.switchedPlayer.id === SocketManager.socket?.id
      ) {
        SocketManager.team = data.switchedPlayer.team;
      }
    });

    SocketManager.on("game-started", (data) => {
      const sceneMap = {
        "tug-of-war": "TugOfWarScene",
        "rocket-rush": "RocketRushScene",
        "catapult-clash": "CatapultClashScene",
      };
      // Flash transition
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(200, () => {
        this.scene.start(sceneMap[data.mode], {
          state: data.state,
          question: data.question,
          mode: data.mode,
        });
      });
    });
  }

  _updateWaitingRoom(teamRed, teamBlue) {
    const redNames = teamRed.map((p) => `⚔️ ${p.name}`).join("\n") || "(empty)";
    const blueNames =
      teamBlue.map((p) => `⚔️ ${p.name}`).join("\n") || "(empty)";
    if (this.redTeamText) this.redTeamText.setText(redNames);
    if (this.blueTeamText) this.blueTeamText.setText(blueNames);
    const total = teamRed.length + teamBlue.length;
    if (this.waitingStatus) {
      this.waitingStatus.setText(
        `${total} warrior${total !== 1 ? "s" : ""} ready for battle!`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  ROOM ACTIONS
  // ═══════════════════════════════════════════════════════════

  async _createRoom() {
    try {
      const res = await SocketManager.createRoom(
        this.playerName,
        this.selectedMode,
      );
      this.inRoom = true;
      this._showWaitingPanel(res.roomCode);
      this.redTeamText.setText(`⚔️ ${this.playerName}`);
      this.blueTeamText.setText("(waiting...)");
      this.roomInput = res.roomCode;
      this.roomCodeText.setText(res.roomCode);
    } catch (err) {
      console.error("Create room failed:", err);
    }
  }

  async _joinRoom() {
    if (this.roomInput.length < 4) return;
    try {
      const res = await SocketManager.joinRoom(this.roomInput, this.playerName);
      this.inRoom = true;
      this._showWaitingPanel(res.roomCode);
    } catch (err) {
      console.error("Join room failed:", err);
      if (this.waitingStatus) {
        this.waitingStatus.setText("❌ " + err);
      }
    }
  }

  _promptName() {
    const name = globalThis.prompt("Enter your name:", this.playerName);
    if (name && name.trim()) {
      this.playerName = name.trim().slice(0, 15);
      this.nameText.setText(this.playerName);
    }
  }

  _promptRoomCode() {
    const code = globalThis.prompt("Enter room code:", this.roomInput);
    if (code && code.trim()) {
      this.roomInput = code.trim().toUpperCase().slice(0, 6);
      this.roomCodeText.setText(this.roomInput);
    }
  }
}
