const fs = require('fs');
const readline = require('readline');

async function convertMalePlayersCSV() {
  const players = [];
  const seenNames = new Set();
  
  const fileStream = fs.createReadStream('male_players.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let lineCount = 0;

  console.log('Starting to process male_players.csv...');
  console.log('This may take a few minutes due to the large file size...\n');

  for await (const line of rl) {
    lineCount++;
    
    // Skip header and empty lines
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    if (!line.trim()) continue;

    // Progress indicator
    if (lineCount % 50000 === 0) {
      console.log(`Processed ${lineCount} lines... Found ${players.length} players (78+ rating)`);
    }

    // Split by comma but handle quoted fields
    const values = line.split(',');
    
    // Extract essential fields for auction:
    // 5: short_name, 8: overall, 7: player_positions, 96: player_face_url
    // 41: pace, 42: shooting, 43: passing, 44: dribbling, 45: defending, 46: physic
    
    const shortName = values[5]?.trim() || '';
    const overall = parseInt(values[8]) || 0;
    const position = values[7]?.trim() || 'Unknown';
    const photoUrl = values[96]?.trim() || '';
    
    // Get key stats for display
    const pace = parseInt(values[41]) || 50;
    const shooting = parseInt(values[42]) || 50;
    const passing = parseInt(values[43]) || 50;
    const dribbling = parseInt(values[44]) || 50;
    const defending = parseInt(values[45]) || 50;
    const physic = parseInt(values[46]) || 50;

    // Only include players with 78+ rating (and valid FIFA 23 data)
    if (overall >= 78 && overall <= 99 && shortName) {
      
      // Skip duplicates
      if (seenNames.has(shortName)) {
        continue;
      }
      seenNames.add(shortName);

      // Player object with stats for auction display
      players.push({
        name: shortName,
        rating: overall,
        position: position.split(',')[0], // Take first position only
        imageUrl: photoUrl || `https://cdn.sofifa.net/players/default_player.png`,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physicality: physic,
        isSold: false
      });
    }
  }

  console.log(`\n✅ Processing complete!`);
  console.log(`Total lines processed: ${lineCount}`);
  console.log(`Total players extracted: ${players.length}`);

  // Count players by tier
  const premium = players.filter(p => p.rating >= 85).length;
  const regular = players.filter(p => p.rating >= 83 && p.rating < 85).length;
  const free = players.filter(p => p.rating >= 78 && p.rating < 83).length;

  console.log(`\nPlayer Distribution:`);
  console.log(`- Players 85+: ${premium}`);
  console.log(`- Players 83-84: ${regular}`);
  console.log(`- Players 78-82: ${free}`);

  // Sort by rating (highest first)
  players.sort((a, b) => b.rating - a.rating);

  // Generate the JavaScript file
  const output = `// FIFA 23 Official Male Players Database
// Generated from male_players.csv
// Total Players: ${players.length} (Rating 78+)
// Premium (85+): ${premium} | Regular (83-84): ${regular} | Free Picks (78-82): ${free}

const FIFA23_PLAYERS = ${JSON.stringify(players, null, 2)};

export default FIFA23_PLAYERS;
`;

  fs.writeFileSync('fifa23-players-official.js', output, 'utf8');
  console.log(`\n✅ Successfully created fifa23-players-official.js`);
  console.log(`File contains ${players.length} players with rating 78+\n`);
}

convertMalePlayersCSV().catch(console.error);
