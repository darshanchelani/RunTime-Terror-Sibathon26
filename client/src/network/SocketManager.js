// ============================================================
// SocketManager — Singleton wrapper around socket.io-client
// All network communication goes through here
// ============================================================

import { io } from "socket.io-client";
import { CONFIG } from "../config.js";

class SocketManagerClass {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.team = null;
    this.playerName = null;
  }

  connect() {
    if (this.socket && this.socket.connected) return;
    
    // Disconnect old socket if exists but not connected
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(CONFIG.SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to BattleBrains server");
    });

    this.socket.on("disconnect", () => {
      console.log("💔 Disconnected from server");
    });

    this.socket.on("connect_error", (err) => {
      console.log("⚠️ Connection error:", err.message);
    });
  }

  // ── Room Operations ──

  createRoom(playerName, mode) {
    return new Promise((resolve, reject) => {
      this.playerName = playerName;
      this.socket.emit("create-room", { playerName, mode }, (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.team = response.team;
          globalThis.__socketManagerTeam = this.team;
          resolve(response);
        } else {
          reject(response.error);
        }
      });
    });
  }

  joinRoom(roomCode, playerName) {
    return new Promise((resolve, reject) => {
      this.playerName = playerName;
      this.socket.emit("join-room", { roomCode, playerName }, (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.team = response.team;
          globalThis.__socketManagerTeam = this.team;
          resolve(response);
        } else {
          reject(response.error);
        }
      });
    });
  }

  switchTeam() {
    this.socket.emit("switch-team", { roomCode: this.roomCode });
    // Optimistically toggle team; server will confirm via teams-updated
    this.team = this.team === "red" ? "blue" : "red";
    globalThis.__socketManagerTeam = this.team;
  }

  startGame() {
    this.socket.emit("start-game", { roomCode: this.roomCode });
  }

  submitAnswer(answerIndex, team) {
    this.socket.emit("submit-answer", {
      roomCode: this.roomCode,
      answerIndex,
      team,
    });
  }

  usePowerUp(type) {
    this.socket.emit("use-powerup", {
      roomCode: this.roomCode,
      powerUpType: type,
    });
  }

  requestNextQuestion() {
    this.socket.emit("next-question", { roomCode: this.roomCode });
  }

  rematch() {
    this.socket.emit("rematch", { roomCode: this.roomCode });
  }

  leaveRoom() {
    if (this.socket && this.roomCode) {
      this.socket.emit("leave-room", { roomCode: this.roomCode });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  reconnect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else if (!this.socket) {
      this.connect();
    }
  }

  // ── Event Listeners ──

  on(event, callback) {
    if (this.socket) this.socket.on(event, callback);
  }

  off(event, callback) {
    if (this.socket) this.socket.off(event, callback);
  }

  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton
export const SocketManager = new SocketManagerClass();
