export interface BuzzEntry {
  playerId: string;
  /**
   * Estimated press time on a common clock. The server computes this as
   * `receivedTime - estimatedOneWayLatency`, where one-way latency comes
   * from the minimum RTT observed for the socket. Named `clientTime` for
   * back-compat with the older protocol that trusted client timestamps.
   */
  clientTime: number;
  /** Server clock time when the BUZZ message was received. */
  receivedTime: number;
}

/**
 * Chooses the winner among players who buzzed in.
 * Selection criteria:
 * 1. Earliest estimated press time (clientTime field)
 * 2. Earliest receivedTime if estimated press times are tied
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
