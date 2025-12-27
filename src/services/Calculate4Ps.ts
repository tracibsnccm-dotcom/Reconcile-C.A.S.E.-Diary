export interface DiaryEntry {
  id: string;
  date: string;
  scores: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  notes: {
    physical: string;
    psychological: string;
    psychosocial: string;
    professional: string;
  };
}

export interface ScoringResult {
  overallScore: number;
  breakdown: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  recommendations: string[];
}

export function calculate4Ps(entry: DiaryEntry): ScoringResult {
  const total = entry.scores.physical + entry.scores.psychological + entry.scores.psychosocial + entry.scores.professional;
  const average = total / 4;
  const overallScore = (average / 5) * 100;

  return {
    overallScore,
    breakdown: {
      physical: (entry.scores.physical / 5) * 100,
      psychological: (entry.scores.psychological / 5) * 100,
      psychosocial: (entry.scores.psychosocial / 5) * 100,
      professional: (entry.scores.professional / 5) * 100,
    },
    recommendations: []
  };
}