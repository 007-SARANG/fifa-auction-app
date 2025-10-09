import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  setDoc,
  orderBy,
  limit,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase configuration - Your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDccc5koLXNLXxUAtt-CyEodbWomFSbbmc",
  authDomain: "fifa-auction-app.firebaseapp.com",
  databaseURL: "https://fifa-auction-app-default-rtdb.firebaseio.com",
  projectId: "fifa-auction-app",
  storageBucket: "fifa-auction-app.firebasestorage.app",
  messagingSenderId: "364660306221",
  appId: "1:364660306221:web:fed415bd6807d2dd7c63a4",
  measurementId: "G-YG6VQ0C7EJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Import the official FIFA 23 male players database (1,521 players, 78+ rating)
import ALL_FIFA_PLAYERS from './fifa23-players-official.js';

// Real player photo mapping for better images
const PLAYER_PHOTO_MAP = {
  "Lionel Messi": "https://renderz.app/image-cdn/player/158023/normal",
  "Kylian Mbappé": "https://renderz.app/image-cdn/player/231747/normal", 
  "Robert Lewandowski": "https://renderz.app/image-cdn/player/188545/normal",
  "Erling Haaland": "https://renderz.app/image-cdn/player/239085/normal",
  "Kevin De Bruyne": "https://renderz.app/image-cdn/player/192985/normal",
  "Karim Benzema": "https://renderz.app/image-cdn/player/165153/normal",
  "Luka Modrić": "https://renderz.app/image-cdn/player/177003/normal",
  "Cristiano Ronaldo": "https://renderz.app/image-cdn/player/20801/normal",
  "Neymar Jr": "https://renderz.app/image-cdn/player/190871/normal",
  "Mohamed Salah": "https://renderz.app/image-cdn/player/209331/normal",
  "Virgil van Dijk": "https://renderz.app/image-cdn/player/203376/normal",
  "Sadio Mané": "https://renderz.app/image-cdn/player/208722/normal",
  "Harry Kane": "https://renderz.app/image-cdn/player/202126/normal",
  "Son Heung-min": "https://renderz.app/image-cdn/player/200104/normal",
  "Casemiro": "https://renderz.app/image-cdn/player/182521/normal",
  "N'Golo Kanté": "https://renderz.app/image-cdn/player/215914/normal",
  "Joshua Kimmich": "https://renderz.app/image-cdn/player/212622/normal",
  "Alisson": "https://renderz.app/image-cdn/player/212198/normal",
  "Thibaut Courtois": "https://renderz.app/image-cdn/player/192119/normal",
  "Vinicius Jr.": "https://renderz.app/image-cdn/player/238794/normal",
  "Pedri": "https://renderz.app/image-cdn/player/251854/normal",
  "Jude Bellingham": "https://renderz.app/image-cdn/player/252371/normal",
  "Phil Foden": "https://renderz.app/image-cdn/player/237692/normal",
  "Bruno Fernandes": "https://renderz.app/image-cdn/player/212198/normal",
  "Marcus Rashford": "https://renderz.app/image-cdn/player/231677/normal",
  "Jamal Musiala": "https://renderz.app/image-cdn/player/256630/normal",
  "Gianluigi Donnarumma": "https://renderz.app/image-cdn/player/230621/normal",
  "Rúben Dias": "https://renderz.app/image-cdn/player/239818/normal",
  "Marquinhos": "https://renderz.app/image-cdn/player/207865/normal"
};

// Helper function to get player photo with fallbacks
function getPlayerPhoto(playerName) {
  // Check if we have a specific high-quality photo
  if (PLAYER_PHOTO_MAP[playerName]) {
    return PLAYER_PHOTO_MAP[playerName];
  }
  
  // Format name for image URL
  const cleanName = playerName
    .toLowerCase()
    .replace(/[áàâäãå]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôöõ]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  // Try multiple sources
  const sources = [
    `https://cdn.futbin.com/content/fifa23/img/players/big/${cleanName}.png`,
    `https://renderz.app/image-cdn/player/${cleanName}/normal`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`,
    `https://placehold.co/200x300/1f2937/ffffff?text=${encodeURIComponent(playerName.split(' ')[0])}`
  ];
  
  return sources[0]; // Return primary source
}

// Use the official FIFA 23 male players database (1,521 players, 78+ rating)
// Distribution: 89 premium (85+), 101 regular (83-84), 1,331 free picks (78-82)
const SAMPLE_PLAYERS = ALL_FIFA_PLAYERS.map(player => ({
  ...player,
  imageUrl: player.imageUrl || getPlayerPhoto(player.name) // Use official photo or fallback
}));

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [auction, setAuction] = useState(null);
  const [users, setUsers] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [timer, setTimer] = useState(0);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  // New states for auction rooms and user setup
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState('');
  const [showAuctionMenu, setShowAuctionMenu] = useState(true);
  const [auctionRoomId, setAuctionRoomId] = useState(null);
  const [auctionRooms, setAuctionRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [initialBudget, setInitialBudget] = useState(1000);
  
  // New states for logs and team view
  const [activityLogs, setActivityLogs] = useState([]);
  const [showTeamView, setShowTeamView] = useState(false);
  const [showLogsView, setShowLogsView] = useState(false);
  
  // Auction phase tracking
  const [currentPhase, setCurrentPhase] = useState('premium'); // 'premium' (85+), 'regular' (83-85), 'free' (78-82)
  
  // Ref to prevent auth listener interference when leaving room (using ref to avoid useEffect re-triggering)
  const isLeavingRoomRef = useRef(false);
  
  // Super admin mode - gives full control over all auctions
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Firebase quota warning
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);

  // Initialize sample data - OPTIMIZED: Only add players when auction starts
  const initializeSampleData = useCallback(async () => {
    if (dataInitialized) return;
    
    try {
      // SKIP uploading all 1,521 players to Firebase
      // Players will be added dynamically during auction to save quota
      console.log(`FIFA 23 player database loaded: ${SAMPLE_PLAYERS.length} players available`);

      setDataInitialized(true);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, [dataInitialized]);

  // Authentication and user setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Skip auth check if user is intentionally leaving room
        if (isLeavingRoomRef.current) {
          console.log('Skipping auth check - user is leaving room');
          return;
        }
        
        try {
          // Check if user exists in database
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDocs(query(collection(db, 'users')));
          
          let existingUserData = null;
          userSnap.forEach((doc) => {
            if (doc.id === user.uid) {
              existingUserData = { id: doc.id, ...doc.data() };
            }
          });
          
          if (!existingUserData) {
            // New user - show name input
            console.log('New user detected, showing name input');
            setShowNameInput(true);
            setShowAuctionMenu(false);
          } else {
            // Existing user - restore session
            console.log('Existing user found, restoring session:', existingUserData);
            setCurrentUser(existingUserData);
            
            // Don't update online status frequently to save quota
            // await updateDoc(userRef, { isOnline: true, lastSeen: Date.now() });
            
            if (existingUserData.auctionRoomId) {
              // User was in an auction room - restore to that room
              console.log('Restoring user to auction room:', existingUserData.auctionRoomId);
              setAuctionRoomId(existingUserData.auctionRoomId);
              setShowAuctionMenu(false);
              setShowNameInput(false);
              await initializeSampleData();
            } else {
              // User exists but not in any room - show auction menu
              console.log('User exists but no active room, showing auction menu');
              setShowAuctionMenu(true);
              setShowNameInput(false);
            }
          }
        } catch (error) {
          console.error('Error checking user data:', error);
          
          // Check for Firebase quota errors
          if (error.code === 'resource-exhausted' || (error.message && error.message.includes('Quota exceeded'))) {
            setShowQuotaWarning(true);
            setError('⚠️ Firebase quota exceeded! Your free plan limits have been reached.');
          }
          
          // Fallback to name input if there's an error
          setShowNameInput(true);
        }
      } else {
        // Sign in anonymously
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Authentication error:', error);
          setError('Failed to authenticate. Please refresh the page.');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // OPTIMIZATION: Removed online status tracking to save writes
  // Users don't need real-time online/offline status for this app
  // This saves 2-4 writes per user session

  // OPTIMIZATION: Load activity logs only when modal is open
  useEffect(() => {
    if (!auctionRoomId || !showLogsView) return;

    const loadLogs = async () => {
      try {
        const logsQuery = query(
          collection(db, 'activityLogs'),
          where('auctionRoomId', '==', auctionRoomId),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logsData = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActivityLogs(logsData);
      } catch (error) {
        console.error('Error loading logs:', error);
        if (error.code === 'resource-exhausted') {
          console.warn('Quota exceeded on logs load');
        }
      }
    };

    loadLogs();
  }, [auctionRoomId, showLogsView]);

  // Real-time listeners
  useEffect(() => {
    if (!user || !auctionRoomId) return;

    // Listen to current user data
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUser({ id: doc.id, ...doc.data() });
      }
    });

    // Listen to auction state for this room
    const unsubscribeAuction = onSnapshot(doc(db, 'auctions', auctionRoomId), (doc) => {
      if (doc.exists()) {
        const auctionData = doc.data();
        setAuction(auctionData);
        setTimer(auctionData.timer || 0);
      }
    });

    // Listen to users in this auction room
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), where('auctionRoomId', '==', auctionRoomId)),
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
        
        // Check if user is admin (room creator OR first to join)
        const sortedUsers = usersData.sort((a, b) => a.joinedAt - b.joinedAt);
        const isUserAdmin = (auction?.createdBy === user.uid) || 
                           (sortedUsers.length > 0 && sortedUsers[0].id === user.uid);
        console.log('Admin check:', {
          userUid: user.uid,
          roomCreator: auction?.createdBy,
          firstJoiner: sortedUsers[0]?.id,
          isAdmin: isUserAdmin
        });
        setIsAdmin(isUserAdmin);
      }
    );

    // OPTIMIZATION: Don't listen to activity logs here - only load when viewing
    // This saves constant reads. Load logs on-demand when user opens logs modal.

    return () => {
      unsubscribeUser();
      unsubscribeAuction();
      unsubscribeUsers();
    };
  }, [user, auctionRoomId]);

  // Timer countdown - OPTIMIZED: Local timer, sync only every 5 seconds
  useEffect(() => {
    if (timer > 0 && auction?.status === 'bidding' && auctionRoomId && isAdmin) {
      let localTimer = timer;
      let syncCounter = 0;
      
      const interval = setInterval(async () => {
        localTimer--;
        syncCounter++;
        setTimer(localTimer);
        
        // OPTIMIZATION: Only sync to Firebase every 5 seconds instead of every second
        // This reduces writes by 80% (1 write per 5 seconds instead of 1 per second)
        if (syncCounter % 5 === 0 || localTimer === 0) {
          try {
            const auctionRef = doc(db, 'auctions', auctionRoomId);
            await updateDoc(auctionRef, { timer: localTimer });
          } catch (error) {
            console.error('Timer sync error:', error);
            if (error.code === 'resource-exhausted') {
              console.warn('Quota exceeded on timer sync');
            }
          }
        }
        
        // End auction when timer reaches 0
        if (localTimer === 0) {
          clearInterval(interval);
          await endAuction();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, auction?.status, auctionRoomId, isAdmin]);

  // User setup functions
  const submitUserName = async () => {
    if (!userName.trim()) {
      showError('Please enter your name');
      return;
    }
    
    if (!user) {
      showError('Authentication required. Please refresh the page.');
      return;
    }
    
    try {
      // Reset the leaving room flag if it's still set
      if (isLeavingRoomRef.current) {
        isLeavingRoomRef.current = false;
        console.log('Reset isLeavingRoom flag');
      }
      
      const userRef = doc(db, 'users', user.uid);
      
      if (currentUser) {
        // Updating existing user's name
        await updateDoc(userRef, {
          name: userName.trim()
        });
        
        setCurrentUser({
          ...currentUser,
          name: userName.trim()
        });
      } else {
        // New user - create document (OPTIMIZED: removed isOnline field)
        await setDoc(userRef, {
          name: userName.trim(),
          budget: initialBudget,
          team: [],
          joinedAt: Date.now(),
          auctionRoomId: null
        });
        
        setCurrentUser({
          id: user.uid,
          name: userName.trim(),
          budget: initialBudget,
          team: [],
          joinedAt: Date.now(),
          auctionRoomId: null
        });
      }
      
      setShowNameInput(false);
      setShowAuctionMenu(true);
      setUserName(''); // Clear the input
      showSuccess(`Name ${currentUser ? 'updated' : 'saved'} successfully!`);
    } catch (error) {
      console.error('Error saving user name:', error);
      
      // Check for Firebase quota errors
      if (error.code === 'resource-exhausted' || error.message.includes('Quota exceeded')) {
        showError('⚠️ Firebase quota exceeded! Please upgrade your plan or wait 24 hours. For now, use Local Storage mode.');
      } else if (error.code === 'unavailable') {
        showError('Firebase is temporarily unavailable. Please try again in a moment.');
      } else {
        showError('Failed to save name: ' + error.message);
      }
    }
  };

  // Utility function to add activity logs (with throttling)
  const addActivityLog = async (type, message, playerName = null, amount = null, userId = null, userName = null) => {
    // Only log important events to reduce writes
    const importantEvents = ['purchase', 'auction_start', 'phase_change'];
    if (!importantEvents.includes(type)) {
      return; // Skip non-important logs
    }
    
    try {
      await addDoc(collection(db, 'activityLogs'), {
        type,
        message,
        playerName,
        amount,
        userId,
        userName,
        auctionRoomId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error adding activity log:', error);
      // Don't throw error, just log it
    }
  };

  // Auction phase utility functions
  const getAuctionPhase = (rating) => {
    if (rating >= 85) return 'premium';
    if (rating >= 83) return 'regular';
    return 'free';
  };

  const getBasePrice = (rating) => {
    if (rating >= 85) return 50; // 50M for 85+ players
    if (rating >= 83) return 30; // 30M for 83-85 players
    return 0; // Free picks for 78-82 players
  };

  const getPhaseDescription = (phase) => {
    switch (phase) {
      case 'premium': return '85+ Premium Players (Base: 50M)';
      case 'regular': return '83-85 Regular Players (Base: 30M)';
      case 'free': return '78-82 Free Picks (Base: 0M)';
      default: return 'Unknown Phase';
    }
  };

  const getAvailablePlayersForPhase = async (phase) => {
    // Use local player data instead of Firebase to save quota
    const availablePlayers = [];
    
    // Get list of sold players from auction state
    const soldPlayerNames = new Set();
    if (auction?.soldPlayers) {
      auction.soldPlayers.forEach(p => soldPlayerNames.add(p.name));
    }
    
    // Filter players by phase and sold status
    SAMPLE_PLAYERS.forEach((player) => {
      const playerPhase = getAuctionPhase(player.rating);
      
      if (playerPhase === phase && player.rating >= 78 && !soldPlayerNames.has(player.name)) {
        availablePlayers.push({ ...player });
      }
    });
    
    // Sort players by rating in descending order (highest to lowest)
    availablePlayers.sort((a, b) => b.rating - a.rating);
    
    return availablePlayers;
  };

  // Auction room functions
  const createAuctionRoom = async () => {
    if (!newRoomName.trim()) {
      showError('Please enter a room name');
      return;
    }
    
    if (!initialBudget || initialBudget < 100) {
      showError('Initial budget must be at least 100M');
      return;
    }
    
    if (!currentUser) {
      showError('Please enter your name first');
      return;
    }
    
    try {
      const roomId = 'room_' + Date.now();
      const roomRef = doc(db, 'auctions', roomId);
      
      await setDoc(roomRef, {
        roomName: newRoomName.trim(),
        createdBy: user.uid,
        createdAt: Date.now(),
        currentPlayer: null,
        currentBid: 0,
        highestBidder: null,
        bidders: [],
        foldedUsers: [],
        status: 'waiting',
        timer: 0,
        isComplete: false,
        initialBudget: initialBudget,
        currentPhase: 'premium', // Start with premium players (85+)
        soldPlayers: [] // Track sold players locally instead of Firebase
      });
      
      // Create or update user document to join this room
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: currentUser.name,
        auctionRoomId: roomId,
        budget: initialBudget,
        team: [],
        joinedAt: Date.now()
      }, { merge: true });
      
      setAuctionRoomId(roomId);
      setShowAuctionMenu(false);
      setIsAdmin(true);
      await initializeSampleData();
      
      showSuccess(`Created room: ${newRoomName.trim()}`);
      setNewRoomName('');
      setInitialBudget(1000);
    } catch (error) {
      console.error('Error creating room:', error);
      showError('Failed to create room: ' + error.message);
    }
  };

  const joinAuctionRoom = async (room) => {
    try {
      if (!room || !room.id) {
        showError('Invalid room');
        return;
      }
      
      if (room.isComplete) {
        showError('This auction is already complete');
        return;
      }
      
      if (!currentUser) {
        showError('Please enter your name first');
        return;
      }
      
      // Create or update user document to join this room
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: currentUser.name,
        auctionRoomId: room.id,
        budget: room.initialBudget || 1000,
        team: [],
        joinedAt: Date.now()
      }, { merge: true });
      
      setAuctionRoomId(room.id);
      setShowAuctionMenu(false);
      await initializeSampleData();
      
      showSuccess(`Joined auction room: ${room.roomName}!`);
    } catch (error) {
      console.error('Error joining room:', error);
      showError('Failed to join room: ' + error.message);
    }
  };

  const leaveAuctionRoom = async () => {
    if (!user || !currentUser) {
      showError('No active session to leave from');
      return;
    }
    
    const confirmed = window.confirm('Are you sure you want to leave this auction room? Your team will be deleted.');
    if (!confirmed) return;
    
    try {
      // Set flag to prevent auth listener from interfering
      isLeavingRoomRef.current = true;
      console.log('Set isLeavingRoom flag to true');
      
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Delete the user document to completely remove from this auction
        await deleteDoc(userRef);
        console.log('User document deleted successfully');
      }
      
      // Reset local state immediately after deletion
      setAuctionRoomId(null);
      setAuction(null);
      setUsers([]);
      setIsAdmin(false);
      setActivityLogs([]);
      setShowTeamView(false);
      setShowLogsView(false);
      setBidAmount('');
      
      // Clear current user data but keep the name for re-registration
      const userName = currentUser.name;
      setCurrentUser(null);
      
      // Show name input screen with previous name pre-filled
      setUserName(userName || '');
      setShowNameInput(true);
      setShowAuctionMenu(false);
      
      // Reset the leaving flag after a short delay
      setTimeout(() => {
        isLeavingRoomRef.current = false;
        console.log('Reset isLeavingRoom flag to false');
      }, 1000);
      
      showSuccess('Left auction room. Enter your name to continue.');
    } catch (error) {
      console.error('Error leaving room:', error);
      isLeavingRoomRef.current = false; // Reset flag on error
      showError('Failed to leave room: ' + error.message);
    }
  };

  // Super Admin Functions
  const enableSuperAdmin = () => {
    const password = prompt('Enter super admin password:');
    if (password === 'FIFA2023ADMIN') {
      setIsSuperAdmin(true);
      setIsAdmin(true);
      showSuccess('Super Admin mode activated! You now have full control.');
      console.log('Super Admin mode enabled');
    } else {
      showError('Invalid password');
    }
  };

  const deleteAllRooms = async () => {
    if (!isSuperAdmin) {
      showError('Super Admin access required');
      return;
    }
    
    const confirmed = window.confirm('⚠️ WARNING: This will delete ALL auction rooms and user data. Are you absolutely sure?');
    if (!confirmed) return;
    
    const doubleConfirm = window.confirm('This action CANNOT be undone. Type OK in the next prompt to confirm.');
    if (!doubleConfirm) return;
    
    const finalConfirm = prompt('Type "DELETE ALL" to confirm (case sensitive):');
    if (finalConfirm !== 'DELETE ALL') {
      showError('Confirmation cancelled');
      return;
    }
    
    try {
      console.log('🔄 Starting complete data wipe...');
      
      // Delete all auctions
      const auctionsSnapshot = await getDocs(collection(db, 'auctions'));
      let deletedAuctions = 0;
      
      for (const auctionDoc of auctionsSnapshot.docs) {
        await deleteDoc(doc(db, 'auctions', auctionDoc.id));
        deletedAuctions++;
        console.log(`Deleted auction: ${auctionDoc.id}`);
      }
      
      // Delete all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let deletedUsers = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
        deletedUsers++;
        console.log(`Deleted user: ${userDoc.id}`);
      }
      
      // Delete all activity logs
      const logsSnapshot = await getDocs(collection(db, 'activityLogs'));
      let deletedLogs = 0;
      
      for (const logDoc of logsSnapshot.docs) {
        await deleteDoc(doc(db, 'activityLogs', logDoc.id));
        deletedLogs++;
      }
      
      // Reset local state
      setAuctionRoomId(null);
      setAuction(null);
      setUsers([]);
      setActivityLogs([]);
      setAuctionRooms([]);
      setCurrentUser(null);
      setShowNameInput(true);
      setShowAuctionMenu(false);
      setShowAdminPanel(false);
      
      showSuccess(`✅ Deleted ${deletedAuctions} auctions, ${deletedUsers} users, ${deletedLogs} logs. Database cleared!`);
      console.log('✅ Complete data wipe finished');
    } catch (error) {
      console.error('Error deleting all data:', error);
      showError('Failed to delete all data: ' + error.message);
    }
  };

  const deleteSpecificRoom = async (roomId) => {
    if (!isSuperAdmin) {
      showError('Super Admin access required');
      return;
    }
    
    const confirmed = window.confirm('Delete this room and all associated user data?');
    if (!confirmed) return;
    
    try {
      // Delete the auction room
      await deleteDoc(doc(db, 'auctions', roomId));
      
      // Delete all users in this room
      const usersInRoom = await getDocs(
        query(collection(db, 'users'), where('auctionRoomId', '==', roomId))
      );
      
      for (const userDoc of usersInRoom.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
      }
      
      // Delete activity logs for this room
      const logsInRoom = await getDocs(
        query(collection(db, 'activityLogs'), where('auctionRoomId', '==', roomId))
      );
      
      for (const logDoc of logsInRoom.docs) {
        await deleteDoc(doc(db, 'activityLogs', logDoc.id));
      }
      
      showSuccess('Room deleted successfully');
      console.log(`Deleted room: ${roomId}`);
    } catch (error) {
      console.error('Error deleting room:', error);
      showError('Failed to delete room: ' + error.message);
    }
  };

  // Clear all Firebase data (Admin only)
  const clearAllData = async () => {
    if (!isAdmin && !isSuperAdmin) {
      showError('Only admin can clear all data');
      return;
    }
    
    const confirmed = window.confirm('⚠️ WARNING: This will delete ALL auction rooms and teams. This action cannot be undone. Are you sure?');
    if (!confirmed) return;
    
    try {
      console.log('🔄 Starting data cleanup...');
      
      // Delete all auctions
      const auctionsSnapshot = await getDocs(collection(db, 'auctions'));
      let deletedCount = 0;
      
      for (const auctionDoc of auctionsSnapshot.docs) {
        await deleteDoc(doc(db, 'auctions', auctionDoc.id));
        deletedCount++;
      }
      
      // Clear all user auction associations
      const usersSnapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
      }
      
      // Reset local state
      setAuctionRoomId(null);
      setAuction(null);
      setUsers([]);
      setIsAdmin(false);
      setShowAuctionMenu(true);
      
      showSuccess(`Deleted ${deletedCount} auctions and cleared all data`);
      console.log('✅ Data cleanup complete');
    } catch (error) {
      console.error('Error clearing data:', error);
      showError('Failed to clear data');
    }
  };

  // Load available auction rooms
  useEffect(() => {
    if (showAuctionMenu) {
      const unsubscribeRooms = onSnapshot(collection(db, 'auctions'), (snapshot) => {
        const roomsData = [];
        snapshot.forEach((doc) => {
          const roomData = doc.data();
          if (!roomData.isComplete) {
            roomsData.push({ id: doc.id, ...roomData });
          }
        });
        setAuctionRooms(roomsData);
      });
      
      return () => unsubscribeRooms();
    }
  }, [showAuctionMenu]);

  // Utility functions
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const showError = (message) => {
    setError(message);
    setTimeout(clearMessages, 3000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(clearMessages, 3000);
  };

  // Auction functions
  const startNextAuction = async () => {
    try {
      clearMessages();
      
      if (!isAdmin) {
        showError('Only the host can start auctions');
        return;
      }
      
      if (auction?.status === 'bidding') {
        showError('Current auction is still active');
        return;
      }
      
      if (!users || users.length === 0) {
        showError('No participants in the auction');
        return;
      }
      
      // Check if auction should end (everyone has 11 players)
      const minTeamSize = Math.min(...users.map(u => (u.team || []).length));
      if (minTeamSize >= 11) {
        // Mark auction as complete
        const auctionRef = doc(db, 'auctions', auctionRoomId);
        await updateDoc(auctionRef, {
          status: 'complete',
          isComplete: true
        });
        showSuccess('Auction complete! Everyone has 11 players!');
        return;
      }
      
      // Get current phase from auction data
      let currentAuctionPhase = auction?.currentPhase || 'premium';
      
      // Try to get players for current phase
      let availablePlayers = await getAvailablePlayersForPhase(currentAuctionPhase);
      
      // If no players in current phase, move to next phase
      if (availablePlayers.length === 0) {
        if (currentAuctionPhase === 'premium') {
          currentAuctionPhase = 'regular';
          await addActivityLog(
            'phase_change',
            'Moving to Regular Players phase (83-85 rating, Base: 30M)'
          );
        } else if (currentAuctionPhase === 'regular') {
          currentAuctionPhase = 'free';
          await addActivityLog(
            'phase_change',
            'Moving to Free Picks phase (78-82 rating, Base: 0M)'
          );
        } else {
          // No more players available
          const auctionRef = doc(db, 'auctions', auctionRoomId);
          await updateDoc(auctionRef, {
            status: 'complete',
            isComplete: true
          });
          showSuccess('Auction complete! No more players available!');
          return;
        }
        
        // Update phase in auction data
        const auctionRef = doc(db, 'auctions', auctionRoomId);
        await updateDoc(auctionRef, {
          currentPhase: currentAuctionPhase
        });
        
        // Get players for new phase
        availablePlayers = await getAvailablePlayersForPhase(currentAuctionPhase);
        
        if (availablePlayers.length === 0) {
          showError('No more players available for auction!');
          return;
        }
      }
      
      // Select highest rated player from available players in current phase (already sorted descending)
      const selectedPlayer = availablePlayers[0]; // First player = highest rating
      const basePrice = getBasePrice(selectedPlayer.rating);
      
      // Update auction state
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      await updateDoc(auctionRef, {
        currentPlayer: selectedPlayer,
        currentBid: basePrice,
        basePrice: basePrice,
        highestBidder: basePrice === 0 ? null : 'system', // System holds base price
        bidders: [],
        foldedUsers: [],
        status: 'bidding',
        timer: 20,
        currentPhase: currentAuctionPhase
      });
      
      // Add activity log for auction start
      const phaseInfo = getPhaseDescription(currentAuctionPhase);
      await addActivityLog(
        'auction_start',
        `Auction started for ${selectedPlayer.name} (${selectedPlayer.rating} rated) - ${phaseInfo}`,
        selectedPlayer.name,
        basePrice
      );
      
      if (basePrice > 0) {
        showSuccess(`Auction started for ${selectedPlayer.name}! Base price: ${basePrice}M`);
      } else {
        showSuccess(`Free pick available: ${selectedPlayer.name}! First bid wins!`);
      }
    } catch (error) {
      console.error('Error starting auction:', error);
      showError('Failed to start auction');
    }
  };

  const placeBid = async () => {
    try {
      clearMessages();
      
      const bid = parseInt(bidAmount);
      const basePrice = auction.basePrice || 0;
      
      if (!bid || bid <= 0 || isNaN(bid)) {
        showError('Please enter a valid bid amount');
        return;
      }
      
      if (bid < basePrice) {
        showError(`Bid must be at least ${basePrice}M (base price)`);
        return;
      }
      
      if (bid <= auction.currentBid) {
        showError('Bid must be higher than current bid');
        return;
      }
      
      if (bid > currentUser.budget) {
        showError('Not enough budget!');
        return;
      }
      
      if (auction.foldedUsers && auction.foldedUsers.includes(user.uid)) {
        showError('You have already folded on this player');
        return;
      }
      
      if (auction.status !== 'bidding') {
        showError('Auction is not active');
        return;
      }
      
      // Use simpler update instead of transaction to avoid conflicts
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      const newBidders = [...new Set([...(auction.bidders || []), user.uid])];
      
      await updateDoc(auctionRef, {
        currentBid: bid,
        highestBidder: user.uid,
        bidders: newBidders,
        timer: 15 // Reset timer to 15 seconds
      });
      
      // Remove bid logging to reduce Firebase writes
      // await addActivityLog(...)
      
      setBidAmount('');
      showSuccess(`Bid placed: ${bid}M`);
    } catch (error) {
      console.error('Error placing bid:', error);
      showError(error.message || 'Failed to place bid');
    }
  };

  const foldPlayer = async () => {
    try {
      clearMessages();
      
      if (!auction || auction.status !== 'bidding') {
        showError('No active auction to fold on');
        return;
      }
      
      if (auction.foldedUsers && auction.foldedUsers.includes(user.uid)) {
        showError('You have already folded on this player');
        return;
      }
      
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      const newFoldedUsers = [...(auction.foldedUsers || []), user.uid];
      
      await updateDoc(auctionRef, {
        foldedUsers: newFoldedUsers
      });
      
      showSuccess('You have folded on this player');
    } catch (error) {
      console.error('Error folding:', error);
      showError('Failed to fold');
    }
  };

  const endAuction = async () => {
    try {
      if (!auction || !auction.currentPlayer) {
        showError('No active auction to end');
        return;
      }
      
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      
      if (auction.highestBidder && auction.highestBidder !== 'system') {
        // Player sold to a user
        await runTransaction(db, async (transaction) => {
          const winnerRef = doc(db, 'users', auction.highestBidder);
          const winnerDoc = await transaction.get(winnerRef);
          
          if (!winnerDoc.exists()) {
            throw new Error('Winner not found');
          }
          
          const winnerData = winnerDoc.data();
          
          // Validate budget
          if (winnerData.budget < auction.currentBid) {
            throw new Error('Winner does not have enough budget');
          }
          
          // Update winner's budget and team
          transaction.update(winnerRef, {
            budget: winnerData.budget - auction.currentBid,
            team: [...(winnerData.team || []), auction.currentPlayer]
          });
          
          // Get current auction data to update sold players
          const auctionDoc = await transaction.get(auctionRef);
          const currentSoldPlayers = auctionDoc.data().soldPlayers || [];
          
          // Update auction status and add to sold players list
          transaction.update(auctionRef, {
            status: 'sold',
            timer: 0,
            soldPlayers: [...currentSoldPlayers, auction.currentPlayer]
          });
        });
        
        const winnerName = users.find(u => u.id === auction.highestBidder)?.name || 'Unknown';
        
        // Add activity log for the purchase
        await addActivityLog(
          'purchase',
          `${winnerName} bought ${auction.currentPlayer.name} for ${auction.currentBid}M`,
          auction.currentPlayer.name,
          auction.currentBid,
          auction.highestBidder,
          winnerName
        );
        
        showSuccess(`${auction.currentPlayer.name} sold to ${winnerName} for ${auction.currentBid}M!`);
        
        // Check if auction should continue
        const minTeamSize = Math.min(...users.map(u => (u.team || []).length));
        if (minTeamSize >= 11) {
          setTimeout(() => {
            showSuccess('🎉 Auction complete! Everyone has 11 players!');
            updateDoc(auctionRef, { isComplete: true });
          }, 2000);
        }
      } else {
        // Player unsold
        await updateDoc(auctionRef, {
          status: 'unsold',
          timer: 0
        });
        
        // Add activity log for unsold player
        await addActivityLog(
          'auction_end',
          `${auction.currentPlayer.name} went unsold`,
          auction.currentPlayer.name
        );
        
        showSuccess(`${auction.currentPlayer.name} went unsold!`);
      }
    } catch (error) {
      console.error('Error ending auction:', error);
      showError('Error ending auction: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Authenticating...</div>
      </div>
    );
  }

  // Name input screen
  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          {showQuotaWarning && (
            <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 rounded-lg">
              <h3 className="text-white font-bold mb-2 flex items-center">
                ⚠️ Firebase Quota Exceeded
              </h3>
              <p className="text-red-200 text-sm mb-2">
                Your Firebase free plan has reached its daily limits. You have 3 options:
              </p>
              <ol className="text-red-200 text-sm list-decimal list-inside space-y-1">
                <li>Wait 24 hours for quota to reset</li>
                <li>Upgrade to Firebase Blaze (pay-as-you-go) plan</li>
                <li>Use the Local Storage version (App-LocalStorage.jsx)</li>
              </ol>
              <button
                onClick={() => setShowQuotaWarning(false)}
                className="mt-3 text-xs text-red-300 hover:text-white underline"
              >
                Dismiss this warning
              </button>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
            {currentUser ? 'Change Your Name' : 'Welcome to FIFA 23 Auction!'}
          </h2>
          <p className="text-gray-300 mb-4 text-center">
            {currentUser ? 'Enter your new name:' : 'Enter your name to get started:'}
          </p>
          
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none mb-4"
            onKeyPress={(e) => e.key === 'Enter' && submitUserName()}
          />
          
          <div className="flex gap-3">
            {currentUser && (
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setShowAuctionMenu(true);
                  setUserName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={submitUserName}
              disabled={!userName.trim()}
              className={`${currentUser ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors`}
            >
              {currentUser ? 'Update Name' : 'Continue'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-600 text-white rounded-lg text-center">
              {error}
              {error.includes('quota') && (
                <div className="mt-2">
                  <a 
                    href="https://console.firebase.google.com/project/fifa-auction-app/usage" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm underline hover:text-red-100"
                  >
                    Check Firebase Usage →
                  </a>
                </div>
              )}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-600 text-white rounded-lg text-center">
              {success}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Auction room selection screen
  if (showAuctionMenu) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-400">FIFA 23 Friends Auction</h1>
              <p className="text-gray-300">
                Welcome, {currentUser?.name}!
                {isSuperAdmin && <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">SUPER ADMIN</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {!isSuperAdmin && (
                <button
                  onClick={enableSuperAdmin}
                  onDoubleClick={enableSuperAdmin}
                  className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded-lg text-white text-sm transition-colors"
                  title="Double-click for Super Admin access"
                >
                  🔐 Admin
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors"
                >
                  🛠️ Admin Panel
                </button>
              )}
              <button
                onClick={() => {
                  setShowAuctionMenu(false);
                  setShowNameInput(true);
                  setUserName(currentUser?.name || '');
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white text-sm transition-colors"
              >
                Change Name
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4 max-w-4xl">
          {/* Create New Room */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Auction</h2>
            <p className="text-gray-400 text-sm mb-4">Set the initial budget that all players will start with. Default: 1000M (1 Billion)</p>
            <div className="space-y-4">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Auction room name"
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && createAuctionRoom()}
              />
              <div className="flex gap-4 items-center">
                <label className="text-white font-medium whitespace-nowrap">Initial Budget:</label>
                <input
                  type="number"
                  value={initialBudget}
                  onChange={(e) => setInitialBudget(Math.max(100, parseInt(e.target.value) || 1000))}
                  min="100"
                  max="5000"
                  className="flex-1 bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                  placeholder="1000"
                />
                <span className="text-gray-400 text-sm">million</span>
              </div>
              <button
                onClick={createAuctionRoom}
                disabled={!newRoomName.trim() || !initialBudget || initialBudget < 100}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors"
              >
                Create Room
              </button>
            </div>
          </div>

          {/* Join Existing Room */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Join Existing Auction</h2>
            {auctionRooms.length > 0 ? (
              <div className="grid gap-4">
                {auctionRooms.map((room) => (
                  <div key={room.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{room.roomName}</h3>
                      <p className="text-gray-300 text-sm">
                        Created by: {room.createdBy} | Status: {room.status || 'waiting'}
                      </p>
                      <p className="text-green-400 text-sm font-medium">
                        Budget: {room.initialBudget || 200} million each
                      </p>
                      {isSuperAdmin && (
                        <p className="text-red-400 text-xs mt-1 font-mono">
                          ID: {room.id}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => joinAuctionRoom(room)}
                        disabled={room.isComplete}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-bold transition-colors"
                      >
                        {room.isComplete ? 'Completed' : 'Join'}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => deleteSpecificRoom(room.id)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition-colors"
                          title="Delete this room"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No active auction rooms available</p>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-600 text-white rounded-lg text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-600 text-white rounded-lg text-center">
              {success}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Loading FIFA Auction...</div>
          <div className="text-gray-400">Checking for existing session...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Setting up your account...</div>
          <div className="text-gray-400">Almost ready!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-400">FIFA 23 Friends Auction</h1>
            <p className="text-gray-300 text-sm">{auction?.roomName || 'Auction Room'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTeamView(true)}
              disabled={!currentUser}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              My Team ({currentUser?.team?.length || 0}/11)
            </button>
            <button
              onClick={() => setShowLogsView(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Activity Logs
            </button>
            <button
              onClick={leaveAuctionRoom}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Leave Room
            </button>
            <div className="text-sm text-right">
              <div className="text-gray-300">
                {currentUser?.name}
                {isAdmin && <span className="ml-2 px-2 py-1 bg-yellow-600 text-black text-xs rounded font-bold">HOST</span>}
              </div>
              <div className="text-green-400 font-mono">{currentUser?.budget || 0}M</div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="bg-red-600 text-white p-3 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-600 text-white p-3 text-center">
          {success}
        </div>
      )}

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Auction Area */}
          <div className="lg:col-span-3">
            {auction?.currentPlayer ? (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {/* Player Card */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={auction.currentPlayer.imageUrl} 
                      alt={auction.currentPlayer.name}
                      className="w-48 h-64 object-cover rounded-lg mx-auto"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auction.currentPlayer.name)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`;
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-green-400 mb-2">
                      {auction.currentPlayer.name}
                    </h2>
                    
                    {/* Phase and Base Price Information */}
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-bold">
                          {getPhaseDescription(auction.currentPhase || 'premium')}
                        </span>
                        {auction.basePrice > 0 && (
                          <span className="text-red-400 font-bold">
                            Base Price: {auction.basePrice}M
                          </span>
                        )}
                        {auction.basePrice === 0 && (
                          <span className="text-green-400 font-bold">
                            FREE PICK!
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-300">Overall: <span className="text-yellow-400 font-bold">{auction.currentPlayer.rating}</span></p>
                        <p className="text-gray-300">Position: <span className="text-blue-400">{auction.currentPlayer.position}</span></p>
                        <p className="text-gray-300">Club: <span className="text-white">{auction.currentPlayer.club}</span></p>
                        <p className="text-gray-300">Nation: <span className="text-white">{auction.currentPlayer.nation}</span></p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>PAC: <span className="text-green-400">{auction.currentPlayer.pace}</span></div>
                        <div>SHO: <span className="text-red-400">{auction.currentPlayer.shooting}</span></div>
                        <div>PAS: <span className="text-yellow-400">{auction.currentPlayer.passing}</span></div>
                        <div>DRI: <span className="text-purple-400">{auction.currentPlayer.dribbling}</span></div>
                        <div>DEF: <span className="text-blue-400">{auction.currentPlayer.defending}</span></div>
                        <div>PHY: <span className="text-orange-400">{auction.currentPlayer.physicality}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auction Info */}
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Current Highest Bid</h3>
                      <p className="text-2xl text-green-400">{auction.currentBid}M</p>
                      {auction.highestBidder && (
                        <p className="text-gray-300">
                          by {users.find(u => u.id === auction.highestBidder)?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold">Time Left</h3>
                      <p className={`text-3xl font-bold ${timer <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {timer}s
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      auction.status === 'bidding' ? 'bg-green-600' :
                      auction.status === 'sold' ? 'bg-blue-600' :
                      auction.status === 'unsold' ? 'bg-red-600' :
                      'bg-gray-600'
                    }`}>
                      {auction.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Bidding Controls */}
                {auction.status === 'bidding' && !(auction.foldedUsers || []).includes(user.uid) && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Place Your Bid</h3>
                    
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min: ${Math.max(auction.basePrice || 0, auction.currentBid + 1)}M`}
                        className="flex-1 bg-gray-600 text-white p-3 rounded-lg border border-gray-500 focus:border-green-400 focus:outline-none"
                        min={Math.max(auction.basePrice || 0, auction.currentBid + 1)}
                        max={currentUser.budget}
                        onKeyPress={(e) => e.key === 'Enter' && placeBid()}
                      />
                      
                      <button
                        onClick={placeBid}
                        disabled={!bidAmount || isNaN(parseInt(bidAmount)) || parseInt(bidAmount) < Math.max(auction.basePrice || 0, auction.currentBid + 1) || parseInt(bidAmount) > currentUser.budget}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                      >
                        Place Bid
                      </button>
                      
                      <button
                        onClick={foldPlayer}
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                      >
                        Fold
                      </button>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400">
                      <p>Quick bids: 
                        <button onClick={() => setBidAmount(String(Math.max(auction.basePrice || 0, auction.currentBid + 5)))} className="ml-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">+5M</button>
                        <button onClick={() => setBidAmount(String(Math.max(auction.basePrice || 0, auction.currentBid + 10)))} className="ml-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">+10M</button>
                        <button onClick={() => setBidAmount(String(Math.max(auction.basePrice || 0, auction.currentBid + 20)))} className="ml-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">+20M</button>
                      </p>
                    </div>
                  </div>
                )}

                {(auction.foldedUsers || []).includes(user.uid) && (
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-red-400 font-bold">You have folded on this player</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">No Active Auction</h2>
                <p className="text-gray-300 mb-6">Waiting for the next player to be put up for auction...</p>
              </div>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">Admin Controls</h3>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startNextAuction}
                    disabled={auction?.status === 'bidding' || auction?.isComplete}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    {auction?.isComplete ? 'Auction Complete' : auction?.currentPlayer ? 'Next Player' : 'Start Auction'}
                  </button>
                  
                  <button
                    onClick={endAuction}
                    disabled={auction?.status !== 'bidding'}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    End Current Auction
                  </button>
                  
                  <button
                    onClick={clearAllData}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    🗑️ Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Current User Status */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold mb-4">Your Status</h3>
              
              <div className="mb-4">
                <p className="text-gray-300">Budget Remaining</p>
                <p className="text-2xl font-bold text-green-400">{currentUser.budget}M</p>
              </div>
              
              <div>
                <p className="text-gray-300 mb-2">Your Team ({currentUser.team.length})</p>
                {currentUser.team.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentUser.team.map((player, index) => (
                      <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                        <p className="font-bold">{player.name}</p>
                        <p className="text-gray-300">{player.position} - {player.rating} OVR</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No players yet</p>
                )}
              </div>
            </div>

            {/* All Participants */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4">Participants ({users.length})</h3>
              
              <div className="space-y-3">
                {users.map((participant) => (
                  <div key={participant.id} className="bg-gray-700 p-3 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm">{participant.name}</p>
                      <span className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    </div>
                    
                    <p className="text-green-400 text-sm">Budget: {participant.budget}M</p>
                    <p className="text-gray-300 text-xs">Team: {participant.team.length} players</p>
                    
                    {auction?.highestBidder === participant.id && (
                      <p className="text-yellow-400 text-xs font-bold">Current Highest Bidder</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team View Modal */}
      {showTeamView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-green-400">My Team ({currentUser?.team?.length || 0}/11)</h2>
              <button
                onClick={() => setShowTeamView(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-300">Budget Remaining: <span className="text-green-400 font-bold">{currentUser?.budget || 0}M</span></p>
                <p className="text-gray-300">Total Spent: <span className="text-red-400 font-bold">{((auction?.initialBudget || 1000) - (currentUser?.budget || 0))}M</span></p>
              </div>              {currentUser?.team && currentUser.team.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentUser.team.map((player, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <img 
                        src={player.imageUrl} 
                        alt={player.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`;
                        }}
                      />
                      <h3 className="font-bold text-white text-sm">{player.name}</h3>
                      <p className="text-gray-300 text-xs">{player.club}</p>
                      <p className="text-green-400 text-sm">Rating: {player.rating}</p>
                      <p className="text-blue-400 text-xs">{player.position}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No players in your team yet</p>
                  <p className="text-gray-500 text-sm">Start bidding to build your team!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showLogsView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-purple-400">Activity Logs</h2>
              <button
                onClick={() => setShowLogsView(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.map((log, index) => (
                    <div key={log.id || index} className={`p-3 rounded-lg ${
                      log.type === 'purchase' ? 'bg-green-900 border-l-4 border-green-500' :
                      log.type === 'bid' ? 'bg-blue-900 border-l-4 border-blue-500' :
                      log.type === 'auction_start' ? 'bg-yellow-900 border-l-4 border-yellow-500' :
                      'bg-gray-700 border-l-4 border-gray-500'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white text-sm">{log.message}</p>
                          {log.amount && (
                            <p className="text-green-400 text-xs font-mono">{log.amount}M</p>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No activity logs yet</p>
                  <p className="text-gray-500 text-sm">Auction activity will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Panel Modal */}
      {showAdminPanel && isSuperAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full border-4 border-red-600">
            <div className="flex justify-between items-center p-6 border-b border-red-600 bg-red-900">
              <h2 className="text-2xl font-bold text-white">🛠️ Super Admin Control Panel</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-white hover:text-red-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-950 border border-red-600 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-2">⚠️ Warning</h3>
                <p className="text-red-200 text-sm">
                  You have full administrative control. Use these features carefully as they cannot be undone.
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3">Database Statistics</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">Total Rooms: <span className="text-green-400 font-bold">{auctionRooms.length}</span></p>
                  <p className="text-gray-300">Total Users in DB: <span className="text-blue-400 font-bold">{users.length}</span></p>
                  <p className="text-gray-300">Activity Logs: <span className="text-purple-400 font-bold">{activityLogs.length}</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={deleteAllRooms}
                  className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-lg font-bold text-white transition-colors text-lg"
                >
                  🗑️ DELETE ALL ROOMS & DATA
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowAdminPanel(false);
                      setIsSuperAdmin(false);
                      setIsAdmin(false);
                      showSuccess('Super Admin mode deactivated');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-bold text-white transition-colors"
                  >
                    Exit Admin Mode
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('Super Admin Status:', {
                        isSuperAdmin,
                        isAdmin,
                        user: user?.uid,
                        currentUser: currentUser?.name
                      });
                      showSuccess('Check browser console for debug info');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-white transition-colors"
                  >
                    Debug Info
                  </button>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-2">Admin Password</h3>
                <p className="text-gray-300 text-sm font-mono bg-gray-800 p-2 rounded">FIFA2023ADMIN</p>
                <p className="text-gray-400 text-xs mt-2">Save this password for future access</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;