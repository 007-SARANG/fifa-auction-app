// Script to clear all auction rooms and user data from Firebase
// Run this in the browser console to clean up all existing data

// Instructions:
// 1. Open your FIFA Auction App in browser at http://localhost:3000
// 2. Open browser console (F12)
// 3. Copy and paste this entire script
// 4. Press Enter to execute

(async function clearFirebaseData() {
  console.log('🔄 Starting Firebase data cleanup...');
  
  try {
    // Get Firebase instances from the app
    const { db } = window;
    
    if (!db) {
      console.error('❌ Firebase not initialized. Make sure the app is running.');
      return;
    }
    
    const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    
    // Clear all auctions
    console.log('🗑️ Deleting all auction rooms...');
    const auctionsSnapshot = await getDocs(collection(db, 'auctions'));
    let auctionCount = 0;
    for (const auctionDoc of auctionsSnapshot.docs) {
      await deleteDoc(doc(db, 'auctions', auctionDoc.id));
      auctionCount++;
      console.log(`  Deleted auction: ${auctionDoc.id}`);
    }
    console.log(`✅ Deleted ${auctionCount} auction rooms`);
    
    // Clear all user auction room associations
    console.log('🗑️ Clearing user auction associations...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let userCount = 0;
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.auctionRoomId) {
        await deleteDoc(doc(db, 'users', userDoc.id));
        userCount++;
        console.log(`  Cleared user: ${userData.name || userDoc.id}`);
      }
    }
    console.log(`✅ Cleared ${userCount} user associations`);
    
    console.log('✅ Firebase cleanup complete!');
    console.log('🔄 Please refresh the page to see the clean state.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
})();

// Alternative: Simple manual cleanup commands
// Run these one by one in console if the script above doesn't work:
/*
// 1. Get all auctions
const auctionsSnapshot = await getDocs(collection(db, 'auctions'));
auctionsSnapshot.docs.forEach(async (doc) => {
  await deleteDoc(doc.ref);
  console.log('Deleted auction:', doc.id);
});

// 2. Get all users
const usersSnapshot = await getDocs(collection(db, 'users'));
usersSnapshot.docs.forEach(async (doc) => {
  await deleteDoc(doc.ref);
  console.log('Deleted user:', doc.id);
});
*/
