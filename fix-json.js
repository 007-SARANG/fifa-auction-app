const fs = require('fs');

// Read the file
let content = fs.readFileSync('player_database.json', 'utf-8');

console.log('🔧 Fixing JSON syntax errors...');

// Replace all smart quotes with regular quotes
content = content
  .replace(/"/g, '"')   // Left double quote
  .replace(/"/g, '"')   // Right double quote
  .replace(/'/g, "'")   // Left single quote
  .replace(/'/g, "'");  // Right single quote

// Backup the original
fs.writeFileSync('player_database_backup.json', fs.readFileSync('player_database.json'));
console.log('💾 Original backed up as: player_database_backup.json');

// Write the fixed content
fs.writeFileSync('player_database.json', content, 'utf-8');
console.log('✅ Fixed player_database.json!');

// Try to parse it to verify it's valid JSON
try {
  const parsed = JSON.parse(content);
  const playerCount = Object.keys(parsed).length;
  console.log(`✅ Valid JSON! Found ${playerCount} players.`);
} catch (error) {
  console.error('❌ Still has JSON errors:', error.message);
}
