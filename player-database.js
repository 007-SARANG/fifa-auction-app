// FIFA 23 Player Database Loader
// This file helps you choose which player database to use in your auction app

// Import the different player databases
// Uncomment the one you want to use:

// Option 1: Complete database (1,721 players, 78+ rating)
// import ALL_PLAYERS from './all-fifa-players.js';

// Option 2: High quality only (300 players, 85+ rating) - RECOMMENDED FOR AUCTIONS
// import PLAYERS_85PLUS from './fifa-players-85plus.js';

// Option 3: Good quality (500 players, 82+ rating) - BALANCED OPTION
import PLAYERS_82PLUS from './fifa-players-82plus.js';

// Option 4: Decent quality (800 players, 80+ rating)
// import PLAYERS_80PLUS from './fifa-players-80plus.js';

// Export the selected database
export const FIFA_PLAYERS = PLAYERS_82PLUS;

// Database information
export const DATABASE_INFO = {
  name: "FIFA 23 Players (82+ Rating)",
  totalPlayers: 500,
  minRating: 82,
  maxRating: 98,
  description: "Balanced selection of good quality players for auctions"
};

// Alternative: Create a custom filtered database
export function getFilteredPlayers(minRating = 82, maxPlayers = 200, positions = null) {
  let filtered = FIFA_PLAYERS.filter(player => player.rating >= minRating);
  
  // Filter by positions if specified
  if (positions && positions.length > 0) {
    filtered = filtered.filter(player => positions.includes(player.position));
  }
  
  // Shuffle for variety
  filtered = filtered.sort(() => Math.random() - 0.5);
  
  // Limit number of players
  if (maxPlayers > 0) {
    filtered = filtered.slice(0, maxPlayers);
  }
  
  return filtered;
}

// Quick access functions
export function getTopPlayers(count = 50) {
  return FIFA_PLAYERS
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count);
}

export function getPlayersByPosition(position) {
  return FIFA_PLAYERS.filter(player => player.position === position);
}

export function getPlayersByNation(nation) {
  return FIFA_PLAYERS.filter(player => player.nation === nation);
}

export function getPlayersByClub(club) {
  return FIFA_PLAYERS.filter(player => player.club === club);
}

export function getRandomPlayers(count = 20) {
  const shuffled = [...FIFA_PLAYERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Usage examples:
/*
import { FIFA_PLAYERS, getTopPlayers, getFilteredPlayers } from './player-database.js';

// Use all players
const allPlayers = FIFA_PLAYERS;

// Get top 100 players
const topPlayers = getTopPlayers(100);

// Get strikers only, 85+ rating
const topStrikers = getFilteredPlayers(85, 50, ['ST', 'CF']);

// Get random selection for auction
const auctionPlayers = getRandomPlayers(30);
*/