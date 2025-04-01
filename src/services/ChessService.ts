import { Chess } from 'chess.js';

class ChessService {
  private game: Chess;

  constructor() {
    this.game = new Chess();
  }

  getGame() {
    return this.game;
  }

  getFEN() {
    return this.game.fen();
  }

  getHistory() {
    return this.game.history();
  }

  isGameOver() {
    return this.game.isGameOver();
  }

  move(move: string) {
    // returns null if move is illegal
    return this.game.move(move);
  }

  reset() {
    this.game.reset();
  }
}

export default new ChessService();
