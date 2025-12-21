export class ScoreService {
  private score: number = 0;

  getScore(): number {
    return this.score;
  }

  updateScore(change: number): void {
    this.score += change;
  }

  resetScore(): void {
    this.score = 0;
  }
}
