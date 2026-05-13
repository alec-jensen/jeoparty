import { describe, it, expect, vi } from 'vitest';
import { chooseWinner, type BuzzEntry } from './buzzLogic';

describe('chooseWinner', () => {
  const eliminated = new Set<string>();
  const mockRandomInt = (max: number) => 0;

  it('should return null when buzzOrder is empty', () => {
    expect(chooseWinner([], eliminated, mockRandomInt)).toBeNull();
  });

  it('should choose the player with the earliest clientTime', () => {
    const buzzOrder: BuzzEntry[] = [
      { playerId: 'p1', clientTime: 1000, receivedTime: 2000 },
      { playerId: 'p2', clientTime: 500, receivedTime: 2500 },
      { playerId: 'p3', clientTime: 1500, receivedTime: 1800 },
    ];
    const winner = chooseWinner(buzzOrder, eliminated, mockRandomInt);
    expect(winner?.playerId).toBe('p2');
  });

  it('should choose the player with earliest receivedTime if clientTime is tied', () => {
    const buzzOrder: BuzzEntry[] = [
      { playerId: 'p1', clientTime: 1000, receivedTime: 2000 },
      { playerId: 'p2', clientTime: 1000, receivedTime: 1500 },
      { playerId: 'p3', clientTime: 1000, receivedTime: 1800 },
    ];
    const winner = chooseWinner(buzzOrder, eliminated, mockRandomInt);
    expect(winner?.playerId).toBe('p2');
  });

  it('should use random selection if both clientTime and receivedTime are tied', () => {
    const buzzOrder: BuzzEntry[] = [
      { playerId: 'p1', clientTime: 1000, receivedTime: 2000 },
      { playerId: 'p2', clientTime: 1000, receivedTime: 2000 },
    ];
    
    const winner0 = chooseWinner(buzzOrder, eliminated, () => 0);
    expect(winner0?.playerId).toBe('p1');

    const winner1 = chooseWinner(buzzOrder, eliminated, () => 1);
    expect(winner1?.playerId).toBe('p2');
  });

  it('should ignore eliminated players', () => {
    const buzzOrder: BuzzEntry[] = [
      { playerId: 'p1', clientTime: 500, receivedTime: 2000 },
      { playerId: 'p2', clientTime: 1000, receivedTime: 1500 },
    ];
    const eliminatedPlayers = new Set(['p1']);
    const winner = chooseWinner(buzzOrder, eliminatedPlayers, mockRandomInt);
    expect(winner?.playerId).toBe('p2');
  });

  it('should return null if all players are eliminated', () => {
    const buzzOrder: BuzzEntry[] = [
      { playerId: 'p1', clientTime: 500, receivedTime: 2000 },
    ];
    const eliminatedPlayers = new Set(['p1']);
    expect(chooseWinner(buzzOrder, eliminatedPlayers, mockRandomInt)).toBeNull();
  });
});
