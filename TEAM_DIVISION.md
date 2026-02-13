# 🧠 BattleBrains — Team Work Division

> **Team RunTime Terror** — 2 Members  
> This document defines exactly who owns what. Both members work in parallel on separate branches.

---

## 📋 Overview

| Area | Member 1 (Backend Lead) | Member 2 (Frontend Lead) |
|------|------------------------|-------------------------|
| **Focus** | Server, game logic, quiz engine, Socket.IO, API | Phaser scenes, UI, visuals, animations, touch input |
| **Branch** | `feature/backend` | `feature/frontend` |
| **Folder** | `server/` | `client/` |

---

## 👤 MEMBER 1 — Backend & Game Logic

### Primary Responsibilities

#### 1. Server Setup & Socket.IO (Day 1)
- [x] `server/index.js` — Express server + Socket.IO connection handling
- [x] Room creation, joining, disconnect cleanup
- [x] REST endpoint `/api/health`, `/api/rooms`
- [x] Socket events: `create-room`, `join-room`, `start-game`, `submit-answer`, `rematch`

#### 2. Game Room Engine (Day 1)
- [x] `server/game/GameRoom.js` — Full room state management
- [x] Player management (add, remove, switch team)
- [x] Mode-specific state initialization (tug-of-war, rocket-rush, catapult-clash)
- [x] Answer submission → game action mapping for all 3 modes
- [x] Win condition checking for all 3 modes
- [x] Round timer management
- [x] Game reset / rematch logic

#### 3. Quiz Engine (Day 1)
- [x] `server/game/QuizEngine.js` — Question shuffling, delivery, advancement
- [x] `server/game/questions.json` — 40 math + science questions
- [x] Safe question delivery (never send `correctIndex` to client)
- [ ] **STRETCH**: Add more question categories (GK, English)
- [ ] **STRETCH**: Difficulty progression within a game

#### 4. Power-Up System (Day 1–2)
- [x] `server/game/PowerUps.js` — Double, Freeze, Shield logic
- [x] Power-up consumption tracking per player
- [ ] **STRETCH**: Earn additional power-ups via streaks
- [ ] **STRETCH**: Add new power-ups (Time Bonus, Swap, Steal)

#### 5. Online Multiplayer Polish (Day 2)
- [ ] Reconnection handling (player disconnects mid-game)
- [ ] Spectator mode
- [ ] Room list / matchmaking
- [ ] Rate limiting (prevent answer spamming)
- [ ] Game history / leaderboard persistence (MongoDB/JSON file)

#### 6. Deployment (Day 2)
- [ ] Configure for Render / Railway deployment
- [ ] Environment variables setup
- [ ] Production build serving (`client/dist/`)
- [ ] WebSocket transport optimization

### Files Owned by Member 1
```
server/
├── index.js
├── game/
│   ├── GameRoom.js
│   ├── QuizEngine.js
│   ├── PowerUps.js
│   └── questions.json
└── utils/
    └── roomCodes.js
```

### Git Commits (Suggested Order)
```
1. feat(server): add Express + Socket.IO server with room management
2. feat(server): add GameRoom with state management for 3 modes
3. feat(server): add QuizEngine with 40 shuffled questions
4. feat(server): add power-up system (double, freeze, shield)
5. feat(server): add timer and round progression
6. fix(server): handle edge cases (disconnect, empty rooms, answer validation)
7. feat(server): deployment config and production build serving
```

---

## 👤 MEMBER 2 — Frontend & Phaser Game

### Primary Responsibilities

#### 1. Client Setup & Boot (Day 1)
- [x] `client/index.html` — Loading screen with spinner
- [x] `client/vite.config.js` — Vite with proxy to server
- [x] `client/src/main.js` — Phaser 3 game config
- [x] `client/src/config.js` — Shared constants (colors, keys, fonts)
- [x] `client/src/scenes/BootScene.js` — Generate ALL textures programmatically

#### 2. Network Layer (Day 1)
- [x] `client/src/network/SocketManager.js` — Socket.IO client singleton
- [x] Connect, create room, join room, submit answer, power-up events

#### 3. Lobby Scene (Day 1)
- [x] `client/src/scenes/LobbyScene.js` — Full lobby UI
- [x] Mode selection (3 game modes)
- [x] Player name input
- [x] Create room / join room with code
- [x] Waiting room panel with team display
- [x] Start game button

#### 4. Game Mode Scenes (Day 1–2)
- [x] `client/src/scenes/TugOfWarScene.js`
  - [x] Rope visual with segments and knot marker
  - [x] Team characters on either side
  - [x] Rope pull animation based on server state
  - [x] Mud pit, center line, pull counter
  - [x] Camera shake + particle effects on pulls
  - [x] Freeze visual effect
- [x] `client/src/scenes/RocketRushScene.js`
  - [x] Two rockets on vertical tracks
  - [x] Starfield background with twinkling stars
  - [x] Rocket boost animation (tween + particles)
  - [x] Exhaust flame particles (fire trail)
  - [x] Altitude percentage display
  - [x] Finish line at top
- [x] `client/src/scenes/CatapultClashScene.js`
  - [x] Two castles with towers, battlements, flags
  - [x] Health bars with color change at low HP
  - [x] Boulder launch animation (parabolic arc)
  - [x] Impact particles + castle shake on hit
  - [x] Floating damage numbers
  - [x] Catapult visuals
  - [x] Shot counter

#### 5. UI Components (Day 1)
- [x] `client/src/ui/QuestionOverlay.js`
  - [x] Question text + 4 option buttons
  - [x] Keyboard hint labels (Q/W/E/R for Red, U/I/O/P for Blue)
  - [x] Touch + keyboard input handling
  - [x] Correct/Wrong visual feedback
- [x] `client/src/ui/HUD.js` — Floating score text, power-up notifications
- [x] `client/src/ui/PowerUpBar.js` — Touch power-up buttons for both teams

#### 6. Win Scene (Day 1)
- [x] `client/src/scenes/WinScene.js`
  - [x] Victory announcement with team color
  - [x] Score summary panel
  - [x] Mode-specific stats
  - [x] Confetti celebration particles
  - [x] Quick Rematch button
  - [x] Back to Lobby button
  - [x] Keyboard shortcuts (R = rematch, ESC = lobby)

#### 7. Polish & Juice (Day 2)
- [ ] Sound effects (use Phaser's WebAudio or HTML5 Audio)
- [ ] Screen transitions (fade in/out between scenes)
- [ ] More elaborate particle effects
- [ ] Responsive sizing for different screen sizes
- [ ] Mobile-specific touch layouts
- [ ] Accessibility (larger buttons, high contrast)

### Files Owned by Member 2
```
client/
├── index.html
├── vite.config.js
└── src/
    ├── main.js
    ├── config.js
    ├── network/
    │   └── SocketManager.js
    ├── scenes/
    │   ├── BootScene.js
    │   ├── LobbyScene.js
    │   ├── TugOfWarScene.js
    │   ├── RocketRushScene.js
    │   ├── CatapultClashScene.js
    │   └── WinScene.js
    └── ui/
        ├── QuestionOverlay.js
        ├── HUD.js
        └── PowerUpBar.js
```

### Git Commits (Suggested Order)
```
1. feat(client): Phaser 3 setup with Vite, config, and BootScene assets
2. feat(client): add SocketManager for server communication
3. feat(client): LobbyScene with room creation and team joining
4. feat(client): QuestionOverlay UI with keyboard + touch input
5. feat(client): TugOfWarScene with rope, pulls, and effects
6. feat(client): RocketRushScene with rockets, exhaust, and boost effects
7. feat(client): CatapultClashScene with castles, boulders, and health
8. feat(client): WinScene with celebration and rematch
9. feat(client): PowerUpBar and HUD components
10. polish(client): add visual effects, transitions, and responsive sizing
```

---

## 🔀 Shared / Both Members

These files are jointly owned — discuss changes before editing:

| File | Notes |
|------|-------|
| `package.json` (root) | Both may update scripts |
| `README.md` | Update together before submission |
| `CONTRIBUTING.md` | Agree on workflow once |
| `.gitignore` | Usually stable |
| `config.js` | If server & client need shared constants, sync up |

---

## 📅 Timeline (48-hour Hackathon)

### Day 1 (Hours 1–12): Core MVP
| Hour | Member 1 (Backend) | Member 2 (Frontend) |
|------|--------------------|--------------------|
| 1–2 | Server + Socket.IO setup | Phaser boot + Vite setup |
| 2–4 | GameRoom + QuizEngine | Lobby scene + SocketManager |
| 4–6 | Answer handling + all 3 modes | Tug-of-War scene visuals |
| 6–8 | Power-up system + timer | QuestionOverlay + keyboard |
| 8–10 | Testing & bug fixes | Rocket Rush + Catapult scenes |
| 10–12 | Reconnection / edge cases | Win scene + HUD + PowerUpBar |

### Day 2 (Hours 12–24): Polish & Deploy
| Hour | Member 1 (Backend) | Member 2 (Frontend) |
|------|--------------------|--------------------|
| 12–14 | More questions + difficulty | Visual polish + particles |
| 14–16 | Leaderboard / history | Sound effects + transitions |
| 16–18 | Deploy to Render | Touch optimization |
| 18–20 | Load testing | Responsive design |
| 20–24 | Final merge + bug bash | Final merge + bug bash |

---

## 🔧 Git Workflow

1. Both start from `main` branch
2. Member 1 creates `feature/backend`, Member 2 creates `feature/frontend`
3. Work independently — no file conflicts (server vs client folders)
4. Merge to `main` via Pull Requests
5. Test together after each merge
6. Tag releases: `v0.1` (MVP), `v0.2` (polish), `v1.0` (final)

```bash
# Member 1
git checkout -b feature/backend
# ... work on server/ ...
git add server/
git commit -m "feat(server): add GameRoom with 3 mode support"
git push origin feature/backend
# Create PR → merge to main

# Member 2
git checkout -b feature/frontend
# ... work on client/ ...
git add client/
git commit -m "feat(client): add TugOfWarScene with rope physics"
git push origin feature/frontend
# Create PR → merge to main
```

---

## ✅ Definition of Done (MVP Checklist)

- [ ] All 3 game modes playable end-to-end
- [ ] Single-device keyboard multiplayer works
- [ ] Online multiplayer works (2 browser tabs)
- [ ] 40 questions cycling correctly
- [ ] Power-ups work in all modes
- [ ] Win screen shows with correct winner
- [ ] Rematch works
- [ ] Touch input works on tablet/phone
- [ ] No console errors in normal gameplay
- [ ] Deployed to a public URL
