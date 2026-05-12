export type Rank = {
  emoji: string;
  title: string;
  minScore: number;
  maxScore: number | null;
};

export const RANKS: Rank[] = [
  { emoji: '💤', title: 'Uyuyan Saf',     minScore: 0,    maxScore: 99 },
  { emoji: '🧎', title: 'Ön Saf Adayı',  minScore: 100,  maxScore: 299 },
  { emoji: '📿', title: 'Tesbih Çeken',   minScore: 300,  maxScore: 599 },
  { emoji: '🕌', title: 'Cami Yıldızı',   minScore: 600,  maxScore: 999 },
  { emoji: '🎙️', title: 'Ezan Ustası',   minScore: 1000, maxScore: 1499 },
  { emoji: '📖', title: 'Fetva Makinesi', minScore: 1500, maxScore: 2499 },
  { emoji: '👑', title: 'Namaz Efsanesi', minScore: 2500, maxScore: null },
];

export function getRank(score: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) return RANKS[i];
  }
  return RANKS[0];
}

export function getRankProgress(score: number): {
  rank: Rank;
  next: Rank | null;
  percent: number;
  remaining: number;
} {
  const rank = getRank(score);
  const idx = RANKS.indexOf(rank);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;

  if (!next) {
    return { rank, next: null, percent: 1, remaining: 0 };
  }

  const range = next.minScore - rank.minScore;
  const progress = score - rank.minScore;
  return {
    rank,
    next,
    percent: Math.min(progress / range, 1),
    remaining: next.minScore - score,
  };
}
