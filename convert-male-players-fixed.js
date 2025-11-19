const fs = require('fs');
const csv = require('csv-parser');

async function convertMalePlayersCSVProperly() {
  const players = [];
  const seenNames = new Set();
  
  console.log('Starting to process male_players.csv with proper CSV parser...');
  console.log('This may take a few minutes due to the large file size (5.6GB)...\n');

  let lineCount = 0;
  let processedCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream('male_players.csv')
      .pipe(csv())
      .on('data', (row) => {
        lineCount++;
        
        // Progress indicator
        if (lineCount % 50000 === 0) {
          console.log(`Processed ${lineCount} lines... Found ${players.length} players (78+ rating)`);
        }

        // Extract fields using the proper column names from CSV header
        const shortName = row.short_name?.trim() || '';
        const overall = parseInt(row.overall) || 0;
        const position = row.player_positions?.trim() || 'Unknown';
        const photoUrl = row.player_face_url?.trim() || '';
        
        // Get REAL stats from the CSV
        const pace = parseInt(row.pace) || 50;
        const shooting = parseInt(row.shooting) || 50;
        const passing = parseInt(row.passing) || 50;
        const dribbling = parseInt(row.dribbling) || 50;
        const defending = parseInt(row.defending) || 50;
        const physic = parseInt(row.physic) || 50;

        // Only include players with 78+ rating
        if (overall >= 78 && overall <= 99 && shortName) {
          
          // Skip duplicates
          if (seenNames.has(shortName)) {
            return;
          }
          seenNames.add(shortName);

          players.push({
            name: shortName,
            rating: overall,
            position: position.split(',')[0].trim(), // Take first position only
            imageUrl: photoUrl || 'https://cdn.sofifa.net/players/default_player.png',
            pace,
            shooting,
            passing,
            dribbling,
            defending,
            physicality: physic,
            isSold: false
          });
          processedCount++;
        }
      })
      .on('end', () => {
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
        console.log(`File contains ${players.length} players with REAL stats from FIFA 23!\n`);
        
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

convertMalePlayersCSVProperly().catch(console.error);
