// Convert player_database.json to the format used by the app
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the player database JSON
const playerDatabase = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'player_database.json'), 'utf-8')
);

// Convert to array format with proper structure
const playersArray = Object.entries(playerDatabase).map(([key, player]) => {
  // Extract stats from the top_stats string
  const stats = {};
  if (player.top_stats) {
    const statMatches = player.top_stats.match(/(\w+(?:\s+\w+)?): (\d+)/g);
    if (statMatches) {
      statMatches.forEach(match => {
        const [statName, value] = match.split(':').map(s => s.trim());
        stats[statName] = parseInt(value);
      });
    }
  }

  return {
    name: player.name,
    rating: player.ovr || 0,
    position: player.position || 'N/A',
    team: player.team || 'Unknown',
    basePrice: player.base_price || 1000000,
    specialities: player.specialities || '',
    topStats: player.top_stats || '',
    whyGetThem: player.why_get_them || '',
    tacticalSignificance: player.tactical_significance || '',
    isSold: false,
    currentPrice: player.base_price || 1000000,
    
    // Individual stats (extracted from top_stats, with defaults)
    pace: stats['Pace'] || 70,
    shooting: stats['Finishing'] || stats['Shooting'] || 70,
    passing: stats['Passing'] || stats['Vision'] || 70,
    dribbling: stats['Dribbling'] || stats['Ball Control'] || 70,
    defending: stats['Defending'] || stats['Def. Awareness'] || 50,
    physicality: stats['Physical'] || stats['Strength'] || stats['Stamina'] || 70,
    
    // Image URL placeholder (will use default images)
    imageUrl: `https://cdn.sofifa.net/players/default.png`
  };
});

// Sort by rating (descending)
playersArray.sort((a, b) => b.rating - a.rating);

// Create the export file
const outputContent = `// FIFA Player Database - Converted from player_database.json
// Total Players: ${playersArray.length}
// Last Updated: ${new Date().toISOString().split('T')[0]}

const PLAYER_DATABASE = ${JSON.stringify(playersArray, null, 2)};

export default PLAYER_DATABASE;
`;

// Write to file
fs.writeFileSync(
  path.join(__dirname, 'player-database-new.js'),
  outputContent,
  'utf-8'
);

console.log(`✅ Successfully converted ${playersArray.length} players!`);
console.log(`📝 Output file: player-database-new.js`);

// Print some stats
const ratingGroups = {
  '90+': playersArray.filter(p => p.rating >= 90).length,
  '85-89': playersArray.filter(p => p.rating >= 85 && p.rating < 90).length,
  '80-84': playersArray.filter(p => p.rating >= 80 && p.rating < 85).length,
  'Below 80': playersArray.filter(p => p.rating < 80).length
};

console.log('\n📊 Rating Distribution:');
console.log(ratingGroups);
