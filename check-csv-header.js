const fs = require('fs');
const readline = require('readline');

async function checkHeader() {
  const fileStream = fs.createReadStream('male_players.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    console.log(`Line ${lineCount + 1}: ${line}`);
    lineCount++;
    if (lineCount >= 3) break; // Only read first 3 lines
  }
}

checkHeader().catch(console.error);
