// Firebase Data Initialization Script
// You can run this in the browser console after setting up Firebase
// Or use it as reference to manually add players to Firestore

// Uncomment and use this if you want to manually initialize data
/*
import { collection, addDoc } from 'firebase/firestore';

const SAMPLE_PLAYERS = [
  // ... (copy the SAMPLE_PLAYERS array from App.jsx)
];

async function initializePlayersData(db) {
  console.log('Starting to initialize player data...');
  
  try {
    const playersCollection = collection(db, 'players');
    
    for (let i = 0; i < SAMPLE_PLAYERS.length; i++) {
      const player = SAMPLE_PLAYERS[i];
      await addDoc(playersCollection, player);
      console.log(`Added player ${i + 1}/${SAMPLE_PLAYERS.length}: ${player.name}`);
    }
    
    console.log('All players added successfully!');
  } catch (error) {
    console.error('Error adding players:', error);
  }
}

// Call this function with your db instance
// initializePlayersData(db);
*/

// Alternative: You can also manually add players through Firebase Console
// 1. Go to Firestore Database in Firebase Console
// 2. Create a 'players' collection
// 3. Add documents with the structure shown in README.md

console.log('Firebase initialization script loaded. Check comments for usage.');

export const firebaseDataSetup = {
  // Helper function to get player data for manual entry
  getPlayerData: () => {
    return [
      {
        name: "Lionel Messi",
        rating: 91,
        position: "RW",
        club: "Paris Saint-Germain",
        nation: "Argentina",
        pace: 85,
        shooting: 92,
        passing: 91,
        dribbling: 95,
        defending: 34,
        physicality: 65,
        isSold: false,
        imageUrl: "https://placehold.co/200x300/1f2937/ffffff?text=Messi"
      },
      // Add more players as needed...
    ];
  }
};