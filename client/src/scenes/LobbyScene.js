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

  init(data) {
    this._restoreData = data || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = CONFIG.s(this);

    // ── Clean up any stale socket listeners from previous sessions ──
    this._cleanupLobbyListeners();

    // ── State ──
    this.selectedMode = this._restoreData?.selectedMode || "tug-of-war";
    this.playerName = this._restoreData?.playerName || "Player" + Math.floor(Math.random() * 999);
    this.roomInput = this._restoreData?.roomInput || "";
    this.inRoom = this._restoreData?.inRoom || false;
    this._restoreData = null;

    // ── Animated Background ──
    this._drawBackground(W, H);
    this._createParticles(W, H);

    // ── Header Section ──
    this._createHeader(W, s);

    // ── Game Mode Cards ──
    this._createModeCards(W, s);

    // ── Player Setup Section ──
    this._createPlayerSection(W, s);

    // ── Room Action Buttons ──
    this._createRoomActions(W, s);

    // ── Status text for errors (visible on main screen) ──
    this.statusText = this.add.text(W / 2, Math.round(560 * s), "", {
      fontSize: CONFIG.fs(this, 15),
      fontFamily: "Arial, sans-serif",
      color: "#ff6b6b",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(60);

    // ── Connection status ──
    this._checkConnection();

    // ── Waiting Room Panel (hidden initially) ──
    this._createWaitingPanel(W, H, s);

    // ── Keyboard input for room code ──
    this._setupKeyboard();

    // ── Socket Listeners ──
    this._setupSocketListeners();

    // ── Footer ──
    this._createFooter(W, H, s);

    // ── Back button ──
    this._createBackButton(s);

    // ── Entry animation — fade in from black ──
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Handle window resize / orientation change ──
    this.scale.on('resize', this._handleResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this._handleResize, this));

    // ── Restore waiting panel if we were in a room before resize ──
    if (this.inRoom && this.roomInput) {
      this._showWaitingPanel(this.roomInput);
    }
    // Restore room code display after resize
    if (this.roomInput && this.roomCodeText) {
      this.roomCodeText.setText(this.roomInput);
    }
  }

  _cleanupLobbyListeners() {
    SocketManager.off("player-joined");
    SocketManager.off("player-left");
    SocketManager.off("teams-updated");
    SocketManager.off("game-started");
  }

  _handleResize() {
    if (this._resizeDebounce) clearTimeout(this._resizeDebounce);
    this._resizeDebounce = setTimeout(() => {
      if (this.scene.isActive('LobbyScene')) {
        this._cleanupLobbyListeners();
        this.scene.restart({
          selectedMode: this.selectedMode,
          playerName: this.playerName,
          roomInput: this.roomInput,
          inRoom: this.inRoom,
        });
      }
    }, 250);
  }

  _checkConnection() {
    if (!SocketManager.socket || !SocketManager.socket.connected) {
      // Try reconnecting
      SocketManager.connect();
      this.statusText.setText("⏳ Connecting to server...").setColor("#ffd700");
      // Wait for connection
      const checkInterval = this.time.addEvent({
        delay: 500,
        repeat: 20,
        callback: () => {
          if (SocketManager.socket?.connected) {
            this.statusText.setText("✅ Connected!").setColor("#2ecc71");
            this.time.delayedCall(2000, () => {
              if (this.statusText) this.statusText.setText("");
            });
            checkInterval.destroy();
          }
        },
      });
      // Timeout after 10 seconds
      this.time.delayedCall(10000, () => {
        if (!SocketManager.socket?.connected) {
          this.statusText.setText("❌ Cannot connect to server. Is it running?").setColor("#e74c3c");
        }
      });
    }
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

  _createHeader(W, s) {
    // Glowing line under header
    const headerLine = this.add.rectangle(W / 2, Math.round(100 * s), Math.min(Math.round(600 * s), W - 40), 2, 0xffd700, 0.5);
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
      .text(W / 2, Math.round(42 * s), "🧠 BattleBrains", {
        fontSize: CONFIG.fs(this, 40),
        fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
        color: "#ffd700",
        stroke: "#ffa500",
        strokeThickness: Math.max(2, Math.round(4 * s)),
      })
      .setOrigin(0.5)
      .setAlpha(0.3);

    const title = this.add
      .text(W / 2, Math.round(40 * s), "🧠 BattleBrains", {
        fontSize: CONFIG.fs(this, 40),
        fontFamily: "Arial Rounded MT Bold, Arial Black, sans-serif",
        color: "#ffd700",
        stroke: "#000",
        strokeThickness: Math.max(2, Math.round(3 * s)),
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
      .text(W / 2, Math.round(75 * s), "Choose Your Battle Arena", {
        fontSize: CONFIG.fs(this, 15),
        fontFamily: "Arial, sans-serif",
        color: "#aabbdd",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: Math.round(72 * s),
      duration: 800,
      delay: 300,
      ease: "Power2",
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  GAME MODE CARDS (the main attraction!)
  // ═══════════════════════════════════════════════════════════

  _createModeCards(W, s) {
    // Responsive layout: 3 columns on wide screens, 2 on medium, 1 on tiny
    let colCount = 3;
    if (W < 800) colCount = 2;
    if (W < 480) colCount = 1;

    const gap = Math.max(4, Math.round(W < 480 ? 6 * s : 14 * s));
    const maxCardW = Math.max(90, (W - 40 - (colCount - 1) * gap) / colCount);
    const cardW = Math.min(Math.round(280 * s), maxCardW);
    const cardH = Math.min(Math.round(170 * s), Math.round(cardW * 0.6));
    
    // Position cards based on column count
    let cardPositions = [];
    if (colCount === 1) {
      cardPositions = [
        { x: W / 2, y: Math.round(160 * s) },
        { x: W / 2, y: Math.round(160 * s + cardH + gap + 30) },
        { x: W / 2, y: Math.round(160 * s + 2 * (cardH + gap + 30)) }
      ];
    } else if (colCount === 2) {
      const leftX = (W / 2) - (cardW + gap / 2);
      const rightX = (W / 2) + (cardW + gap / 2);
      cardPositions = [
        { x: leftX, y: Math.round(180 * s) },
        { x: rightX, y: Math.round(180 * s) },
        { x: W / 2, y: Math.round(180 * s + cardH + gap + 40) }
      ];
    } else {
      const totalWidth = 3 * cardW + 2 * gap;
      const startX = (W - totalWidth) / 2 + cardW / 2;
      cardPositions = [
        { x: startX, y: Math.round(215 * s) },
        { x: startX + cardW + gap, y: Math.round(215 * s) },
        { x: startX + 2 * (cardW + gap), y: Math.round(215 * s) }
      ];
    }

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
      const pos = cardPositions[i];
      const container = this.add.container(pos.x, pos.y);

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
        .text(0, Math.round(-25 * s), mode.emoji, {
          fontSize: CONFIG.fs(this, 44),
        })
        .setOrigin(0.5);
      container.add(bigEmoji);

      // ── Orbiting mini icons ──
      const orbit1 = this.add
        .text(Math.round(-50 * s), Math.round(-20 * s), mode.icon2, { fontSize: CONFIG.fs(this, 16) })
        .setOrigin(0.5)
        .setAlpha(0.5);
      const orbit2 = this.add
        .text(Math.round(50 * s), Math.round(-20 * s), mode.icon3, { fontSize: CONFIG.fs(this, 16) })
        .setOrigin(0.5)
        .setAlpha(0.5);
      container.add([orbit1, orbit2]);

      // Orbit animation
      const orbitR = Math.round(50 * s);
      this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 8000 + i * 1000,
        repeat: -1,
        onUpdate: (tween) => {
          const ang = Phaser.Math.DegToRad(tween.getValue());
          orbit1.x = Math.cos(ang) * orbitR;
          orbit1.y = Math.round(-25 * s) + Math.sin(ang) * Math.round(20 * s);
          orbit2.x = Math.cos(ang + Math.PI) * orbitR;
          orbit2.y = Math.round(-25 * s) + Math.sin(ang + Math.PI) * Math.round(20 * s);
        },
      });

      // ── Title ──
      const titleText = this.add
        .text(0, Math.round(25 * s), mode.title, {
          fontSize: CONFIG.fs(this, 19),
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
        .text(0, Math.round(58 * s), mode.desc, {
          fontSize: CONFIG.fs(this, 12),
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
      container.y = pos.y + 40;
      this.tweens.add({
        targets: container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: pos.y,
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
        const ripple = this.add.circle(pos.x, pos.y, 10, mode.color, 0.4);
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

  _createPlayerSection(W, s) {
    const sectionY = Math.round(345 * s);

    // Decorative divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x6c5ce7, 0.3);
    const divW = Math.min(Math.round(250 * s), (W - 40) / 2);
    divider.lineBetween(W / 2 - divW, sectionY - Math.round(20 * s), W / 2 + divW, sectionY - Math.round(20 * s));

    // Label with icon
    this.add
      .text(W / 2, sectionY, "👤  Your Commander Name", {
        fontSize: CONFIG.fs(this, 15),
        fontFamily: "Arial, sans-serif",
        color: "#8899bb",
      })
      .setOrigin(0.5);

    // Name display (styled input look)
    const inputW = Math.min(Math.round(280 * s), W - 40);
    const nameBg = this.add
      .rectangle(W / 2, sectionY + Math.round(35 * s), inputW, Math.round(36 * s), 0x1a1a3e, 0.9)
      .setStrokeStyle(1, 0x6c5ce7)
      .setInteractive({ useHandCursor: true });

    this.nameText = this.add
      .text(W / 2, sectionY + Math.round(35 * s), this.playerName, {
        fontSize: CONFIG.fs(this, 19),
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const editIcon = this.add
      .text(W / 2 + inputW / 2 - Math.round(15 * s), sectionY + Math.round(35 * s), "✏️", {
        fontSize: CONFIG.fs(this, 14),
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

  _createRoomActions(W, s) {
    const btnY = Math.round(430 * s);
    const btnSpacing = Math.min(Math.round(170 * s), (W - 60) / 2 - 20);

    // Create Room button
    this._createFancyButton(
      W / 2 - btnSpacing,
      btnY,
      "🏠  Create Room",
      0x6c5ce7,
      "#a29bfe",
      () => this._createRoom(),
      s,
    );

    // Join Room button
    this._createFancyButton(
      W / 2 + btnSpacing,
      btnY,
      "🎮  Join Room",
      0xe67e22,
      "#f0932b",
      () => this._joinRoom(),
      s,
    );

    // Room code input area
    const inputY = btnY + Math.round(60 * s);
    this.add
      .text(W / 2, inputY, "Room Code:", {
        fontSize: CONFIG.fs(this, 13),
        fontFamily: "Arial, sans-serif",
        color: "#667799",
      })
      .setOrigin(0.5);

    const codeInputW = Math.min(Math.round(220 * s), W - 40);
    const codeBg = this.add
      .rectangle(W / 2, inputY + Math.round(30 * s), codeInputW, Math.round(34 * s), 0x1a1a3e, 0.9)
      .setStrokeStyle(1, 0x444477)
      .setInteractive({ useHandCursor: true });

    this.roomCodeText = this.add
      .text(W / 2, inputY + Math.round(30 * s), "_ _ _ _ _ _", {
        fontSize: CONFIG.fs(this, 20),
        fontFamily: "Courier New, monospace",
        color: "#ffd700",
        fontStyle: "bold",
        letterSpacing: Math.round(4 * s),
      })
      .setOrigin(0.5);

    // Blinking cursor effect
    const cursor = this.add.rectangle(W / 2 + codeInputW / 2 - Math.round(10 * s), inputY + Math.round(30 * s), 2, Math.round(20 * s), 0xffd700);
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

  _createFancyButton(x, y, label, color, hoverColor, onClick, s) {
    s = s || CONFIG.s(this);
    const btnW = Math.min(Math.round(230 * s), (this.scale.width - 50) / 2);
    const btnH = Math.max(30, Math.round(44 * s));

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
        fontSize: CONFIG.fs(this, 16),
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

  _createWaitingPanel(W, H, s) {
    this.waitingPanel = this.add
      .container(W / 2, H / 2 + Math.round(40 * s))
      .setVisible(false)
      .setDepth(50);

    // Dimmer overlay
    this.dimmer = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.6);
    this.waitingPanel.add(this.dimmer);

    // Panel background
    const panelW = Math.min(Math.round(620 * s), W - 20);
    const panelH = Math.min(Math.round(330 * s), H - 40);
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

    // ── Close (X) button at top-right corner ──
    const closeBtn = this.add
      .text(panelW / 2 - Math.round(16 * s), -panelH / 2 + Math.round(16 * s), "✖", {
        fontSize: CONFIG.fs(this, 20),
        fontFamily: "Arial, sans-serif",
        color: "#ff6b6b",
        backgroundColor: "#1a1a2e",
        padding: { x: Math.round(6 * s), y: Math.round(2 * s) },
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(60);
    this.waitingPanel.add(closeBtn);

    closeBtn.on("pointerover", () => {
      closeBtn.setStyle({ backgroundColor: "#e74c3c", color: "#fff" });
      this.tweens.add({ targets: closeBtn, scaleX: 1.15, scaleY: 1.15, duration: 80 });
    });
    closeBtn.on("pointerout", () => {
      closeBtn.setStyle({ backgroundColor: "#1a1a2e", color: "#ff6b6b" });
      this.tweens.add({ targets: closeBtn, scaleX: 1, scaleY: 1, duration: 80 });
    });
    closeBtn.on("pointerdown", () => {
      // Leave room and hide panel
      SocketManager.leaveRoom && SocketManager.leaveRoom();
      this.waitingPanel.setVisible(false);
      this.inRoom = false;
    });

    // Room title
    this.waitingTitle = this.add
      .text(0, -panelH / 2 + Math.round(40 * s), "Room: ------", {
        fontSize: CONFIG.fs(this, 26),
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
      -panelH / 2 + Math.round(65 * s),
      panelW - Math.round(60 * s),
      1,
      0xffd700,
      0.3,
    );
    this.waitingPanel.add(panelLine);

    // Team columns
    const teamBoxW = Math.min(Math.round(210 * s), (panelW - 60) / 2);
    const teamBoxH = Math.round(110 * s);
    const teamSpacing = Math.round(panelW * 0.22);
    // Red team box
    const redBox = this.add
      .rectangle(-teamSpacing, Math.round(10 * s), teamBoxW, teamBoxH, 0x2d1515, 0.8)
      .setStrokeStyle(1, 0xff6b6b);
    const redHeader = this.add
      .text(-teamSpacing, Math.round(-45 * s), "🔴 RED TEAM", {
        fontSize: CONFIG.fs(this, 15),
        fontFamily: "Arial, sans-serif",
        color: "#ff6b6b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.redTeamText = this.add
      .text(-teamSpacing, Math.round(20 * s), "(waiting...)", {
        fontSize: CONFIG.fs(this, 13),
        fontFamily: "Arial, sans-serif",
        color: "#ff9999",
        align: "center",
        wordWrap: { width: teamBoxW - 10 },
      })
      .setOrigin(0.5);
    this.waitingPanel.add([redBox, redHeader, this.redTeamText]);

    // VS badge
    const vsBadge = this.add
      .text(0, Math.round(10 * s), "⚔️", { fontSize: CONFIG.fs(this, 28) })
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
      .rectangle(teamSpacing, Math.round(10 * s), teamBoxW, teamBoxH, 0x151530, 0.8)
      .setStrokeStyle(1, 0x74b9ff);
    const blueHeader = this.add
      .text(teamSpacing, Math.round(-45 * s), "🔵 BLUE TEAM", {
        fontSize: CONFIG.fs(this, 15),
        fontFamily: "Arial, sans-serif",
        color: "#74b9ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.blueTeamText = this.add
      .text(teamSpacing, Math.round(20 * s), "(waiting...)", {
        fontSize: CONFIG.fs(this, 13),
        fontFamily: "Arial, sans-serif",
        color: "#99bbff",
        align: "center",
        wordWrap: { width: teamBoxW - 10 },
      })
      .setOrigin(0.5);
    this.waitingPanel.add([blueBox, blueHeader, this.blueTeamText]);

    // Status text
    this.waitingStatus = this.add
      .text(0, Math.round(85 * s), "Waiting for players...", {
        fontSize: CONFIG.fs(this, 13),
        fontFamily: "Arial, sans-serif",
        color: "#8899bb",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
    this.waitingPanel.add(this.waitingStatus);

    // Animated dots for waiting
    this._waitingDots = this.add
      .text(0, Math.round(100 * s), "● ● ●", {
        fontSize: CONFIG.fs(this, 11),
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
    const btnRow = Math.round(140 * s);
    const startBtnW = Math.min(Math.round(200 * s), (panelW - 40) / 2);
    const switchBtnW = Math.min(Math.round(170 * s), (panelW - 40) / 2);
    const btnSpacing = Math.round(panelW * 0.17);

    // Start button (green, prominent)
    const startGlow = this.add.rectangle(-btnSpacing, btnRow, startBtnW + 10, Math.round(46 * s), 0x2ecc71, 0.2);
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
      .rectangle(-btnSpacing, btnRow, startBtnW, Math.round(40 * s), 0x2ecc71, 0.95)
      .setStrokeStyle(1, 0x55efc4)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(-btnSpacing, btnRow, "🚀 START BATTLE!", {
        fontSize: CONFIG.fs(this, 16),
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
      .rectangle(btnSpacing, btnRow, switchBtnW, Math.round(40 * s), 0x6c5ce7, 0.9)
      .setStrokeStyle(1, 0xa29bfe)
      .setInteractive({ useHandCursor: true });
    const switchTxt = this.add
      .text(btnSpacing, btnRow, "🔄 Switch Team", {
        fontSize: CONFIG.fs(this, 15),
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

  _createFooter(W, H, s) {
    // Divider
    this.add.rectangle(W / 2, H - Math.round(50 * s), W - Math.round(60 * s), 1, 0x333366, 0.3);

    // Key hints with colored labels — hide on small screens
    if (W > 600) {
      const footerY = H - Math.round(28 * s);
      this.add
        .text(
          W / 2,
          footerY,
          "🔴 RED: Q W E R    |    🔵 BLUE: U I O P    |    🎯 Multi-device: 1 2 3 4",
          {
            fontSize: CONFIG.fs(this, 12),
            fontFamily: "Arial, sans-serif",
            color: "#556688",
          },
        )
        .setOrigin(0.5);
    }
  }

  _createBackButton(s) {
    s = s || CONFIG.s(this);
    const btnW = Math.max(60, Math.round(80 * s));
    const btnH = Math.max(22, Math.round(28 * s));
    const backBg = this.add
      .rectangle(Math.round(55 * s), Math.round(25 * s), btnW, btnH, 0x1a1a3e, 0.8)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });

    const backTxt = this.add
      .text(Math.round(55 * s), Math.round(25 * s), "◀ Back", {
        fontSize: CONFIG.fs(this, 13),
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
      // Clean up lobby listeners before transitioning
      this._cleanupLobbyListeners();
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
    if (!SocketManager.socket?.connected) {
      this.statusText.setText("❌ Not connected to server!").setColor("#e74c3c");
      return;
    }
    this.statusText.setText("⏳ Creating room...").setColor("#ffd700");
    try {
      const res = await SocketManager.createRoom(
        this.playerName,
        this.selectedMode,
      );
      this.inRoom = true;
      this.statusText.setText("");
      this._showWaitingPanel(res.roomCode);
      this.redTeamText.setText(`⚔️ ${this.playerName}`);
      this.blueTeamText.setText("(waiting...)");
      this.roomInput = res.roomCode;
      this.roomCodeText.setText(res.roomCode);
    } catch (err) {
      console.error("Create room failed:", err);
      this.statusText.setText("❌ Failed to create room: " + err).setColor("#e74c3c");
    }
  }

  async _joinRoom() {
    if (this.roomInput.length < 4) {
      this.statusText.setText("❌ Room code must be at least 4 characters").setColor("#e74c3c");
      return;
    }
    if (!SocketManager.socket?.connected) {
      this.statusText.setText("❌ Not connected to server!").setColor("#e74c3c");
      return;
    }
    this.statusText.setText("⏳ Joining room...").setColor("#ffd700");
    try {
      const res = await SocketManager.joinRoom(this.roomInput, this.playerName);
      this.inRoom = true;
      this.statusText.setText("");
      this._showWaitingPanel(res.roomCode);
    } catch (err) {
      console.error("Join room failed:", err);
      this.statusText.setText("❌ " + err).setColor("#e74c3c");
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
