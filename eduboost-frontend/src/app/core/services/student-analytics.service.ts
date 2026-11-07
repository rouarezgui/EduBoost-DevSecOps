import { Injectable } from '@angular/core';

export interface StudentAnalytics {
  score: number;
  progress: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

@Injectable({ providedIn: 'root' })
export class StudentAnalyticsService {
  calculate(results: any[] = [], progressRecords: any[] = []): StudentAnalytics {
    const scores = results
      .map(result => Number(result?.score))
      .filter(score => Number.isFinite(score));

    const progressScores = progressRecords
      .map(record => Number(record?.score))
      .filter(score => Number.isFinite(score));

    const score = this.average(scores);
    const progress = progressScores.length ? this.average(progressScores) : score;
    const errorPenalty = this.averageErrorPenalty(results);
    const riskScore = this.clamp(Math.round((100 - score) * 0.65 + (100 - progress) * 0.25 + errorPenalty), 0, 100);
    const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

    return {
      score,
      progress,
      riskScore,
      riskLevel,
      recommendation: this.recommendationFor(riskLevel, score, progress, results.length)
    };
  }

  calculateFromSingleQuiz(score: number, errors: number): StudentAnalytics {
    return this.calculate([{ score, errors }], [{ score, time: 0 }]);
  }

  recommendationFor(riskLevel: 'low' | 'medium' | 'high', score: number, progress: number, attempts: number): string {
    if (!attempts) {
      return 'Start with one short quiz to unlock a personalized recommendation.';
    }

    if (riskLevel === 'high') {
      return 'Review the core lesson, retake the quiz slowly, and focus first on the questions you missed.';
    }

    if (riskLevel === 'medium') {
      return score < progress
        ? 'Your progress is moving, but quiz accuracy needs practice. Do targeted exercises before the next attempt.'
        : 'You are close to a stable level. Review weak points and complete one more practice quiz.';
    }

    return 'Great work. Keep the rhythm and try a harder quiz or the next chapter.';
  }

  riskColor(riskLevel: string): string {
    if (riskLevel === 'high') return '#ef4444';
    if (riskLevel === 'medium') return '#f59e0b';
    return '#10b981';
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private averageErrorPenalty(results: any[]): number {
    const errors = results
      .map(result => Number(result?.errors))
      .filter(errorCount => Number.isFinite(errorCount));

    if (!errors.length) return 0;
    return Math.min(15, Math.round(errors.reduce((sum, value) => sum + value, 0) / errors.length) * 3);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
