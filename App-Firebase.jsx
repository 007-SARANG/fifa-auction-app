import React, { useState, useEffect, useCallback } from 'react';
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
  limit 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Import the complete FIFA 23 player database (500 players, 82+ rating)
import FILTERED_FIFA_PLAYERS from './fifa-players-82plus.js';

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

// Use the complete FIFA 23 database (500 players, 82+ rating)
const SAMPLE_PLAYERS = FILTERED_FIFA_PLAYERS.map(player => ({
  ...player,
  imageUrl: getPlayerPhoto(player.name) // Apply better photo mapping
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

  // Initialize sample data
  const initializeSampleData = useCallback(async () => {
    if (dataInitialized) return;
    
    try {
      // Check if players already exist
      const playersQuery = query(collection(db, 'players'), limit(1));
      const playersSnapshot = await getDocs(playersQuery);
      
      if (playersSnapshot.empty) {
        console.log('Initializing FIFA 23 player data...');
        // Add sample players to Firestore
        const playersCollection = collection(db, 'players');
        for (const player of SAMPLE_PLAYERS) {
          await addDoc(playersCollection, player);
        }
        console.log(`FIFA 23 data initialized with ${SAMPLE_PLAYERS.length} players!`);
      }

      // Initialize auction document if it doesn't exist
      const auctionRef = doc(db, 'auction', 'current');
      await setDoc(auctionRef, {
        currentPlayer: null,
        currentBid: 0,
        highestBidder: null,
        bidders: [],
        foldedUsers: [],
        status: 'waiting',
        timer: 0
      }, { merge: true });

      setDataInitialized(true);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, [dataInitialized]);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Create or update user document
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          name: `Player ${user.uid.slice(-6)}`,
          budget: 200,
          team: [],
          isOnline: true
        }, { merge: true });
        
        // Check if this is the first user (admin)
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        if (usersSnapshot.size === 1) {
          setIsAdmin(true);
        }
        
        await initializeSampleData();
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

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    // Listen to current user data
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUser({ id: doc.id, ...doc.data() });
      }
    });

    // Listen to auction state
    const unsubscribeAuction = onSnapshot(doc(db, 'auction', 'current'), (doc) => {
      if (doc.exists()) {
        const auctionData = doc.data();
        setAuction(auctionData);
        setTimer(auctionData.timer || 0);
      }
    });

    // Listen to all users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
    });

    return () => {
      unsubscribeUser();
      unsubscribeAuction();
      unsubscribeUsers();
    };
  }, [user]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0 && auction?.status === 'bidding') {
      const interval = setInterval(async () => {
        const newTimer = timer - 1;
        setTimer(newTimer);
        
        // Update timer in Firestore
        const auctionRef = doc(db, 'auction', 'current');
        await updateDoc(auctionRef, { timer: newTimer });
        
        // End auction when timer reaches 0
        if (newTimer === 0) {
          await endAuction();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, auction?.status]);

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
      
      // Get random unsold player
      const playersQuery = query(
        collection(db, 'players'),
        where('isSold', '==', false),
        where('rating', '>=', 82)
      );
      
      const playersSnapshot = await getDocs(playersQuery);
      
      if (playersSnapshot.empty) {
        showError('No more players available for auction!');
        return;
      }
      
      const availablePlayers = [];
      playersSnapshot.forEach((doc) => {
        availablePlayers.push({ id: doc.id, ...doc.data() });
      });
      
      const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
      
      // Update auction state
      const auctionRef = doc(db, 'auction', 'current');
      await updateDoc(auctionRef, {
        currentPlayer: randomPlayer,
        currentBid: 0,
        highestBidder: null,
        bidders: [],
        foldedUsers: [],
        status: 'bidding',
        timer: 20
      });
      
      showSuccess(`Auction started for ${randomPlayer.name}!`);
    } catch (error) {
      console.error('Error starting auction:', error);
      showError('Failed to start auction');
    }
  };

  const placeBid = async () => {
    try {
      clearMessages();
      
      const bid = parseInt(bidAmount);
      
      if (!bid || bid <= 0) {
        showError('Please enter a valid bid amount');
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
      
      if (auction.foldedUsers.includes(user.uid)) {
        showError('You have already folded on this player');
        return;
      }
      
      // Use transaction to ensure consistency
      await runTransaction(db, async (transaction) => {
        const auctionRef = doc(db, 'auction', 'current');
        const auctionDoc = await transaction.get(auctionRef);
        
        if (!auctionDoc.exists()) {
          throw new Error('Auction not found');
        }
        
        const currentAuction = auctionDoc.data();
        
        if (bid <= currentAuction.currentBid) {
          throw new Error('Bid must be higher than current bid');
        }
        
        // Update auction with new bid
        const newBidders = [...new Set([...currentAuction.bidders, user.uid])];
        
        transaction.update(auctionRef, {
          currentBid: bid,
          highestBidder: user.uid,
          bidders: newBidders,
          timer: 15 // Reset timer to 15 seconds
        });
      });
      
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
      
      if (auction.foldedUsers.includes(user.uid)) {
        showError('You have already folded on this player');
        return;
      }
      
      const auctionRef = doc(db, 'auction', 'current');
      const newFoldedUsers = [...auction.foldedUsers, user.uid];
      
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
      const auctionRef = doc(db, 'auction', 'current');
      
      if (auction.highestBidder) {
        // Player sold
        await runTransaction(db, async (transaction) => {
          const winnerRef = doc(db, 'users', auction.highestBidder);
          const winnerDoc = await transaction.get(winnerRef);
          
          if (!winnerDoc.exists()) {
            throw new Error('Winner not found');
          }
          
          const winnerData = winnerDoc.data();
          
          // Update winner's budget and team
          transaction.update(winnerRef, {
            budget: winnerData.budget - auction.currentBid,
            team: [...winnerData.team, auction.currentPlayer]
          });
          
          // Mark player as sold
          const playersQuery = query(
            collection(db, 'players'),
            where('name', '==', auction.currentPlayer.name)
          );
          
          const playersSnapshot = await getDocs(playersQuery);
          if (!playersSnapshot.empty) {
            const playerDoc = playersSnapshot.docs[0];
            transaction.update(playerDoc.ref, { isSold: true });
          }
          
          // Update auction status
          transaction.update(auctionRef, {
            status: 'sold',
            timer: 0
          });
        });
        
        const winnerName = users.find(u => u.id === auction.highestBidder)?.name || 'Unknown';
        showSuccess(`${auction.currentPlayer.name} sold to ${winnerName} for ${auction.currentBid}M!`);
      } else {
        // Player unsold
        await updateDoc(auctionRef, {
          status: 'unsold',
          timer: 0
        });
        
        showSuccess(`${auction.currentPlayer.name} went unsold!`);
      }
    } catch (error) {
      console.error('Error ending auction:', error);
      showError('Error ending auction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-400">FIFA 23 Friends Auction</h1>
          <div className="text-sm">
            <span className="text-gray-300">Your ID: </span>
            <span className="text-green-400 font-mono">{user.uid}</span>
            <div className="text-xs text-gray-400 mt-1">
              Database: {SAMPLE_PLAYERS.length} players (82+ rating)
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
                {auction.status === 'bidding' && !auction.foldedUsers.includes(user.uid) && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Place Your Bid</h3>
                    
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount"
                        className="flex-1 bg-gray-600 text-white p-3 rounded-lg border border-gray-500 focus:border-green-400 focus:outline-none"
                        min={auction.currentBid + 1}
                        max={currentUser.budget}
                      />
                      
                      <button
                        onClick={placeBid}
                        disabled={!bidAmount || parseInt(bidAmount) <= auction.currentBid || parseInt(bidAmount) > currentUser.budget}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors"
                      >
                        Place Bid
                      </button>
                      
                      <button
                        onClick={foldPlayer}
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold transition-colors"
                      >
                        Fold
                      </button>
                    </div>
                  </div>
                )}

                {auction.foldedUsers.includes(user.uid) && (
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
                
                <button
                  onClick={startNextAuction}
                  disabled={auction?.status === 'bidding'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  {auction?.currentPlayer ? 'Next Player' : 'Start Auction'}
                </button>
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
    </div>
  );
}

export default App;