/**
 * Calculates the clock offset between client and server.
 * Formula: offset = serverTime - (clientSentTime + clientReceivedTime) / 2
 * This accounts for network latency by assuming symmetric travel time.
 */
export function calculateOffset(serverTime: number, clientSentTime: number, clientReceivedTime: number): number {
  return serverTime - (clientSentTime + clientReceivedTime) / 2;
}

/**
 * Validates if a buzz time is within acceptable bounds.
 * @param clientTime The client-reported synchronized time of the buzz.
 * @param serverOpenTime The server time when the buzzer was opened.
 * @param serverNowTime The current server time.
 * @returns true if valid, false otherwise.
 */
export function validateBuzzTime(clientTime: number, serverOpenTime: number, serverNowTime: number): boolean {
  if (!Number.isFinite(clientTime)) return false;
  
  // Cannot buzz before the buzzer was opened
  if (clientTime < serverOpenTime) return false;
  
  // Cannot buzz too far in the future (sanity check, allows for some clock skew/jitter)
  if (clientTime > serverNowTime + 2000) return false;
  
  return true;
}

/**
 * Calculates the relative buzz time in seconds, rounded to 3 decimal places.
 */
export function calculateBuzzTime(clientTime: number, serverOpenTime: number): number {
  const timeSec = (clientTime - serverOpenTime) / 1000;
  return Math.round(timeSec * 1000) / 1000;
}
