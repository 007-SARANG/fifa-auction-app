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
  getDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import html2canvas from 'html2canvas';

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

// Import the curated FIFA player database (183 players with detailed stats)
import ALL_FIFA_PLAYERS from './player-database-new.js';

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
function getPlayerPhoto(player) {
  const playerName = player.name;

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
    // EA Sports CDN (Best quality, requires ID)
    player.id ? `https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-23/ratings/common/full/player-portraits/${player.id}.png` : null,
    // Futbin
    `https://cdn.futbin.com/content/fifa23/img/players/big/${cleanName}.png`,
    // RenderZ
    `https://renderz.app/image-cdn/player/${cleanName}/normal`,
    // Fallbacks
    `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`
  ].filter(Boolean);

  return sources[0]; // Return primary source
}

// Use the curated FIFA player database (183 players with detailed tactical info)
// Distribution: 12 elite (90+), 58 premium (85-89), 104 regular (80-84), 9 prospects (<80)
const SAMPLE_PLAYERS = ALL_FIFA_PLAYERS.map(player => ({
  ...player,
  imageUrl: player.imageUrl || getPlayerPhoto(player) // Use official photo or fallback
}));

// Formations Data
const FORMATIONS = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 'gk', label: 'GK', top: '85%', left: '50%' },
      { id: 'lb', label: 'LB', top: '70%', left: '15%' },
      { id: 'cb1', label: 'CB', top: '75%', left: '35%' },
      { id: 'cb2', label: 'CB', top: '75%', left: '65%' },
      { id: 'rb', label: 'RB', top: '70%', left: '85%' },
      { id: 'lm', label: 'LM', top: '45%', left: '15%' },
      { id: 'cm1', label: 'CM', top: '50%', left: '35%' },
      { id: 'cm2', label: 'CM', top: '50%', left: '65%' },
      { id: 'rm', label: 'RM', top: '45%', left: '85%' },
      { id: 'st1', label: 'ST', top: '15%', left: '35%' },
      { id: 'st2', label: 'ST', top: '15%', left: '65%' }
    ]
  },
  '4-3-3': {
    name: '4-3-3 Attack',
    positions: [
      { id: 'gk', label: 'GK', top: '85%', left: '50%' },
      { id: 'lb', label: 'LB', top: '70%', left: '15%' },
      { id: 'cb1', label: 'CB', top: '75%', left: '35%' },
      { id: 'cb2', label: 'CB', top: '75%', left: '65%' },
      { id: 'rb', label: 'RB', top: '70%', left: '85%' },
      { id: 'cm1', label: 'CM', top: '50%', left: '30%' },
      { id: 'cam', label: 'CAM', top: '35%', left: '50%' },
      { id: 'cm2', label: 'CM', top: '50%', left: '70%' },
      { id: 'lw', label: 'LW', top: '20%', left: '15%' },
      { id: 'st', label: 'ST', top: '10%', left: '50%' },
      { id: 'rw', label: 'RW', top: '20%', left: '85%' }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'gk', label: 'GK', top: '85%', left: '50%' },
      { id: 'cb1', label: 'CB', top: '75%', left: '25%' },
      { id: 'cb2', label: 'CB', top: '80%', left: '50%' },
      { id: 'cb3', label: 'CB', top: '75%', left: '75%' },
      { id: 'cdm1', label: 'CDM', top: '60%', left: '35%' },
      { id: 'cdm2', label: 'CDM', top: '60%', left: '65%' },
      { id: 'lm', label: 'LM', top: '40%', left: '10%' },
      { id: 'cam', label: 'CAM', top: '35%', left: '50%' },
      { id: 'rm', label: 'RM', top: '40%', left: '90%' },
      { id: 'st1', label: 'ST', top: '15%', left: '35%' },
      { id: 'st2', label: 'ST', top: '15%', left: '65%' }
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 'gk', label: 'GK', top: '85%', left: '50%' },
      { id: 'lb', label: 'LB', top: '70%', left: '15%' },
      { id: 'cb1', label: 'CB', top: '75%', left: '35%' },
      { id: 'cb2', label: 'CB', top: '75%', left: '65%' },
      { id: 'rb', label: 'RB', top: '70%', left: '85%' },
      { id: 'cm1', label: 'CM', top: '50%', left: '30%' },
      { id: 'cm2', label: 'CM', top: '50%', left: '50%' },
      { id: 'cm3', label: 'CM', top: '50%', left: '70%' },
      { id: 'lw', label: 'LW', top: '20%', left: '15%' },
      { id: 'st', label: 'ST', top: '15%', left: '50%' },
      { id: 'rw', label: 'RW', top: '20%', left: '85%' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { id: 'gk', label: 'GK', top: '85%', left: '50%' },
      { id: 'lb', label: 'LB', top: '70%', left: '15%' },
      { id: 'cb1', label: 'CB', top: '75%', left: '35%' },
      { id: 'cb2', label: 'CB', top: '75%', left: '65%' },
      { id: 'rb', label: 'RB', top: '70%', left: '85%' },
      { id: 'cdm1', label: 'CDM', top: '60%', left: '35%' },
      { id: 'cdm2', label: 'CDM', top: '60%', left: '65%' },
      { id: 'cam1', label: 'CAM', top: '40%', left: '20%' },
      { id: 'cam2', label: 'CAM', top: '40%', left: '50%' },
      { id: 'cam3', label: 'CAM', top: '40%', left: '80%' },
      { id: 'st', label: 'ST', top: '15%', left: '50%' }
    ]
  }
};

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
  const prevPlayerIdRef = useRef(null);

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Squad Builder State
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [squadPositions, setSquadPositions] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatEndRef = useRef(null);

  // Join Requests
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);

  // Animation State
  const [isFlipping, setIsFlipping] = useState(false);

  // Super Admin State
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Password State
  const [userPassword, setUserPassword] = useState('');

  // Auction phase tracking
  const [currentPhase, setCurrentPhase] = useState('premium');

  // Reconnection State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const isLeavingRoomRef = useRef(false);

  // Bid History and Admin Features
  const [bidHistory, setBidHistory] = useState([]);
  const [showViewTeams, setShowViewTeams] = useState(false);

  // Helper functions for messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const getPhaseDescription = (phase) => {
    switch (phase) {
      case 'premium': return '🌟 Premium Phase (85+ Rated)';
      case 'regular': return '⭐ Regular Phase (83-85 Rated)';
      case 'free': return '🎁 Free Phase (78-82 Rated)';
      default: return 'Unknown Phase';
    }
  };

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

  // Listen for available auction rooms
  useEffect(() => {
    const q = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuctionRooms(rooms);
    }, (error) => {
      console.error('Error fetching auction rooms:', error);
    });

    return () => unsubscribe();
  }, []);

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

            // Check if user is Super Admin (Sarang)
            if (existingUserData.name === 'Sarang') {
              setIsSuperAdmin(true);
              console.log('Super Admin status restored');
            }

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
  }, [initializeSampleData]);

  // OPTIMIZATION: Removed online status tracking to save writes
  // Users don't need real-time online/offline status for this app
  // This saves 2-4 writes per user session

  // Real-time listener for activity logs
  useEffect(() => {
    if (!auctionRoomId || !showLogsView) return;

    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('auctionRoomId', '==', auctionRoomId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityLogs(logsData);
    }, (error) => {
      console.error('Error listening to logs:', error);
    });

    return () => unsubscribeLogs();
  }, [auctionRoomId, showLogsView]);

  // Real-time listener for chat messages
  useEffect(() => {
    if (!auctionRoomId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('auctionRoomId', '==', auctionRoomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Auto-scroll to bottom
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // Unread count logic could go here if chat is closed
      if (!showChat && msgs.length > 0) {
        // Simple unread logic: just increment if new messages come while closed
        // For now, let's just show a dot if there are messages
      }
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribeMessages();
  }, [auctionRoomId, showChat]);

  // Listener for pending users to detect when they're approved
  useEffect(() => {
    if (!user || !pendingRoomId || auctionRoomId) return;

    console.log('Setting up pending approval listener for room:', pendingRoomId);

    const unsubscribePendingUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        // If user now has an auctionRoomId matching the pending room, they've been approved
        if (userData.auctionRoomId === pendingRoomId) {
          console.log('User approved! Joining room:', pendingRoomId);
          setPendingRoomId(null);
          setAuctionRoomId(pendingRoomId);
          setCurrentUser({ id: doc.id, ...userData });
          showSuccess('You have been approved! Joining room...');
        }
      }
    });

    return () => {
      unsubscribePendingUser();
    };
  }, [user, pendingRoomId, auctionRoomId]);

  useEffect(() => {
    if (!currentUser?.id || !auctionRoomId) return;

    // Listen to current user data
    const unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.id), (doc) => {
      if (doc.exists()) {
        setCurrentUser(prev => ({ ...prev, id: doc.id, ...doc.data() }));
      }
    });

    // Listen to auction state for this room
    const unsubscribeAuction = onSnapshot(doc(db, 'auctions', auctionRoomId), (doc) => {
      if (doc.exists()) {
        const auctionData = doc.data();
        setAuction(auctionData);
        setTimer(auctionData.timer || 0);
        setJoinRequests(auctionData.joinRequests || []);

        // Trigger flip animation if player changes
        const currentPlayerId = auctionData.currentPlayer?.id || auctionData.currentPlayer?.name;
        if (currentPlayerId && prevPlayerIdRef.current !== currentPlayerId) {
          setIsFlipping(true);
          setTimeout(() => setIsFlipping(false), 1000);
          prevPlayerIdRef.current = currentPlayerId;
        }
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
        const isUserAdmin = (auction?.createdBy === currentUser.id) ||
          (sortedUsers.length > 0 && sortedUsers[0].id === currentUser.id);
        setIsAdmin(isUserAdmin);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeAuction();
      unsubscribeUsers();
    };
  }, [currentUser?.id, auctionRoomId]);

  useEffect(() => {
    // Only start timer if we're in bidding state with a positive timer and not paused
    if (auction?.status === 'bidding' && auctionRoomId && timer > 0 && !auction?.isPaused) {
      let localTimer = timer;
      let syncCounter = 0;

      const interval = setInterval(async () => {
        localTimer--;
        syncCounter++;
        setTimer(localTimer);

        // OPTIMIZATION: Only sync to Firebase every 5 seconds instead of every second
        // AND only if we are the admin
        if (isAdmin && (syncCounter % 5 === 0 || localTimer === 0)) {
          try {
            const auctionRef = doc(db, 'auctions', auctionRoomId);
            await updateDoc(auctionRef, { timer: localTimer });
          } catch (error) {
            console.error('Timer sync error:', error);
          }
        }

        // End auction when timer reaches 0
        if (localTimer === 0) {
          clearInterval(interval);

          // Only admin triggers endAuction
          if (isAdmin) {
            console.log('⏰ Timer reached 0, ending auction...');
            setTimeout(async () => {
              try {
                await endAuction();
              } catch (error) {
                console.error('Error ending auction:', error);
              }
            }, 100);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, auction?.status, auctionRoomId, isAdmin, auction?.isPaused]);

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
    }
  };

  const addActivityLog = async (type, message, playerName = null, amount = null, userId = null, userName = null) => {
    const importantEvents = ['purchase', 'auction_start', 'phase_change'];
    if (!importantEvents.includes(type)) {
      return;
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
    }
  };

  const submitUserName = async () => {
    if (!userName.trim()) {
      showError('Please enter your name');
      return;
    }

    if (!userPassword.trim()) {
      showError('Please enter your password');
      return;
    }

    if (!user) {
      showError('Authentication required. Please refresh the page.');
      return;
    }

    // Super Admin Check
    if (userName.trim() === 'Sarang') {
      if (userPassword === '123') {
        setIsSuperAdmin(true);
        showSuccess('Welcome Super Admin Sarang!');
      } else {
        showError('Invalid password for Super Admin access');
        return;
      }
    } else {
      setIsSuperAdmin(false);
    }

    try {
      if (isLeavingRoomRef.current) {
        isLeavingRoomRef.current = false;
      }

      const userIdentifier = `${userName.trim().toLowerCase()}_${btoa(userPassword)}`;
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('userIdentifier', '==', userIdentifier));
      const querySnapshot = await getDocs(q);

      let userRef;
      if (!querySnapshot.empty) {
        // User exists, restore session
        const existingUserDoc = querySnapshot.docs[0];
        userRef = doc(db, 'users', existingUserDoc.id);
        const userData = existingUserDoc.data();

        console.log('Existing user found, restoring session:', userData);

        await updateDoc(userRef, {
          lastLoginAt: Date.now(),
          isOnline: true
        });

        setCurrentUser({
          id: existingUserDoc.id,
          ...userData,
          lastLoginAt: Date.now(),
          isOnline: true
        });

        // Restore auction room if user was in one
        if (userData.auctionRoomId) {
          console.log('Restoring user to auction room:', userData.auctionRoomId);
          setAuctionRoomId(userData.auctionRoomId);
          setShowAuctionMenu(false);
        }
      } else {
        // Create new user
        userRef = doc(db, 'users', user.uid);
        const newUser = {
          name: userName.trim(),
          userIdentifier: userIdentifier,
          budget: initialBudget,
          team: [],
          lastLoginAt: Date.now(),
          auctionRoomId: null
        };

        await setDoc(userRef, newUser);
        setCurrentUser({ id: user.uid, ...newUser });

        showSuccess('Account created successfully!');
      }

      setShowNameInput(false);
      setShowAuctionMenu(true);
      // Don't clear username/password immediately so we can use them for display if needed
    } catch (error) {
      console.error('Error saving user name:', error);
      showError('Failed to save name: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async () => {
    try {
      clearMessages();

      const bid = parseInt(bidAmount);
      const basePrice = auction.basePrice || 0;
      const playerRating = auction.currentPlayer.rating;

      if (!bid || bid <= 0 || isNaN(bid)) {
        showError('Please enter a valid bid amount');
        return;
      }

      // Bid increment validation based on player rating
      if (playerRating >= 85) {
        if (bid % 10 !== 0) {
          showError('For 85+ rated players, bids must be multiples of 10M');
          return;
        }
        if (bid < auction.currentBid + 10) {
          showError('Minimum bid increment is 10M for this player');
          return;
        }
      } else if (playerRating === 84) {
        if (bid % 5 !== 0) {
          showError('For 84 rated players, bids must be multiples of 5M');
          return;
        }
        if (bid < auction.currentBid + 5) {
          showError('Minimum bid increment is 5M for this player');
          return;
        }
      } else {
        if (bid <= auction.currentBid) {
          showError('Bid must be higher than current bid');
          return;
        }
      }

      if (bid < basePrice) {
        showError(`Bid must be at least ${basePrice}M`);
        return;
      }

      if (bid > (currentUser?.budget || 0)) {
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

      const auctionRef = doc(db, 'auctions', auctionRoomId);
      const newBidders = [...new Set([...(auction.bidders || []), currentUser.id])];

      const currentTimer = timer || 0;
      const newTimer = Math.min(currentTimer + 10, 20);

      await updateDoc(auctionRef, {
        currentBid: bid,
        highestBidder: currentUser.id,
        highestBidderName: currentUser.name,
        bidders: newBidders,
        timer: newTimer
      });

      // Log bid to bidHistory subcollection
      await addDoc(collection(db, 'auctions', auctionRoomId, 'bidHistory'), {
        userId: currentUser.id,
        userName: currentUser.name,
        amount: bid,
        timestamp: serverTimestamp(),
        playerName: auction.currentPlayer.name
      });

      setTimer(newTimer);
      setBidAmount('');
      showSuccess(`Bid placed: ${bid}M`);

      // Add activity log
      addActivityLog('bid', `placed a bid of ${bid}M`, auction.currentPlayer?.name, bid, currentUser.id, currentUser.name);
    } catch (error) {
      console.error('Error placing bid:', error);
      showError(error.message || 'Failed to place bid');
    }
  };

  const foldPlayer = async () => {
    try {
      if (auction.foldedUsers && auction.foldedUsers.includes(currentUser.id)) {
        showError('You have already folded');
        return;
      }

      const auctionRef = doc(db, 'auctions', auctionRoomId);
      const newFoldedUsers = [...(auction.foldedUsers || []), currentUser.id];

      await updateDoc(auctionRef, {
        foldedUsers: newFoldedUsers
      });

      showSuccess('You have folded');

      // Check if all users have folded
      const activeUsers = users.filter(u => u.auctionRoomId === auctionRoomId);
      if (newFoldedUsers.length >= activeUsers.length) {
        // All users have folded, declare player unsold immediately
        setTimeout(async () => {
          try {
            await updateDoc(auctionRef, {
              status: 'unsold',
              timer: 0,
              unsoldPlayers: [...(auction.unsoldPlayers || []), auction.currentPlayer.id || auction.currentPlayer.name]
            });
            addActivityLog('auction_end', `All participants folded. ${auction.currentPlayer.name} went unsold`, auction.currentPlayer.name);
          } catch (error) {
            console.error('Error auto-ending auction:', error);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error folding:', error);
    }
  };

  const endAuction = async () => {
    try {
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      if (auction.highestBidder) {
        await runTransaction(db, async (transaction) => {
          const winnerRef = doc(db, 'users', auction.highestBidder);
          const winnerDoc = await transaction.get(winnerRef);
          if (!winnerDoc.exists()) throw new Error('Winner not found');

          const winnerData = winnerDoc.data();
          const newBudget = winnerData.budget - auction.currentBid;
          const newTeam = [...(winnerData.team || []), auction.currentPlayer];

          // Update main user doc
          transaction.update(winnerRef, {
            budget: newBudget,
            team: newTeam
          });

          // Update roomState
          const roomStateRef = doc(db, 'users', auction.highestBidder, 'roomStates', auctionRoomId);
          transaction.set(roomStateRef, {
            budget: newBudget,
            team: newTeam,
            lastUpdated: Date.now()
          }, { merge: true });

          // Update auction
          transaction.update(auctionRef, {
            status: 'sold',
            timer: 0,
            soldPlayers: [...(auction.soldPlayers || []), auction.currentPlayer.id || auction.currentPlayer.name]
          });
        });
        showSuccess('Player sold!');
        addActivityLog('purchase', `bought ${auction.currentPlayer.name} for ${auction.currentBid}M`, auction.currentPlayer.name, auction.currentBid, auction.highestBidder, users.find(u => u.id === auction.highestBidder)?.name);
      } else {
        // Add to unsold players array
        await updateDoc(auctionRef, {
          status: 'unsold',
          timer: 0,
          unsoldPlayers: [...(auction.unsoldPlayers || []), auction.currentPlayer.id || auction.currentPlayer.name]
        });
        showSuccess('Player unsold');
        addActivityLog('auction_end', `Player ${auction.currentPlayer.name} went unsold`, auction.currentPlayer.name);
      }
    } catch (error) {
      console.error('Error ending auction:', error);
      showError('Failed to end auction');
    }
  };

  const startNextAuction = async () => {
    try {
      // Filter out players who are already sold OR unsold
      const soldPlayerIds = new Set(auction.soldPlayers || []);
      const unsoldPlayerIds = new Set(auction.unsoldPlayers || []);
      const availablePlayers = SAMPLE_PLAYERS.filter(p =>
        !soldPlayerIds.has(p.id || p.name) && !unsoldPlayerIds.has(p.id || p.name)
      );

      if (availablePlayers.length === 0) {
        showError('No more players available!');
        return;
      }

      // Tiered selection logic - STRICT ORDER
      // 1. Premium (85-91) - Randomly from this group until empty
      // 2. High Gold (84) - Randomly from this group until empty
      // 3. Others (<84) - Randomly from remaining

      let pool = [];
      let phase = 'regular';

      const premiumPlayers = availablePlayers.filter(p => p.rating >= 85);
      const highGoldPlayers = availablePlayers.filter(p => p.rating === 84);
      const otherPlayers = availablePlayers.filter(p => p.rating < 84);

      if (premiumPlayers.length > 0) {
        pool = premiumPlayers;
        phase = 'premium';
      } else if (highGoldPlayers.length > 0) {
        pool = highGoldPlayers;
        phase = 'gold';
      } else {
        pool = otherPlayers.length > 0 ? otherPlayers : availablePlayers;
        phase = 'silver';
      }

      const randomPlayer = pool[Math.floor(Math.random() * pool.length)];

      // Calculate base price
      // Calculate base price
      let basePrice = 0;
      if (randomPlayer.rating >= 85) basePrice = 50;
      else if (randomPlayer.rating >= 83) basePrice = 30;
      else if (randomPlayer.rating >= 80) basePrice = 15;
      else if (randomPlayer.rating >= 78) basePrice = 5;
      else basePrice = 0; // Free pick

      const auctionRef = doc(db, 'auctions', auctionRoomId);
      await updateDoc(auctionRef, {
        currentPlayer: randomPlayer,
        currentBid: basePrice, // Start at base price
        highestBidder: null,
        highestBidderName: null,
        bidders: [],
        foldedUsers: [],
        status: 'bidding',
        timer: 20,
        basePrice: basePrice,
        currentPhase: phase,
        isPaused: false
      });

      addActivityLog('auction_start', `Auction started for ${randomPlayer.name} (Rating: ${randomPlayer.rating})`, randomPlayer.name);
    } catch (error) {
      console.error('Error starting auction:', error);
      showError('Failed to start auction');
    }
  };

  const pauseAuction = async () => {
    await updateDoc(doc(db, 'auctions', auctionRoomId), { isPaused: true });
  };

  const resumeAuction = async () => {
    await updateDoc(doc(db, 'auctions', auctionRoomId), { isPaused: false });
  };

  const backupAuction = async () => { console.log('Backup not implemented'); };
  const restoreAuction = async () => { console.log('Restore not implemented'); };
  const createAuctionRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      setLoading(true);
      const roomRef = await addDoc(collection(db, 'auctions'), {
        name: newRoomName,
        initialBudget: parseInt(initialBudget),
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        status: 'waiting',
        currentBid: 0,
        highestBidder: null,
        currentPlayer: null,
        bidders: [],
        foldedUsers: [],
        timer: 0,
        soldPlayers: [],
        joinRequests: []
      });

      setAuctionRoomId(roomRef.id);
      setIsAdmin(true);

      // Add creator as a user in the room
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: userName,
        budget: parseInt(initialBudget),
        team: [],
        auctionRoomId: roomRef.id,
        isOnline: true,
        lastActive: serverTimestamp(),
        role: 'admin'
      }, { merge: true });

      // Also set in roomStates subcollection for persistence
      await setDoc(doc(db, 'users', user.uid, 'roomStates', roomRef.id), {
        budget: parseInt(initialBudget),
        team: [],
        role: 'admin',
        joinedAt: serverTimestamp()
      });

      setCurrentUser({
        id: user.uid,
        name: userName,
        budget: parseInt(initialBudget),
        team: [],
        role: 'admin'
      });

      setShowAuctionMenu(false);
      addActivityLog('system', `Room "${newRoomName}" created by ${userName}`);
      showSuccess('Auction room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
      showError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinAuctionRoom = async (roomId) => {
    try {
      setLoading(true);
      const roomRef = doc(db, 'auctions', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        showError('Room not found');
        return;
      }

      const roomData = roomSnap.data();

      // Check if user already has state in this room
      const userRoomStateRef = doc(db, 'users', user.uid, 'roomStates', roomId);
      const userRoomStateSnap = await getDoc(userRoomStateRef);

      let userBudget = roomData.initialBudget || 1000;
      let userTeam = [];
      let userRole = 'manager';

      if (userRoomStateSnap.exists()) {
        const state = userRoomStateSnap.data();
        userBudget = state.budget;
        userTeam = state.team || [];
        userRole = state.role || 'manager';
      }

      // Update main user doc
      await setDoc(doc(db, 'users', user.uid), {
        name: currentUser?.name || userName,
        budget: userBudget,
        team: userTeam,
        auctionRoomId: roomId,
        isOnline: true,
        lastActive: serverTimestamp(),
        role: userRole
      }, { merge: true });

      // Initialize room state if not exists
      if (!userRoomStateSnap.exists()) {
        await setDoc(userRoomStateRef, {
          budget: userBudget,
          team: userTeam,
          role: userRole,
          joinedAt: serverTimestamp()
        });
      }

      setAuctionRoomId(roomId);
      setCurrentUser({
        id: user.uid,
        name: currentUser?.name || userName,
        budget: userBudget,
        team: userTeam,
        role: userRole
      });

      setIsAdmin(userRole === 'admin');
      setShowAuctionMenu(false);
      addActivityLog('system', `${currentUser?.name || userName} joined the room`);
      showSuccess('Joined room successfully!');
    } catch (error) {
      console.error('Error joining room:', error);
      showError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This will reset the auction and all players.')) {
      return;
    }

    try {
      setLoading(true);

      // 1. Reset Auction Room
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      await updateDoc(auctionRef, {
        currentPlayer: null,
        currentBid: 0,
        highestBidder: null,
        bidders: [],
        foldedUsers: [],
        status: 'waiting',
        timer: 0,
        soldPlayers: [],
        joinRequests: []
      });

      // 2. Reset All Users in this room
      const usersQuery = query(collection(db, 'users'), where('auctionRoomId', '==', auctionRoomId));
      const usersSnap = await getDocs(usersQuery);

      const batch = writeBatch(db);

      usersSnap.docs.forEach(userDoc => {
        const userRef = doc(db, 'users', userDoc.id);
        // Reset main user data
        batch.update(userRef, {
          budget: auction.initialBudget || 1000,
          team: []
        });

        // Reset room state
        const roomStateRef = doc(db, 'users', userDoc.id, 'roomStates', auctionRoomId);
        batch.set(roomStateRef, {
          budget: auction.initialBudget || 1000,
          team: [],
          resetAt: serverTimestamp()
        });
      });

      await batch.commit();

      addActivityLog('system', 'Auction room data cleared by admin');
      showSuccess('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      showError('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This cannot be undone.')) return;

    try {
      setLoading(true);

      // Delete the room document
      await deleteDoc(doc(db, 'auctions', roomId));

      // Reset users who were in this room
      const usersQuery = query(collection(db, 'users'), where('auctionRoomId', '==', roomId));
      const usersSnap = await getDocs(usersQuery);

      const batch = writeBatch(db);
      usersSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          auctionRoomId: null
        });
      });
      await batch.commit();

      showSuccess('Room deleted successfully');

      // If current user was in this room, reset their view
      if (auctionRoomId === roomId) {
        setAuctionRoomId(null);
        setShowAuctionMenu(true);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      showError('Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllRooms = async () => {
    if (!window.confirm('WARNING: This will delete ALL auction rooms and reset ALL users. Are you sure?')) return;

    try {
      setLoading(true);

      // Delete all auctions
      const auctionsSnap = await getDocs(collection(db, 'auctions'));
      const batch = writeBatch(db);
      auctionsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Reset all users
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          auctionRoomId: null,
          budget: 1000,
          team: []
        });
      });

      await batch.commit();
      showSuccess('All rooms deleted and users reset');
      setAuctionRoomId(null);
      setShowAuctionMenu(true);
    } catch (error) {
      console.error('Error deleting rooms:', error);
      showError('Failed to delete rooms');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear user's auctionRoomId in Firestore before signing out
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          auctionRoomId: null,
          isOnline: false
        });
      }
      
      await signOut(auth);
      setCurrentUser(null);
      setAuctionRoomId(null);
      setShowNameInput(true);
      setShowAuctionMenu(false);
      setIsSuperAdmin(false);
      setUserName('');
      setUserPassword('');
      showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      showError('Failed to logout');
    }
  };

  const leaveAuctionRoom = async () => {
    try {
      isLeavingRoomRef.current = true; // Prevent auto-rejoin

      // Update user doc to remove auctionRoomId
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          auctionRoomId: null
        });
      }

      setAuctionRoomId(null);
      setShowAuctionMenu(true);
      setActivityLogs([]);
      setMessages([]);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const undoLastBid = async () => {
    if (!isAdmin && !isSuperAdmin) {
      showError('Only admin can undo bids');
      return;
    }

    if (!auction || auction.status !== 'bidding') {
      showError('Can only undo during active bidding');
      return;
    }

    try {
      // Get all bid history and filter client-side to avoid needing Firebase index
      const bidHistoryQuery = query(
        collection(db, 'auctions', auctionRoomId, 'bidHistory'),
        orderBy('timestamp', 'desc'),
        limit(10) // Get last 10 bids
      );
      
      const bidHistorySnap = await getDocs(bidHistoryQuery);
      
      if (bidHistorySnap.empty) {
        showError('No bids to undo');
        return;
      }

      // Filter for current player's bids
      const allBids = bidHistorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const playerBids = allBids.filter(bid => bid.playerName === auction.currentPlayer.name);
      
      if (playerBids.length === 0) {
        showError('No bids to undo for this player');
        return;
      }

      const lastBid = playerBids[0];
      const previousBid = playerBids[1] || null;

      // Delete last bid
      await deleteDoc(doc(db, 'auctions', auctionRoomId, 'bidHistory', lastBid.id));

      // Revert auction state
      const auctionRef = doc(db, 'auctions', auctionRoomId);
      await updateDoc(auctionRef, {
        currentBid: previousBid ? previousBid.amount : auction.basePrice,
        highestBidder: previousBid ? previousBid.userId : null,
        highestBidderName: previousBid ? previousBid.userName : null,
        bidders: previousBid ? auction.bidders.filter(b => b !== lastBid.userId) : []
      });

      showSuccess('Last bid undone successfully');
      addActivityLog('admin', `${currentUser.name} undid last bid`);
    } catch (error) {
      console.error('Error undoing bid:', error);
      showError('Failed to undo bid: ' + error.message);
    }
  };
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: currentUser.id,
        userName: currentUser.name,
        auctionRoomId,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const approveJoinRequest = async (request, budget) => {
    try {
      // 1. Update user's main doc
      await updateDoc(doc(db, 'users', request.userId), {
        auctionRoomId: auctionRoomId,
        budget: budget || 1000
      });

      // 2. Initialize room state if needed
      const roomStateRef = doc(db, 'users', request.userId, 'roomStates', auctionRoomId);
      const roomStateSnap = await getDoc(roomStateRef);

      if (!roomStateSnap.exists()) {
        await setDoc(roomStateRef, {
          budget: budget || 1000,
          team: [],
          joinedAt: serverTimestamp()
        });
      }

      // 3. Remove from requests
      const newRequests = joinRequests.filter(r => r.userId !== request.userId);
      await updateDoc(doc(db, 'auctions', auctionRoomId), { joinRequests: newRequests });

      showSuccess('User approved');
    } catch (error) {
      console.error('Error approving user:', error);
      showError('Failed to approve user');
    }
  };

  const rejectJoinRequest = async (request) => {
    try {
      const newRequests = joinRequests.filter(r => r.userId !== request.userId);
      await updateDoc(doc(db, 'auctions', auctionRoomId), { joinRequests: newRequests });
      showSuccess('User rejected');
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  if (!user && !currentUser) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Authenticating...</div>;
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-green-500 selection:text-white">
        {/* Name Input Screen */}
        {showNameInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            <div className="relative z-10 glass-panel p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-white/10 animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2 drop-shadow-lg">
                  FIFA AUCTION
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-wide">ENTER THE ARENA</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2 ml-1">MANAGER NAME</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="glass-input w-full p-4 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Enter your name..."
                    onKeyPress={(e) => e.key === 'Enter' && submitUserName()}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2 ml-1">PASSWORD</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="glass-input w-full p-4 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Create or enter password..."
                    onKeyPress={(e) => e.key === 'Enter' && submitUserName()}
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-1">
                    * Use the same password to log back in later.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={submitUserName}
                  disabled={!userName.trim() || !userPassword.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  START CAREER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auction Room Selection */}
        {
          showAuctionMenu && !showNameInput && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
              <div className="relative z-10 glass-panel p-6 md:p-8 rounded-2xl max-w-4xl w-full mx-4 shadow-2xl border border-white/10 animate-fade-in h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-1">SELECT AUCTION ROOM</h2>
                    <p className="text-gray-400 text-xs md:text-sm">Join an existing auction or create your own</p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    {isSuperAdmin && (
                      <button
                        onClick={deleteAllRooms}
                        className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors animate-pulse shadow-lg shadow-red-600/20"
                        title="Delete All Rooms (Super Admin)"
                      >
                        🗑️
                      </button>
                    )}
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-bold">{currentUser?.name || userName}</p>
                      <p className="text-xs text-gray-400">Manager</p>
                    </div>
                    <button
                      onClick={logout}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors"
                      title="Logout"
                    >
                      🚪
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1 overflow-hidden">
                  {/* Create Room */}
                  <div className="glass-panel bg-white/5 p-4 md:p-6 rounded-xl border border-white/10 flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                      <span>✨</span> Create New Room
                    </h3>
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="block text-gray-300 text-xs md:text-sm font-bold mb-2">ROOM NAME</label>
                        <input
                          type="text"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          className="glass-input w-full p-3 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="e.g. Champions League Final"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-xs md:text-sm font-bold mb-2">INITIAL BUDGET (M)</label>
                        <input
                          type="number"
                          value={initialBudget}
                          onChange={(e) => setInitialBudget(e.target.value)}
                          className="glass-input w-full p-3 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="1000"
                          min="100"
                          max="5000"
                        />
                      </div>
                      <button
                        onClick={createAuctionRoom}
                        disabled={!newRoomName.trim()}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all mt-auto"
                      >
                        CREATE ROOM
                      </button>
                    </div>
                  </div>

                  {/* Join Room */}
                  <div className="glass-panel bg-white/5 p-4 md:p-6 rounded-xl border border-white/10 flex flex-col overflow-hidden">
                    <h3 className="text-lg md:text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <span>🚀</span> Available Rooms
                    </h3>

                    {auctionRooms.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl p-6">
                        <p className="text-2xl mb-2">📭</p>
                        <p>No active rooms found</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {auctionRooms.map((room) => (
                          <div
                            key={room.id}
                            className="bg-gray-800/50 hover:bg-gray-700/50 p-4 rounded-xl border border-white/5 transition-all cursor-pointer group relative"
                            onClick={() => joinAuctionRoom(room.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{room.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                                  ID: {room.id.slice(0, 4)}
                                </span>
                                {isSuperAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteRoom(room.id);
                                    }}
                                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1 rounded transition-colors z-10"
                                    title="Delete Room"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>💰 Budget: {room.initialBudget}M</span>
                              <span>📅 {new Date(room.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Main Auction UI */}
        {
          !showNameInput && !showAuctionMenu && auctionRoomId && (
            <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
              <div className="min-h-screen bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-black/90 backdrop-blur-sm">

                {/* Header */}
                <header className="sticky top-0 z-40 glass-panel border-b border-white/10 shadow-lg backdrop-blur-md">
                  <div className="container mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-xl">⚽</span>
                        </div>
                        <div>
                          <h1 className="text-xl font-black text-white tracking-tight">FIFA AUCTION</h1>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400 font-mono bg-green-900/30 px-2 py-0.5 rounded border border-green-500/30">
                              ROOM: {auctionRooms.find(r => r.id === auctionRoomId)?.name || auctionRoomId}
                            </span>
                            {/* Connection Status Indicator */}
                            <div className="flex items-center gap-1" title={isOnline ? 'Connected' : 'Disconnected'}>
                              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                              <span className="text-[10px] text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                            {isAdmin && (
                              <span className="text-[10px] font-bold bg-yellow-500 text-black px-1.5 py-0.5 rounded">ADMIN</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {isSuperAdmin && (
                          <button
                            onClick={() => setShowAdminPanel(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all whitespace-nowrap animate-pulse"
                          >
                            <span>🛠️</span> Super Admin
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setShowJoinRequests(true)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${joinRequests.length > 0
                                ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse shadow-lg shadow-orange-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                }`}
                            >
                              <span>🔔</span> Requests ({joinRequests.length})
                            </button>
                            <button
                              onClick={() => setShowViewTeams(true)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all whitespace-nowrap"
                            >
                              <span>👥</span> View Teams
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setShowTeamView(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all whitespace-nowrap"
                        >
                          <span>👕</span> My Squad
                        </button>

                        <button
                          onClick={() => setShowLogsView(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all whitespace-nowrap"
                        >
                          <span>📜</span> Logs
                        </button>

                        <button
                          onClick={leaveAuctionRoom}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all whitespace-nowrap"
                        >
                          <span>🚪</span> Leave
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Reconnection Banner */}
                {isReconnecting && (
                  <div className="bg-yellow-600/90 backdrop-blur text-white p-2 text-center text-sm font-bold animate-pulse sticky top-[65px] z-30">
                    ⚠️ Reconnecting to server...
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="bg-red-600/90 backdrop-blur text-white p-3 text-center text-sm font-bold animate-fade-in sticky top-[65px] z-30 flex justify-between items-center px-4">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">×</button>
                  </div>
                )}
                {success && (
                  <div className="bg-green-600/90 backdrop-blur text-white p-3 text-center text-sm font-bold animate-fade-in sticky top-[65px] z-30 flex justify-between items-center px-4">
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">×</button>
                  </div>
                )}

                <div className="container mx-auto px-2 py-4 md:p-6 max-w-7xl">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">

                    {/* Main Auction Area */}
                    <div className="lg:col-span-3 space-y-4 md:space-y-6">
                      {auction?.currentPlayer ? (
                        <div className="glass-panel rounded-2xl p-4 md:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
                          {/* Background Glow */}
                          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -z-10"></div>
                          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>

                          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                            {/* Player Card */}
                            <div className="flex-shrink-0 mx-auto md:mx-0 perspective-1000">
                              <div className={`relative transform transition-all duration-700 preserve-3d ${isFlipping ? 'rotate-y-180' : ''}`}>
                                <div className="relative group">
                                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                  <img
                                    src={auction.currentPlayer.imageUrl}
                                    alt={auction.currentPlayer.name}
                                    className="relative w-48 h-64 md:w-64 md:h-80 object-cover rounded-xl shadow-2xl ring-1 ring-white/20"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auction.currentPlayer.name)}&size=200&background=1f2937&color=ffffff&format=png&bold=true`;
                                    }}
                                  />

                                  {/* Rating Badge */}
                                  <div className="absolute -top-3 -right-3 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-900 to-black rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-lg z-10">
                                    <span className={`text-xl md:text-2xl font-black ${auction.currentPlayer.rating >= 85 ? 'text-yellow-400' :
                                      auction.currentPlayer.rating >= 80 ? 'text-gray-300' : 'text-orange-400'
                                      }`}>
                                      {auction.currentPlayer.rating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                              <div className="text-center md:text-left mb-4 md:mb-6">
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                                  {auction.currentPlayer.name.toUpperCase()}
                                </h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold text-blue-300 border border-white/10">
                                    {auction.currentPlayer.position}
                                  </span>
                                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold text-gray-300 border border-white/10">
                                    {auction.currentPlayer.team || auction.currentPlayer.club || 'Free Agent'}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${auction.currentPhase === 'premium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    auction.currentPhase === 'gold' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                    {getPhaseDescription(auction.currentPhase || 'premium')}
                                  </span>
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                                {[
                                  { label: 'PAC', val: auction.currentPlayer.pace, color: 'text-yellow-400' },
                                  { label: 'SHO', val: auction.currentPlayer.shooting, color: 'text-red-400' },
                                  { label: 'PAS', val: auction.currentPlayer.passing, color: 'text-green-400' },
                                  { label: 'DRI', val: auction.currentPlayer.dribbling, color: 'text-purple-400' },
                                  { label: 'DEF', val: auction.currentPlayer.defending, color: 'text-blue-400' },
                                  { label: 'PHY', val: auction.currentPlayer.physicality, color: 'text-orange-400' }
                                ].map((stat, i) => (
                                  <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                    <div className={`text-xs font-bold ${stat.color} mb-1`}>{stat.label}</div>
                                    <div className="text-lg font-black text-white">{stat.val}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Auction Status & Timer */}
                              <div className="bg-black/40 rounded-xl p-4 md:p-6 border border-white/10 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                  <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Current Bid</p>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-4xl md:text-5xl font-black text-green-400">{auction.currentBid}M</span>
                                      {auction.highestBidder && (
                                        <span className="text-sm text-gray-400">
                                          by <span className="text-white font-bold">
                                            {auction.highestBidderName || users.find(u => u.id === auction.highestBidder)?.name || 'Unknown'}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Time Left</p>
                                    <span className={`text-4xl md:text-5xl font-black font-mono ${timer <= 5 ? 'text-red-500 animate-pulse' :
                                      timer <= 10 ? 'text-orange-500' : 'text-white'
                                      }`}>
                                      {timer}s
                                    </span>
                                  </div>
                                </div>

                                {/* Status Bar */}
                                <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-1000 ease-linear ${timer <= 5 ? 'bg-red-500' : 'bg-green-500'
                                      }`}
                                    style={{ width: `${(timer / 20) * 100}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Bidding Controls */}
                              {auction.status === 'bidding' && !(auction.foldedUsers || []).includes(currentUser.id) && (
                                <div className="mt-auto">
                                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                    {(() => {
                                      const rating = auction.currentPlayer.rating;
                                      const buttons = rating >= 85 ? [10, 20, 50] :
                                        rating === 84 ? [5, 10, 20, 50] :
                                          [1, 5, 10, 20, 50];
                                      return buttons.map(amount => (
                                        <button
                                          key={amount}
                                          onClick={() => setBidAmount(String(auction.currentBid + amount))}
                                          className="flex-1 min-w-[60px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-sm font-bold text-white transition-all hover:scale-105"
                                        >
                                          +{amount}M
                                        </button>
                                      ));
                                    })()}
                                  </div>

                                  <div className="flex gap-3">
                                    <div className="relative flex-1">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">M</span>
                                      <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="w-full bg-black/50 border-2 border-white/10 focus:border-green-500 rounded-xl py-3 md:py-4 pl-10 pr-4 text-white font-bold text-lg transition-colors"
                                        placeholder="Amount"
                                      />
                                    </div>
                                    <button
                                      onClick={placeBid}
                                      disabled={!bidAmount}
                                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-black text-lg rounded-xl shadow-lg shadow-green-600/20 transition-all transform hover:scale-[1.02] active:scale-95"
                                    >
                                      BID
                                    </button>
                                    <button
                                      onClick={foldPlayer}
                                      className="px-6 md:px-8 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/30 font-bold rounded-xl transition-colors"
                                    >
                                      FOLD
                                    </button>
                                    {(isAdmin || isSuperAdmin) && auction.bidders?.length > 0 && (
                                      <button
                                        onClick={undoLastBid}
                                        className="px-4 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 border border-yellow-600/30 font-bold text-sm rounded-xl transition-colors"
                                        title="Undo Last Bid (Admin)"
                                      >
                                        ⏮️ UNDO
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Folded State */}
                              {(auction.foldedUsers || []).includes(currentUser.id) && (
                                <div className="mt-auto bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                  <p className="text-red-400 font-bold">You have folded for this player</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sold/Unsold Overlays */}
                          {auction.status === 'sold' && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                              <div className="transform rotate-[-12deg] border-8 border-green-500 p-8 rounded-xl bg-green-900/90 shadow-[0_0_100px_rgba(34,197,94,0.5)] animate-stamp">
                                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase">SOLD</h2>
                                <p className="text-2xl md:text-3xl font-bold text-green-300 text-center mt-2">
                                  {auction.currentBid}M
                                </p>
                              </div>
                            </div>
                          )}

                          {auction.status === 'unsold' && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                              <div className="transform rotate-[12deg] border-8 border-red-500 p-8 rounded-xl bg-red-900/90 shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-stamp">
                                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase">UNSOLD</h2>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Waiting State */
                        <div className="glass-panel rounded-2xl p-8 md:p-12 text-center border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
                          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <span className="text-4xl">⏳</span>
                          </div>
                          <h2 className="text-3xl font-bold text-white mb-2">Waiting for Next Auction</h2>
                          <p className="text-gray-400 max-w-md mx-auto">
                            The admin is preparing the next player. Get your budget ready and review your squad strategy.
                          </p>
                        </div>
                      )}

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="glass-panel rounded-xl p-4 md:p-6 border border-white/10">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span>⚡</span> Admin Controls
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              onClick={startNextAuction}
                              disabled={auction?.status === 'bidding'}
                              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                            >
                              {auction?.currentPlayer ? 'Next Player' : 'Start Auction'}
                            </button>
                            <button
                              onClick={endAuction}
                              disabled={auction?.status !== 'bidding'}
                              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                            >
                              End Auction
                            </button>
                            <button
                              onClick={auction?.isPaused ? resumeAuction : pauseAuction}
                              disabled={auction?.status !== 'bidding'}
                              className={`${auction?.isPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'} disabled:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all`}
                            >
                              {auction?.isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button
                              onClick={() => setShowAdminPanel(true)}
                              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                            >
                              Super Admin
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      {/* User Status */}
                      <div className="glass-panel rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-lg font-bold mb-4 text-green-400 flex items-center gap-2">
                          <span>👤</span> Your Status
                        </h3>

                        <div className="mb-4 bg-white/5 rounded-lg p-4 border border-white/5">
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Budget Remaining</p>
                          <p className="text-2xl font-bold text-green-400">{currentUser?.budget || 0}M</p>
                        </div>

                        <div>
                          <p className="text-gray-300 mb-3 text-sm font-semibold flex justify-between">
                            <span>Your Team</span>
                            <span className="text-blue-400">{currentUser?.team?.length || 0}/11</span>
                          </p>
                          {currentUser?.team?.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                              {currentUser?.team?.map((player, index) => (
                                <div key={index} className="bg-white/5 p-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                    <img src={player.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-xs">{player.name}</p>
                                    <p className="text-gray-400 text-[10px]">{player.position} • {player.rating}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-gray-600">
                              <p className="text-gray-500 text-xs italic">No players yet</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chat Button */}
                      <div className="glass-panel rounded-xl p-4 border border-white/10">
                        <button
                          onClick={() => setShowChat(!showChat)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-purple-500/30 transition-all relative transform hover:scale-[1.02]"
                        >
                          💬 Open Chat
                          {unreadMessages > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                              {unreadMessages}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Logout Button */}
                      <div className="glass-panel rounded-xl p-4 border border-white/10">
                        <button
                          onClick={logout}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-red-500/30 transition-all relative transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <span>🚪</span> Logout
                        </button>
                      </div>

                      {/* Leaderboard Button */}
                      <div className="glass-panel rounded-xl p-4 border border-white/10">
                        <button
                          onClick={() => setShowLeaderboard(true)}
                          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 px-4 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-yellow-500/30 transition-all relative transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <span>🏆</span> Leaderboard
                        </button>
                      </div>

                      {/* All Participants */}
                      <div className="glass-panel rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-lg font-bold mb-4 text-blue-400 flex items-center gap-2">
                          <span>👥</span> Participants ({users.length})
                        </h3>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                          {users.map((participant) => (
                            <div key={participant.id} className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-sm text-white">{participant.name}</p>
                                <span className={`w-2.5 h-2.5 rounded-full ${participant.isOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-gray-500'}`}></span>
                              </div>

                              <div className="flex justify-between items-center text-xs">
                                <span className="text-green-400 font-medium">{participant.budget}M</span>
                                <span className="text-gray-400">{participant.team.length}/11</span>
                              </div>

                              {auction?.highestBidder === participant.id && (
                                <div className="mt-2 text-center">
                                  <span className="text-yellow-400 text-[10px] font-bold bg-yellow-900/30 px-2 py-1 rounded border border-yellow-600/30 w-full block">
                                    🔥 Highest Bidder
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Squad Builder Modal */}
        {
          showTeamView && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-white/10 flex flex-col md:flex-row">
                {/* Left: Pitch View */}
                <div className="flex-1 p-6 relative bg-gradient-to-b from-green-900 to-green-800 min-h-[600px] flex items-center justify-center overflow-hidden">
                  {/* Pitch Markings */}
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
                  <div className="absolute top-1/2 left-4 right-4 h-px bg-white/30"></div>
                  <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-48 h-24 border-2 border-t-0 border-white/30 transform -translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-b-0 border-white/30 transform -translate-x-1/2"></div>

                  {/* Formation Selector */}
                  <div className="absolute top-6 right-6 z-10">
                    <select
                      value={selectedFormation}
                      onChange={(e) => setSelectedFormation(e.target.value)}
                      className="glass-input px-4 py-2 rounded-lg font-bold text-white bg-black/50 border border-white/20"
                    >
                      {Object.keys(FORMATIONS).map(f => (
                        <option key={f} value={f}>{FORMATIONS[f].name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Players on Pitch */}
                  {FORMATIONS[selectedFormation].positions.map((pos) => {
                    const assignedPlayerId = squadPositions[pos.id];
                    const player = currentUser?.team?.find(p => (p.id || p.name) === assignedPlayerId);

                    return (
                      <div
                        key={pos.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all hover:scale-110 group"
                        style={{ top: pos.top, left: pos.left }}
                        onClick={() => setSelectedSlot(pos.id)}
                      >
                        {player ? (
                          <>
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-fifa-gold overflow-hidden shadow-[0_0_15px_rgba(255,215,0,0.5)] bg-gray-900 relative z-10">
                              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="mt-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-center border border-white/10 z-20">
                              <p className="text-[10px] md:text-xs font-bold text-white whitespace-nowrap">{player.name}</p>
                              <p className="text-[8px] md:text-[10px] text-fifa-green">{player.rating}</p>
                            </div>
                          </>
                        ) : (
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/60 transition-all ${selectedSlot === pos.id ? 'border-fifa-primary bg-fifa-primary/20 animate-pulse' : ''}`}>
                            <span className="text-white/50 font-bold text-xs md:text-sm">{pos.label}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Player Selection Sidebar */}
                <div className="w-full md:w-80 bg-gray-900/95 border-l border-white/10 flex flex-col">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-white">Squad Bench</h3>
                    <button onClick={() => setShowTeamView(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {selectedSlot ? (
                      <>
                        <p className="text-sm text-gray-400 mb-2">Select player for <span className="text-fifa-primary font-bold">{FORMATIONS[selectedFormation].positions.find(p => p.id === selectedSlot)?.label}</span></p>

                        <button
                          onClick={() => {
                            const newPositions = { ...squadPositions };
                            delete newPositions[selectedSlot];
                            setSquadPositions(newPositions);
                            setSelectedSlot(null);
                          }}
                          className="w-full p-2 mb-2 rounded border border-red-500/30 text-red-400 text-sm hover:bg-red-900/20 transition-colors"
                        >
                          Empty Slot
                        </button>

                        {currentUser?.team?.filter(p => {
                          const isAssigned = Object.values(squadPositions).includes(p.id || p.name);
                          const isAssignedToCurrentSlot = squadPositions[selectedSlot] === (p.id || p.name);
                          return !isAssigned || isAssignedToCurrentSlot;
                        }).map(player => (
                          <div
                            key={player.id || player.name}
                            onClick={() => {
                              setSquadPositions(prev => ({ ...prev, [selectedSlot]: player.id || player.name }));
                              setSelectedSlot(null);
                            }}
                            className={`p-2 rounded border cursor-pointer flex items-center gap-3 transition-all ${squadPositions[selectedSlot] === (player.id || player.name) ? 'bg-fifa-primary/20 border-fifa-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                          >
                            <img src={player.imageUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <div>
                              <p className="font-bold text-sm text-white">{player.name}</p>
                              <p className="text-xs text-gray-400">{player.position} • {player.rating}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 mt-10">
                        <p>Select a position on the pitch to assign a player.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Squad Rating</span>
                      <span className="text-fifa-gold font-bold text-lg">
                        {Object.values(squadPositions).length > 0
                          ? Math.round(Object.values(squadPositions).reduce((acc, pid) => acc + (currentUser.team.find(p => (p.id || p.name) === pid)?.rating || 0), 0) / 11)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Players</span>
                      <span className="text-white font-bold">{Object.keys(squadPositions).length}/11</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Leaderboard Modal */}
        {
          showLeaderboard && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/10">
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-fifa-gold">🏆</span> Live Leaderboard
                  </h2>
                  <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {users
                      .map(u => {
                        const squadRating = u.team.length > 0
                          ? Math.round(u.team.reduce((acc, p) => acc + p.rating, 0) / 11)
                          : 0;
                        return { ...u, squadRating };
                      })
                      .sort((a, b) => b.squadRating - a.squadRating || b.budget - a.budget)
                      .map((u, index) => (
                        <div key={u.id} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-black border-yellow-500/50' : 'bg-white/5 border-white/10'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>{u.name}</p>
                              <p className="text-xs text-gray-400">{u.team.length}/11 Players</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">{u.squadRating}</p>
                            <p className="text-xs text-gray-500">Squad Rating</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div >
            </div >
          )
        }

        {/* Chat Modal */}
        {
          showChat && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-2xl w-full h-[600px] flex flex-col shadow-2xl border border-white/10">
                <div className="bg-gray-900/95 backdrop-blur-md flex justify-between items-center p-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">💬 Auction Chat</h2>
                  <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.userId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl p-3 ${msg.userId === currentUser?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                        }`}>
                        {msg.userId !== currentUser?.id && (
                          <p className="text-xs font-bold text-blue-300 mb-1">{msg.userName}</p>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="glass-input flex-1 p-3 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold px-6 rounded-xl transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Activity Logs Modal */}
        {
          showLogsView && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/10">
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white">📜 Activity Logs</h2>
                  <button onClick={() => setShowLogsView(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6 space-y-3">
                  {activityLogs.map((log, index) => (
                    <div key={log.id || index} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-gray-200 text-sm">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      {log.amount && (
                        <span className="text-green-400 font-bold font-mono">{log.amount}M</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        {/* Super Admin Panel */}
        {
          showAdminPanel && isSuperAdmin && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-2xl w-full border-2 border-red-500/50 shadow-2xl shadow-red-900/20">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-red-500/10">
                  <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                    <span>⚠️</span> Super Admin
                  </h2>
                  <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-900/20 border border-red-500/20 p-4 rounded-xl">
                    <p className="text-red-200 text-sm font-bold">DANGER ZONE: These actions cannot be undone.</p>
                  </div>

                  <button
                    onClick={deleteAllRooms}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span> DELETE ALL ROOMS & RESET DATA
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-xs uppercase">Total Rooms</p>
                      <p className="text-2xl font-bold text-white">{auctionRooms.length}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-xs uppercase">Total Users</p>
                      <p className="text-2xl font-bold text-white">{users.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Join Requests Modal */}
        {
          showJoinRequests && isAdmin && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/10">
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🔔</span> Join Requests
                  </h2>
                  <button onClick={() => setShowJoinRequests(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  {joinRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    joinRequests.map((req) => (
                      <div key={req.userId} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="font-bold text-white text-lg">{req.userName}</p>
                          <p className="text-xs text-gray-400">{new Date(req.requestedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                            <span className="text-gray-400 text-xs">Budget:</span>
                            <input
                              type="number"
                              className="w-20 bg-transparent text-white font-bold focus:outline-none text-right"
                              defaultValue={1000}
                              onChange={(e) => {
                                req.customBudget = parseInt(e.target.value);
                              }}
                            />
                            <span className="text-green-400 font-bold">M</span>
                          </div>
                          <button
                            onClick={() => approveJoinRequest(req, req.customBudget || 1000)}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => rejectJoinRequest(req)}
                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                            title="Reject"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        }

        {/* View Teams Modal (Admin Only) */}
        {showViewTeams && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white">👥 All Participant Teams</h2>
                <button
                  onClick={() => setShowViewTeams(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {users.map((participant) => (
                  <div key={participant.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">{participant.name}</h3>
                        <div className="flex gap-2 text-sm mt-1">
                          <span className="text-green-400">💰 {participant.budget}M</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-blue-400">👕 {participant.team?.length || 0}/11 players</span>
                        </div>
                      </div>
                      {participant.id === auction?.highestBidder && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                          🔥 Current Bidder
                        </span>
                      )}
                    </div>

                    {participant.team && participant.team.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                        {participant.team.map((player, idx) => (
                          <div key={idx} className="bg-black/30 rounded-lg p-2 border border-white/5">
                            <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-yellow-400">{player.rating}</span>
                              <span className="text-gray-400">{player.position}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic mt-2">No players yet</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div >
    </>
  );
}

export default App;
