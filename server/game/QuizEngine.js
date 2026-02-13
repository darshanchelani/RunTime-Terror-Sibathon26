// ============================================================
// QuizEngine — Loads & serves questions, tracks progress
// Shared across all 3 game modes
// ============================================================

const questions = require('./questions.json');

class QuizEngine {
  constructor() {
    this.questions = this._shuffle([...questions]);
    this.currentIndex = 0;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    const q = this.questions[this.currentIndex];
    // Safe version (no correctIndex sent to client)
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    };
  }

  getCurrentQuestionFull() {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  }

  advance() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      // Reshuffle and loop for endless play
      this.questions = this._shuffle([...questions]);
      this.currentIndex = 0;
    }
  }

  reset() {
    this.questions = this._shuffle([...questions]);
    this.currentIndex = 0;
  }
}

module.exports = { QuizEngine };
