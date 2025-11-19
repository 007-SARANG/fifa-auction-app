// Fix JSON syntax errors (smart quotes) in player_database.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the file
let content = fs.readFileSync(
  path.join(__dirname, 'player_database.json'),
  'utf-8'
);

console.log('🔧 Fixing JSON syntax errors...');

// Replace all smart quotes with regular quotes
content = content
  .replace(/"/g, '"')   // Left double quote
  .replace(/"/g, '"')   // Right double quote
  .replace(/'/g, "'")   // Left single quote
  .replace(/'/g, "'");  // Right single quote

// Write the fixed content to a new file
fs.writeFileSync(
  path.join(__dirname, 'player_database_fixed.json'),
  content,
  'utf-8'
);

console.log('✅ Fixed file saved as: player_database_fixed.json');

// Try to parse it to verify it's valid JSON
try {
  const parsed = JSON.parse(content);
  const playerCount = Object.keys(parsed).length;
  console.log(`✅ Valid JSON! Found ${playerCount} players.`);
  
  // Also backup the original
  fs.copyFileSync(
    path.join(__dirname, 'player_database.json'),
    path.join(__dirname, 'player_database_backup.json')
  );
  console.log('💾 Original backed up as: player_database_backup.json');
  
  // Replace the original with the fixed version
  fs.writeFileSync(
    path.join(__dirname, 'player_database.json'),
    content,
    'utf-8'
  );
  console.log('✅ Original file updated with fixes!');
  
} catch (error) {
  console.error('❌ Still has JSON errors:', error.message);
  console.log('Check player_database_fixed.json manually');
}
