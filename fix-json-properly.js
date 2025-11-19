const fs = require('fs');

// Read the file
let content = fs.readFileSync('player_database.json', 'utf-8');

console.log('🔧 Fixing JSON properly...');

// Replace all smart quotes with regular quotes first
content = content
  .replace(/"/g, '"')   // Left double quote
  .replace(/"/g, '"')   // Right double quote
  .replace(/'/g, "'")   // Left single quote
  .replace(/'/g, "'");  // Right single quote

// Now fix quotes inside JSON string values
// Find all string values and escape quotes within them
content = content.replace(/"([^"]*)":\s*"([^"]*)"/g, (match, key, value) => {
  // Don't touch the keys, but escape any unescaped quotes in values
  const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
  return `"${key}": "${fixedValue}"`;
});

// Write the fixed content
fs.writeFileSync('player_database_fixed.json', content, 'utf-8');
console.log('✅ Fixed file saved as: player_database_fixed.json');

// Try to parse it to verify it's valid JSON
try {
  const parsed = JSON.parse(content);
  const playerCount = Object.keys(parsed).length;
  console.log(`✅ Valid JSON! Found ${playerCount} players.`);
  
  // If valid, replace the original
  fs.writeFileSync('player_database.json', content, 'utf-8');
  console.log('✅ Original file updated!');
} catch (error) {
  console.error('❌ Still has JSON errors:', error.message);
  console.log('Check player_database_fixed.json for partial fixes');
}
