# 🧠 BattleBrains — Multiplayer Quiz Battle Arena

> **Hackathon MVP by Team RunTime Terror** — Turn quizzes into fast, competitive team battles for students aged 8–14!

![BattleBrains](https://img.shields.io/badge/BattleBrains-v1.0-gold?style=for-the-badge)
![Phaser 3](https://img.shields.io/badge/Phaser_3-Game_Engine-blue?style=flat-square)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-green?style=flat-square)

---

## 🎮 What is BattleBrains?

BattleBrains is a **multiplayer web-based gamified learning platform** that turns quizzes into fast, competitive team battles. Two teams compete head-to-head — correct answers drive exciting game actions!

### Three Game Modes

| Mode | Description | Win Condition |
|------|-------------|---------------|
| ⚡ **Tug-of-War** | Pull the rope! Correct answers drag the opponent toward the mud pit | Pull opponent past the center line |
| 🚀 **Rocket Rush Race** | Fuel your rocket! Correct answers boost your team's rocket skyward | First rocket to reach the finish line |
| 🏰 **Catapult Castle Clash** | Launch boulders! Correct answers fire projectiles at the enemy castle | Destroy the enemy castle (reduce HP to 0) |

### Key Features
- **Real-time multiplayer** — single device (split keyboard) OR online rooms
- **Touch-friendly** — perfect for classroom tablets and smartboards
- **30–60 second rounds** with power-ups (Double, Freeze, Shield)
- **40 math/science questions** (addition, multiplication, equations, science trivia)
- **Leaderboards** and score tracking
- **Particle effects**, camera shakes, celebrations — feels exciting!
- **60 FPS smooth** on mid-range laptops

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm**

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/YOUR-TEAM/RunTime-Terror-Sibathon26.git
cd RunTime-Terror-Sibathon26

# 2. Install all dependencies (root + server + client)
npm run install-all

# 3. Start development (server + client concurrently)
npm run dev
```

- **Server** runs on `http://localhost:3000`
- **Client** runs on `http://localhost:5173` (with Vite proxy to server)

### Play!
1. Open `http://localhost:5173` in your browser
2. Enter your name → pick a game mode → **Create Room**
3. Share the room code with your teammate (or open another tab)
4. Second player joins with the room code → **Start Battle!**

---

## 🕹️ Controls

### Keyboard (Single Device — Two Teams)

| Action | 🔴 Red Team | 🔵 Blue Team |
|--------|------------|-------------|
| Answer Option 1 | `Q` | `U` |
| Answer Option 2 | `W` | `I` |
| Answer Option 3 | `E` | `O` |
| Answer Option 4 | `R` | `P` |
| Use Power-Up | `T` | `Y` |

### Touch / Mouse
- **Tap** any answer option directly
- **Tap** power-up icons on the sides

---

## 🏗️ Project Structure

```
RunTime-Terror-Sibathon26/
├── package.json              # Root — runs server + client concurrently
├── server/                   # 🖥️ Backend (Member 1's domain)
│   ├── index.js              # Express + Socket.IO server
│   ├── game/
│   │   ├── GameRoom.js       # Room management, game state, win logic
│   │   ├── QuizEngine.js     # Question shuffling & delivery
│   │   ├── PowerUps.js       # Power-up effects (double, freeze, shield)
│   │   └── questions.json    # 40 math/science questions
│   └── utils/
│       └── roomCodes.js      # Room code generator
├── client/                   # 🎮 Frontend (Member 2's domain)
│   ├── index.html            # Entry HTML with loading screen
│   ├── vite.config.js        # Vite dev server + proxy config
│   └── src/
│       ├── main.js           # Phaser 3 game config & boot
│       ├── config.js         # Shared constants (colors, keys, fonts)
│       ├── network/
│       │   └── SocketManager.js  # Socket.IO client wrapper
│       ├── scenes/
│       │   ├── BootScene.js      # Asset generation (no file loads!)
│       │   ├── LobbyScene.js     # Room create/join UI
│       │   ├── TugOfWarScene.js  # ⚡ Tug-of-War game
│       │   ├── RocketRushScene.js # 🚀 Rocket Rush game
│       │   ├── CatapultClashScene.js # 🏰 Catapult Clash game
│       │   └── WinScene.js       # Victory celebration + rematch
│       └── ui/
│           ├── QuestionOverlay.js # Quiz question + options display
│           ├── HUD.js            # Score notifications, floating text
│           └── PowerUpBar.js     # Power-up buttons for both teams
├── CONTRIBUTING.md           # Git workflow & contribution guide
├── TEAM_DIVISION.md          # Detailed work split for 2 team members
└── README.md
```

---

## ⚡ Power-Ups

| Power-Up | Icon | Effect |
|----------|------|--------|
| **Double** | ⚡ | Instantly applies the correct-answer effect twice |
| **Freeze** | ❄️ | Freezes opponent team for 5 seconds (answers don't count) |
| **Shield** | 🛡️ | Blocks the next enemy correct-answer effect |

Each player starts with 1 of each — use them wisely!

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Game Engine** | Phaser 3.80 (Arcade Physics) |
| **Frontend Build** | Vite 5 |
| **Realtime** | Socket.IO 4 |
| **Backend** | Node.js + Express |
| **Assets** | All generated programmatically (zero external files!) |
| **Deployment** | Vercel / Render / Glitch compatible |

---

## 🚢 Deployment

### Render / Railway
```bash
npm run build           # Builds client → client/dist/
npm start               # Starts server (serves built client)
```
Set the `PORT` env variable if needed. The server serves the built client from `client/dist/`.

---

## 🤝 Team: RunTime Terror

See [TEAM_DIVISION.md](TEAM_DIVISION.md) for the detailed work split between both team members.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the Git workflow and PR process.

---

## 📝 License

MIT — Built with ❤️ at Sibathon '26
