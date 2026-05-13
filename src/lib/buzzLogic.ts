export interface BuzzEntry {
  playerId: string;
  clientTime: number;
  receivedTime: number;
}

/**
 * Chooses the winner among players who buzzed in.
 * Selection criteria:
 * 1. Earliest clientTime (synchronized time)
 * 2. Earliest receivedTime (server arrival time) if clientTime is tied
 * 3. Random choice if both are tied
 */
export function chooseWinner(
  buzzOrder: BuzzEntry[],
  eliminated: Set<string>,
  randomIntFn: (max: number) => number
): BuzzEntry | null {
  const eligible = buzzOrder.filter((buzz) => !eliminated.has(buzz.playerId));
  if (!eligible.length) return null;

  let minT = Infinity;
  for (const b of eligible) {
    if (b.clientTime < minT) minT = b.clientTime;
  }
  
  const tier1 = eligible.filter((b) => b.clientTime === minT);
  if (tier1.length === 1) return tier1[0];

  let minR = Infinity;
  for (const b of tier1) {
    if (b.receivedTime < minR) minR = b.receivedTime;
  }
  
  const tier2 = tier1.filter((b) => b.receivedTime === minR);
  if (tier2.length === 1) return tier2[0];

  return tier2[randomIntFn(tier2.length)]!;
}
