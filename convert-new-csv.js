// Convert new FIFA 23 CSV to JavaScript player database
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'CLEAN_FIFA23_official_data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

const players = [];
const seenPlayers = new Set(); // To track unique players

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line (handle commas in quotes)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  // Extract relevant fields
  const name = values[2];
  const overall = parseInt(values[7]) || 0;
  const position = values[21];
  const club = values[9];
  const nationality = values[5];
  const photo = values[4];
  
  // Only include players with rating 78+
  if (overall < 78) continue;
  
  // Skip duplicates (same name)
  if (seenPlayers.has(name)) continue;
  seenPlayers.add(name);
  
  // Create player object
  const player = {
    name: name,
    rating: overall,
    position: position || 'SUB',
    club: club || 'Free Agent',
    nation: nationality || 'Unknown',
    imageUrl: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`,
    pace: Math.floor(Math.random() * 30) + 60, // Placeholder stats
    shooting: Math.floor(Math.random() * 30) + 60,
    passing: Math.floor(Math.random() * 30) + 60,
    dribbling: Math.floor(Math.random() * 30) + 60,
    defending: Math.floor(Math.random() * 30) + 60,
    physicality: Math.floor(Math.random() * 30) + 60,
    isSold: false
  };
  
  players.push(player);
}

// Sort by rating (highest first)
players.sort((a, b) => b.rating - a.rating);

console.log(`Total players extracted: ${players.length}`);
console.log(`Players 85+: ${players.filter(p => p.rating >= 85).length}`);
console.log(`Players 83-84: ${players.filter(p => p.rating >= 83 && p.rating < 85).length}`);
console.log(`Players 78-82: ${players.filter(p => p.rating >= 78 && p.rating < 83).length}`);

// Generate JavaScript file
const jsContent = `// FIFA 23 Official Player Database (${players.length} players, 78+ rating)
// Generated from CLEAN_FIFA23_official_data.csv

const FIFA23_PLAYERS = ${JSON.stringify(players, null, 2)};

export default FIFA23_PLAYERS;
`;

// Write to file
const outputPath = path.join(__dirname, 'fifa23-players-official.js');
fs.writeFileSync(outputPath, jsContent);

console.log(`\nPlayer database saved to: fifa23-players-official.js`);
console.log('Ready to use in the app!');
