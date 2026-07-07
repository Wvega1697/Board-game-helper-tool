/**
 * 7 Wonders Architects — Pure scoring logic.
 */

export function calculateFinalScore({
  stagesConstructed = 0,
  wonderPoints = 0,
  hasCatPawn = false,
  bluePoints = 0,
  blueCatIcons = 0,
  militaryTokens = 0,
  progressTokens = 0,
  hasDecor = false,
  hasPolitics = false,
  hasStrategy = false,
  hasEducation = false,
  cultureTokens = 0
}) {
  // Military: 3 VP per token, +1 VP per token if Strategy
  const militaryVP = militaryTokens * (hasStrategy ? 4 : 3);

  let score = wonderPoints + bluePoints + militaryVP;
  if (hasCatPawn) score += 2;

  if (hasDecor) score += stagesConstructed === 5 ? 6 : 4;
  if (hasPolitics) score += blueCatIcons;
  if (hasEducation) score += (progressTokens * 2);

  if (cultureTokens === 1) score += 4;
  else if (cultureTokens >= 2) score += 12;

  return score;
}

export function checkWinner(players) {
  if (!players || players.length === 0) return [];
  
  const maxScore = Math.max(...players.map(p => p.totalScore));
  let winners = players.filter(p => p.totalScore === maxScore);
  
  if (winners.length > 1) {
    // Tiebreaker: most stages constructed
    const maxStages = Math.max(...winners.map(w => w.stagesConstructed));
    winners = winners.filter(w => w.stagesConstructed === maxStages);
  }
  
  return winners.map(w => w.name);
}
