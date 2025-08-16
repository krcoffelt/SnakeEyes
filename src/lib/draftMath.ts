/**
 * Calculate the round number for a given overall pick
 */
export function calculateRound(overallPick: number, teams: number): number {
  return Math.ceil(overallPick / teams);
}

/**
 * Calculate the overall pick number for a user's pick in a given round
 * Implements the snake draft formula
 */
export function userPickOverall(round: number, slot: number, teams: number): number {
  if (round % 2 === 1) {
    // Odd rounds: ascending order
    return (round - 1) * teams + slot;
  } else {
    // Even rounds: descending order
    return round * teams - (slot - 1);
  }
}

/**
 * Calculate the next pick for the user
 */
export function nextUserPick(overallNow: number, slot: number, teams: number): number {
  const currentRound = calculateRound(overallNow, teams);
  
  // Check if there's a pick in the current round
  const pickInCurrentRound = userPickOverall(currentRound, slot, teams);
  if (pickInCurrentRound >= overallNow) {
    return pickInCurrentRound;
  }
  
  // Otherwise, return the pick in the next round
  return userPickOverall(currentRound + 1, slot, teams);
}

/**
 * Calculate the next two picks for the user
 */
export function nextTwoUserPicks(overallNow: number, slot: number, teams: number): [number, number] {
  const first = nextUserPick(overallNow, slot, teams);
  const second = nextUserPick(first + 1, slot, teams);
  return [first, second];
}

/**
 * Calculate how many picks until the user's next turn
 */
export function picksUntilYou(overallNow: number, slot: number, teams: number): number {
  const nextPick = nextUserPick(overallNow, slot, teams);
  return nextPick - overallNow;
}

/**
 * Calculate the overall pick number for the current position in the draft
 */
export function getCurrentOverallPick(draftedCount: number): number {
  return draftedCount + 1;
}

/**
 * Calculate the round and pick position for a given overall pick
 */
export function getRoundAndPick(overallPick: number, teams: number): { round: number; pickInRound: number } {
  const round = calculateRound(overallPick, teams);
  const pickInRound = ((overallPick - 1) % teams) + 1;
  return { round, pickInRound };
}

/**
 * Check if a pick is in the first half of a round (ascending order)
 */
export function isFirstHalfOfRound(overallPick: number, teams: number): boolean {
  const { round, pickInRound } = getRoundAndPick(overallPick, teams);
  return round % 2 === 1 ? pickInRound <= Math.ceil(teams / 2) : pickInRound > Math.ceil(teams / 2);
} 