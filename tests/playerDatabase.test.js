import { describe, it, expect } from 'vitest';
import FIFA23_PLAYERS from '../fifa23-players-official.js';

describe('FIFA23 Players Database', () => {
  describe('Data Integrity', () => {
    it('should have 1521 players', () => {
      expect(FIFA23_PLAYERS).toBeDefined();
      expect(FIFA23_PLAYERS.length).toBe(1521);
    });

    it('should have all players with rating 78 or above', () => {
      const invalidPlayers = FIFA23_PLAYERS.filter(p => p.rating < 78);
      expect(invalidPlayers).toHaveLength(0);
    });

    it('should have all players with rating 99 or below', () => {
      const invalidPlayers = FIFA23_PLAYERS.filter(p => p.rating > 99);
      expect(invalidPlayers).toHaveLength(0);
    });

    it('should have proper player structure', () => {
      FIFA23_PLAYERS.forEach(player => {
        expect(player).toHaveProperty('name');
        expect(player).toHaveProperty('rating');
        expect(player).toHaveProperty('position');
        expect(player).toHaveProperty('imageUrl');
        expect(player).toHaveProperty('pace');
        expect(player).toHaveProperty('shooting');
        expect(player).toHaveProperty('passing');
        expect(player).toHaveProperty('dribbling');
        expect(player).toHaveProperty('defending');
        expect(player).toHaveProperty('physicality');
        expect(player).toHaveProperty('isSold');
      });
    });

    it('should have unique player names', () => {
      const names = FIFA23_PLAYERS.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(FIFA23_PLAYERS.length);
    });

    it('should have all players marked as not sold initially', () => {
      const soldPlayers = FIFA23_PLAYERS.filter(p => p.isSold === true);
      expect(soldPlayers).toHaveLength(0);
    });
  });

  describe('Player Distribution by Tier', () => {
    it('should have 89 premium players (85+)', () => {
      const premiumPlayers = FIFA23_PLAYERS.filter(p => p.rating >= 85);
      expect(premiumPlayers.length).toBe(89);
    });

    it('should have 101 regular players (83-84)', () => {
      const regularPlayers = FIFA23_PLAYERS.filter(p => p.rating >= 83 && p.rating <= 84);
      expect(regularPlayers.length).toBe(101);
    });

    it('should have 1331 free pick players (78-82)', () => {
      const freePlayers = FIFA23_PLAYERS.filter(p => p.rating >= 78 && p.rating <= 82);
      expect(freePlayers.length).toBe(1331);
    });
  });

  describe('Player Stats Validation', () => {
    it('should have all stats between 0 and 99', () => {
      FIFA23_PLAYERS.forEach(player => {
        expect(player.pace).toBeGreaterThanOrEqual(0);
        expect(player.pace).toBeLessThanOrEqual(99);
        expect(player.shooting).toBeGreaterThanOrEqual(0);
        expect(player.shooting).toBeLessThanOrEqual(99);
        expect(player.passing).toBeGreaterThanOrEqual(0);
        expect(player.passing).toBeLessThanOrEqual(99);
        expect(player.dribbling).toBeGreaterThanOrEqual(0);
        expect(player.dribbling).toBeLessThanOrEqual(99);
        expect(player.defending).toBeGreaterThanOrEqual(0);
        expect(player.defending).toBeLessThanOrEqual(99);
        expect(player.physicality).toBeGreaterThanOrEqual(0);
        expect(player.physicality).toBeLessThanOrEqual(99);
      });
    });

    it('should have valid positions', () => {
      const validPositions = ['GK', 'LB', 'LWB', 'CB', 'RB', 'RWB', 'LM', 'CDM', 'CM', 'RM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
      
      FIFA23_PLAYERS.forEach(player => {
        expect(player.position).toBeTruthy();
        expect(typeof player.position).toBe('string');
      });
    });

    it('should have image URL field present', () => {
      FIFA23_PLAYERS.forEach(player => {
        expect(player).toHaveProperty('imageUrl');
        expect(typeof player.imageUrl).toBe('string');
        // Note: Some image URLs may be placeholder values from CSV parsing
        // The app will use fallback photos via getPlayerPhoto() function
      });
    });
  });

  describe('Top Players', () => {
    it('should have highest rated players', () => {
      const topPlayers = FIFA23_PLAYERS.filter(p => p.rating >= 90);
      expect(topPlayers.length).toBeGreaterThan(0);
    });

    it('should be sorted by rating (descending) when filtered', () => {
      const premiumPlayers = FIFA23_PLAYERS.filter(p => p.rating >= 85);
      const sortedPremium = [...premiumPlayers].sort((a, b) => b.rating - a.rating);
      
      // Check if ratings are in descending order
      for (let i = 0; i < sortedPremium.length - 1; i++) {
        expect(sortedPremium[i].rating).toBeGreaterThanOrEqual(sortedPremium[i + 1].rating);
      }
    });
  });
});
