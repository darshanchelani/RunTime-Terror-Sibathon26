// ============================================================
// GameRoom — Core server-side room + game-state manager
// Manages players, teams, quiz state, scoring, and win logic
// for all 3 game modes (tug-of-war, rocket-rush, catapult-clash)
// ============================================================

const { QuizEngine } = require('./QuizEngine');
const { PowerUpManager } = require('./PowerUps');

class GameRoom {
  constructor(code, mode, io) {
    this.code = code;
    this.mode = mode; // 'tug-of-war' | 'rocket-rush' | 'catapult-clash'
    this.io = io;
    this.status = 'waiting'; // waiting | playing | finished
    this.players = new Map(); // socketId → { id, name, team, score, powerUps }
    this.quiz = new QuizEngine();
    this.powerUpManager = new PowerUpManager();
    this.gameTimer = null;
    this.gameDuration = 100; // 100 seconds total game time
    this.timeLeft = 100;
    this.currentRound = 0;
    this.answeredThisRound = new Set(); // tracks which teams answered this round
    this.wrongAnswerTimeout = null; // 5s delay when both teams answer wrong
    this._pendingAdvance = false; // prevents double question advance
    this.teamScores = { red: 0, blue: 0 }; // direct team-level scoring (fixes single-device mode)

    // Mode-specific state
    this.state = this._initState();
  }

  _initState() {
    switch (this.mode) {
      case 'tug-of-war':
        return {
          ropePosition: 0,        // -100 (red wins) to +100 (blue wins); 0 = center
          pullStrength: 8,        // how much each correct answer pulls
          mudThreshold: 100,      // rope pos needed to win
          redPulls: 0,
          bluePulls: 0
        };
      case 'rocket-rush':
        return {
          redAltitude: 0,         // 0 to 100 (finish line)
          blueAltitude: 0,
          boostAmount: 8,
          finishLine: 100,
          redSpeed: 0,
          blueSpeed: 0
        };
      case 'catapult-clash':
        return {
          redHealth: 100,
          blueHealth: 100,
          damage: 12,             // damage per correct hit
          redShots: 0,
          blueShots: 0,
          lastHit: null
        };
      default:
        return {};
    }
  }

  // ── Player Management ──────────────────────────────────────

  addPlayer(socketId, name, team) {
    const player = {
      id: socketId,
      name: name || `Player${this.players.size + 1}`,
      team,
      score: 0,
      streak: 0,
      powerUps: ['double', 'freeze', 'shield'] // starting power-ups
    };
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  getTeamPlayers(team) {
    const list = [];
    this.players.forEach(p => { if (p.team === team) list.push(p); });
    return list;
  }

  getSmallestTeam() {
    const red = this.getTeamPlayers('red').length;
    const blue = this.getTeamPlayers('blue').length;
    return red <= blue ? 'red' : 'blue';
  }

  switchPlayerTeam(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;
    player.team = player.team === 'red' ? 'blue' : 'red';
    return player.team;
  }

  // ── Game Flow ──────────────────────────────────────────────

  startGame() {
    this.status = 'playing';
    this.state = this._initState();
    this.quiz.reset();
    this.currentRound = 1;
    this.timeLeft = this.gameDuration;
    this.answeredThisRound = new Set();
    this._pendingAdvance = false;
    this._correctThisRound = false;
    this.teamScores = { red: 0, blue: 0 };
    this.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.powerUps = ['double', 'freeze', 'shield'];
    });
  }

  reset() {
    this.status = 'playing';
    this.state = this._initState();
    this.quiz.reset();
    this.currentRound = 1;
    this.timeLeft = this.gameDuration;
    this.answeredThisRound = new Set();
    this._pendingAdvance = false;
    this._correctThisRound = false;
    this.teamScores = { red: 0, blue: 0 };
    this.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.powerUps = ['double', 'freeze', 'shield'];
    });
  }

  resetRoundAnswers() {
    this.answeredThisRound = new Set();
  }

  hasTeamAnswered(team) {
    return this.answeredThisRound.has(team);
  }

  isRoundComplete() {
    return this.answeredThisRound.has('red') && this.answeredThisRound.has('blue');
  }

  advanceRound() {
    this.currentRound++;
    this.resetRoundAnswers();
    this.quiz.advance();
  }

  // Check if any correct answer was given this round
  hasCorrectAnswerThisRound() {
    return this._correctThisRound === true;
  }

  markCorrectThisRound() {
    this._correctThisRound = true;
  }

  resetCorrectThisRound() {
    this._correctThisRound = false;
  }

  getCurrentQuestion() {
    const q = this.quiz.getCurrentQuestion();
    if (!q) return null;
    // Never send correct answer to client
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      timeLeft: this.timeLeft
    };
  }

  nextQuestion() {
    this.quiz.advance();
  }

  getState() {
    return {
      mode: this.mode,
      status: this.status,
      ...this.state,
      scores: {
        red: this._teamScore('red'),
        blue: this._teamScore('blue')
      },
      teamRed: this.getTeamPlayers('red'),
      teamBlue: this.getTeamPlayers('blue'),
      questionIndex: this.quiz.currentIndex,
      totalQuestions: this.quiz.questions.length,
      currentRound: this.currentRound,
      timeLeft: this.timeLeft,
      gameDuration: this.gameDuration,
      answeredTeams: Array.from(this.answeredThisRound)
    };
  }

  _teamScore(team) {
    // Use team-level scores (works correctly in single-device mode)
    return this.teamScores[team] || 0;
  }

  // ── Answer Handling ────────────────────────────────────────

  submitAnswer(socketId, answerIndex, team) {
    const player = this.players.get(socketId);
    if (!player) return { correct: false, action: null, rejected: true };

    // Use provided team (for single-device mode) or player's own team
    const answeringTeam = team || player.team;

    // Prevent same team from answering twice per round
    if (this.answeredThisRound.has(answeringTeam)) {
      return { correct: false, action: null, rejected: true, reason: 'Team already answered this round' };
    }

    const q = this.quiz.getCurrentQuestionFull();
    if (!q) return { correct: false, action: null, rejected: true };

    // Mark this team as having answered
    this.answeredThisRound.add(answeringTeam);

    const correct = answerIndex === q.correctIndex;
    let action = null;
    let pointsEarned = 0;

    if (correct) {
      player.streak++;
      pointsEarned = 10 + (player.streak > 3 ? 5 : 0); // streak bonus
      player.score += pointsEarned;
      // Track score at team level (fixes single-device mode where one player answers for both teams)
      this.teamScores[answeringTeam] = (this.teamScores[answeringTeam] || 0) + pointsEarned;
      action = this._applyCorrectAnswer(answeringTeam);
    } else {
      player.streak = 0;
      action = { type: 'wrong', description: 'Incorrect!' };
    }

    return {
      correct,
      correctAnswer: q.options[q.correctIndex],
      action,
      team: answeringTeam,
      playerName: player.name,
      pointsEarned,
      rejected: false
    };
  }

  _applyCorrectAnswer(team) {
    switch (this.mode) {
      case 'tug-of-war': {
        const pull = this.state.pullStrength;
        if (team === 'red') {
          this.state.ropePosition -= pull; // red pulls left (negative)
          this.state.redPulls++;
        } else {
          this.state.ropePosition += pull; // blue pulls right (positive)
          this.state.bluePulls++;
        }
        // Clamp
        this.state.ropePosition = Math.max(-this.state.mudThreshold,
          Math.min(this.state.mudThreshold, this.state.ropePosition));
        return { type: 'pull', team, position: this.state.ropePosition };
      }

      case 'rocket-rush': {
        const boost = this.state.boostAmount;
        if (team === 'red') {
          this.state.redAltitude = Math.min(this.state.finishLine, this.state.redAltitude + boost);
          this.state.redSpeed = boost;
        } else {
          this.state.blueAltitude = Math.min(this.state.finishLine, this.state.blueAltitude + boost);
          this.state.blueSpeed = boost;
        }
        return { type: 'boost', team, altitude: team === 'red' ? this.state.redAltitude : this.state.blueAltitude };
      }

      case 'catapult-clash': {
        const dmg = this.state.damage;
        if (team === 'red') {
          this.state.blueHealth = Math.max(0, this.state.blueHealth - dmg);
          this.state.redShots++;
        } else {
          this.state.redHealth = Math.max(0, this.state.redHealth - dmg);
          this.state.blueShots++;
        }
        this.state.lastHit = { attacker: team, damage: dmg };
        return { type: 'hit', team, damage: dmg };
      }

      default:
        return null;
    }
  }

  // ── Win Conditions ─────────────────────────────────────────

  checkWinCondition() {
    switch (this.mode) {
      case 'tug-of-war':
        return Math.abs(this.state.ropePosition) >= this.state.mudThreshold;
      case 'rocket-rush':
        return this.state.redAltitude >= this.state.finishLine ||
               this.state.blueAltitude >= this.state.finishLine;
      case 'catapult-clash':
        return this.state.redHealth <= 0 || this.state.blueHealth <= 0;
      default:
        return false;
    }
  }

  getWinner() {
    switch (this.mode) {
      case 'tug-of-war':
        if (this.state.ropePosition <= -this.state.mudThreshold) return 'red';
        if (this.state.ropePosition >= this.state.mudThreshold) return 'blue';
        // Tie-breaker: use rope position direction, then pulls count, then scores
        if (this.state.ropePosition < 0) return 'red';
        if (this.state.ropePosition > 0) return 'blue';
        if (this.state.redPulls !== this.state.bluePulls) {
          return this.state.redPulls > this.state.bluePulls ? 'red' : 'blue';
        }
        return (this.teamScores.red || 0) >= (this.teamScores.blue || 0) ? 'red' : 'blue';
      case 'rocket-rush':
        if (this.state.redAltitude >= this.state.finishLine) return 'red';
        if (this.state.blueAltitude >= this.state.finishLine) return 'blue';
        if (this.state.redAltitude !== this.state.blueAltitude) {
          return this.state.redAltitude > this.state.blueAltitude ? 'red' : 'blue';
        }
        return (this.teamScores.red || 0) >= (this.teamScores.blue || 0) ? 'red' : 'blue';
      case 'catapult-clash':
        if (this.state.blueHealth <= 0) return 'red';
        if (this.state.redHealth <= 0) return 'blue';
        if (this.state.redHealth !== this.state.blueHealth) {
          return this.state.redHealth > this.state.blueHealth ? 'red' : 'blue';
        }
        return (this.teamScores.red || 0) >= (this.teamScores.blue || 0) ? 'red' : 'blue';
      default:
        return 'red';
    }
  }

  // ── Power-Ups ──────────────────────────────────────────────

  usePowerUp(socketId, type) {
    const player = this.players.get(socketId);
    if (!player) return { success: false, reason: 'Player not found' };

    const idx = player.powerUps.indexOf(type);
    if (idx === -1) return { success: false, reason: 'Power-up not available' };

    // Consume the power-up
    player.powerUps.splice(idx, 1);

    const effect = this.powerUpManager.activate(type, player.team, this.state, this.mode);
    return { success: true, team: player.team, effect };
  }

  // ── Timer ──────────────────────────────────────────────────

  startGameTimer(onTick, onComplete) {
    this.stopTimer();
    this.timeLeft = this.gameDuration;

    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      onTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.stopTimer();
        onComplete();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    this.clearWrongAnswerTimeout();
  }

  setWrongAnswerTimeout(callback, delayMs) {
    this.clearWrongAnswerTimeout();
    this.wrongAnswerTimeout = setTimeout(callback, delayMs);
  }

  clearWrongAnswerTimeout() {
    if (this.wrongAnswerTimeout) {
      clearTimeout(this.wrongAnswerTimeout);
      this.wrongAnswerTimeout = null;
    }
  }
}

module.exports = { GameRoom };
