import { describe, it, expect } from 'vitest';
import { calculateOffset, validateBuzzTime, calculateBuzzTime } from './timeSync';

describe('timeSync', () => {
  describe('calculateOffset', () => {
    it('should calculate zero offset when clocks are perfectly in sync and latency is zero', () => {
      // client sent at 100, server saw at 100, client received at 100
      expect(calculateOffset(100, 100, 100)).toBe(0);
    });

    it('should calculate correct offset when client is ahead', () => {
      // client sent at 110, server saw at 100, client received at 110 (zero latency for simplicity)
      // offset should be -10 (client needs to subtract 10 to get server time)
      expect(calculateOffset(100, 110, 110)).toBe(-10);
    });

    it('should calculate correct offset when client is behind', () => {
      // client sent at 90, server saw at 100, client received at 90
      // offset should be +10
      expect(calculateOffset(100, 90, 90)).toBe(10);
    });

    it('should account for network latency', () => {
      // client sent at 100
      // server received at 150 (50ms latency)
      // server sent pong at 150
      // client received at 200 (50ms latency)
      // RTT = 100ms. Middle of trip is 150.
      // serverTime (150) - middle of trip (150) = 0 offset
      expect(calculateOffset(150, 100, 200)).toBe(0);
    });

    it('should account for latency and clock skew', () => {
      // Client is 1000ms behind server
      // client sent at 100 (server time 1100)
      // server received at 1150 (50ms latency)
      // client received at 250 (server time 1250)
      // RTT = 150ms? Wait.
      // clientSent = 100, clientReceived = 250. Mean = 175.
      // serverTime = 1150.
      // offset = 1150 - 175 = 975. 
      // Wait, if client is 1000ms behind, and latency is 50ms.
      // client 100 -> server 1150 (latency 50) -> client 250 (latency 50)
      // Actually if latency is 50ms:
      // client 100 (server 1100) -> server 1150.
      // server 1150 -> client 250 (server 1250).
      // (100 + 250) / 2 = 175.
      // 1150 - 175 = 975.
      // Wait, if client is 1000ms behind, offset should be 1000.
      // Let's re-verify:
      // Server is at 1100. Client is at 100.
      // Client sends at 100.
      // Server receives at 1150 (latency 50).
      // Server sends back 1150.
      // Client receives at 200. (server is at 1200, client is at 200).
      // (100 + 200) / 2 = 150.
      // 1150 - 150 = 1000. Correct!
      expect(calculateOffset(1150, 100, 200)).toBe(1000);
    });
  });

  describe('validateBuzzTime', () => {
    const openTime = 1000;
    const nowTime = 2000;

    it('should accept a buzz time between open and now', () => {
      expect(validateBuzzTime(1500, openTime, nowTime)).toBe(true);
    });

    it('should reject a buzz time before open', () => {
      expect(validateBuzzTime(900, openTime, nowTime)).toBe(false);
    });

    it('should accept a buzz slightly in the future of now', () => {
      expect(validateBuzzTime(2100, openTime, nowTime)).toBe(true);
    });

    it('should reject a buzz too far in the future', () => {
      expect(validateBuzzTime(4100, openTime, nowTime)).toBe(false);
    });

    it('should reject non-finite times', () => {
      expect(validateBuzzTime(NaN, openTime, nowTime)).toBe(false);
      expect(validateBuzzTime(Infinity, openTime, nowTime)).toBe(false);
    });
  });

  describe('calculateBuzzTime', () => {
    it('should calculate relative time correctly', () => {
      expect(calculateBuzzTime(1500, 1000)).toBe(0.5);
    });

    it('should round to 3 decimal places', () => {
      expect(calculateBuzzTime(1123.4567, 1000)).toBe(0.123);
      expect(calculateBuzzTime(1123.8888, 1000)).toBe(0.124);
    });
  });
});
