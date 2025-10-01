// FIFA 23 Player Photo Sources and Integration Guide

// ========== PHOTO SOURCE OPTIONS ==========

// 1. EA SPORTS OFFICIAL IMAGES
// Base URL patterns for EA Sports player images:
const EA_IMAGE_PATTERNS = {
  // FIFA 23 Card Images (if available)
  cards: "https://www.ea.com/fifa/ultimate-team/web-app/content/fifa23/img/players/",
  // Legacy FIFA images
  legacy: "https://www.easports.com/fifa/ultimate-team/api/fut/item?id=",
  // FIFA Mobile images
  mobile: "https://renderz.app/image-cdn/player/"
};

// 2. FUTBIN IMAGES (Popular FIFA Database)
const FUTBIN_BASE = "https://cdn.futbin.com/content/fifa23/img/players/";
// Example: https://cdn.futbin.com/content/fifa23/img/players/158023.png

// 3. FUTWIZ IMAGES
const FUTWIZ_BASE = "https://www.futwiz.com/assets/img/fifa23/faces/";
// Example: https://www.futwiz.com/assets/img/fifa23/faces/158023.png

// 4. FIFA INDEX IMAGES
const FIFA_INDEX_BASE = "https://www.fifaindex.com/static/FIFA23/";

// ========== PHOTO INTEGRATION METHODS ==========

// Method 1: Use Player ID mapping (if available in CSV)
function getPlayerImageByID(playerId) {
  // Try multiple sources with fallbacks
  const sources = [
    `https://cdn.futbin.com/content/fifa23/img/players/${playerId}.png`,
    `https://www.futwiz.com/assets/img/fifa23/faces/${playerId}.png`,
    `https://renderz.app/image-cdn/player/${playerId}.png`
  ];
  
  return sources[0]; // Primary source
}

// Method 2: Use name-based image search
function getPlayerImageByName(playerName) {
  // Format name for URL
  const formattedName = playerName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `https://img.a.transfermarkt.technology/portrait/header/${formattedName}.jpg`;
}

// Method 3: Use FIFA Render API (Community)
function getRenderZImage(playerId) {
  return `https://renderz.app/image-cdn/player/${playerId}/normal`;
}

// Method 4: Transfermarkt images (Real photos)
function getTransfermarktImage(playerName) {
  // Transfermarkt uses real player photos
  const name = playerName.toLowerCase().replace(/\s+/g, '-');
  return `https://img.a.transfermarkt.technology/portrait/header/default.jpg`;
}

// ========== RECOMMENDED IMPLEMENTATION ==========

// Best approach: Try multiple sources with fallbacks
function getPlayerPhoto(player) {
  const { name, rating } = player;
  
  // Primary: Try FIFA community databases
  const sources = [
    // High quality renders
    `https://renderz.app/image-cdn/player/${name.replace(/\s+/g, '-').toLowerCase()}/normal`,
    // Futbin database
    `https://cdn.futbin.com/content/fifa23/img/players/${name.replace(/\s+/g, '-').toLowerCase()}.png`,
    // Backup: Generated avatar
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1f2937&color=ffffff&format=png`,
    // Final fallback: Our placeholder
    `https://placehold.co/200x300/1f2937/ffffff?text=${encodeURIComponent(name.split(' ')[0])}`
  ];
  
  return sources[0];
}

// ========== PHOTO VALIDATION ==========

// Function to check if image exists and fallback if not
function getValidPlayerImage(player, callback) {
  const sources = [
    `https://renderz.app/image-cdn/player/${player.name.replace(/\s+/g, '-').toLowerCase()}/normal`,
    `https://cdn.futbin.com/content/fifa23/img/players/${player.name.replace(/\s+/g, '-').toLowerCase()}.png`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=200&background=1f2937&color=ffffff&format=png`
  ];
  
  let currentIndex = 0;
  
  function tryNext() {
    if (currentIndex >= sources.length) {
      // All sources failed, use final fallback
      callback(`https://placehold.co/200x300/1f2937/ffffff?text=${encodeURIComponent(player.name.split(' ')[0])}`);
      return;
    }
    
    const img = new Image();
    img.onload = () => callback(sources[currentIndex]);
    img.onerror = () => {
      currentIndex++;
      tryNext();
    };
    img.src = sources[currentIndex];
  }
  
  tryNext();
}

// ========== BATCH PHOTO UPDATER ==========

// Function to update all players with photos
async function updatePlayersWithPhotos(players) {
  const updatedPlayers = await Promise.all(
    players.map(async (player) => {
      return new Promise((resolve) => {
        getValidPlayerImage(player, (imageUrl) => {
          resolve({
            ...player,
            imageUrl: imageUrl
          });
        });
      });
    })
  );
  
  return updatedPlayers;
}

// ========== USAGE EXAMPLES ==========

// Example 1: Direct URL generation
const messiPhoto = getPlayerPhoto({ name: "Lionel Messi", rating: 91 });
console.log("Messi photo URL:", messiPhoto);

// Example 2: With validation
getValidPlayerImage({ name: "Lionel Messi" }, (url) => {
  console.log("Validated Messi photo:", url);
});

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPlayerPhoto,
    getValidPlayerImage,
    updatePlayersWithPhotos,
    getPlayerImageByName,
    getRenderZImage
  };
}

// ========== RECOMMENDED SOURCES (October 2025) ==========

/*
BEST FREE SOURCES:
1. RenderZ.app - High quality FIFA renders
2. UI-Avatars.com - Generated avatars with names
3. Futbin.com - FIFA player database images
4. Transfermarkt - Real player photos

PAID SOURCES:
1. EA Sports API - Official images (requires licensing)
2. Getty Images - Professional sports photos
3. Sports data providers

IMPLEMENTATION TIPS:
1. Always have fallbacks
2. Cache images locally if possible
3. Use loading states while images load
4. Consider using a CDN for better performance
*/