# FIFA 23 Friends Auction App

A real-time auction web application where friends can bid on FIFA 23 players using React, Firebase, and Tailwind CSS.

## 🚀 Features

- **Real-time Bidding**: Live auction system with automatic timer countdown
- **Player Database**: 30+ FIFA 23 players with ratings 78+
- **Budget Management**: Each player starts with 200M budget
- **Team Building**: Track your acquired players
- **Anonymous Authentication**: Quick join without registration
- **Responsive Design**: Works on desktop and mobile
- **Admin Controls**: First user becomes admin and can start auctions

## 🛠️ Setup Instructions

### 1. Firebase Setup

First, you need to create a Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enable **Firestore Database** and **Authentication**
4. In Authentication, enable **Anonymous** sign-in method
5. Get your Firebase configuration from Project Settings

### 2. Configure Firebase

Replace the Firebase configuration in `App.jsx` (around line 25):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🎮 How to Play

### For the First User (Admin):
1. Open the app - you'll automatically become the admin
2. Click "Start Auction" to begin
3. Use "Next Player" to move to the next auction

### For All Players:
1. Open the app in a new browser/device
2. Share your User ID with friends so they know who you are
3. When an auction starts, enter your bid amount
4. Click "Place Bid" or "Fold" 
5. Build the best team within your budget!

## 📊 Game Rules

- **Starting Budget**: 200M per player
- **Auction Timer**: 20 seconds initially, resets to 15s on each new bid
- **Minimum Bid**: Must be higher than current bid
- **Folding**: Once you fold, you can't bid on that player
- **Winning**: Highest bidder when timer reaches 0 wins the player
- **Budget**: Winning bid is deducted from your budget

## 🏗️ Project Structure

```
fifa-auction-app/
├── App.jsx           # Main application (single file)
├── index.html        # HTML entry point  
├── main.jsx          # React entry point
├── index.css         # Global styles with Tailwind
├── package.json      # Dependencies
├── vite.config.js    # Vite configuration
├── tailwind.config.js # Tailwind configuration
└── postcss.config.js # PostCSS configuration
```

## 🔥 Firebase Collections Structure

### `users/{userId}`
```javascript
{
  name: "Player ABC123",
  budget: 200,
  team: [/* array of player objects */],
  isOnline: true
}
```

### `auction/current`
```javascript
{
  currentPlayer: {/* player object */},
  currentBid: 0,
  highestBidder: "userId",
  bidders: ["userId1", "userId2"],
  foldedUsers: ["userId3"],
  status: "bidding", // waiting, bidding, sold, unsold
  timer: 15
}
```

### `players/{playerId}`
```javascript
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
}
```

## 🎨 Included Players (30+)

The app includes 30+ top FIFA 23 players with ratings 78+:
- Lionel Messi (91)
- Kylian Mbappé (91) 
- Kevin De Bruyne (91)
- Robert Lewandowski (91)
- Karim Benzema (91)
- Erling Haaland (88)
- And many more...

## 🚀 Deployment

### Deploy to Vercel:
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Deploy to Netlify:
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify

## 🔧 Customization

- **Add more players**: Modify the `SAMPLE_PLAYERS` array in `App.jsx`
- **Change starting budget**: Update the budget value in user creation
- **Modify timer**: Change timer values in auction logic
- **Update styling**: Modify Tailwind classes throughout the app

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🐛 Troubleshooting

1. **Authentication Issues**: Ensure Anonymous auth is enabled in Firebase Console
2. **Data not loading**: Check Firebase configuration and Firestore rules
3. **Timer not working**: Check console for JavaScript errors
4. **Styling issues**: Ensure Tailwind CSS is properly configured

## 📄 License

MIT License - feel free to modify and distribute!

---

**Enjoy your FIFA 23 Friends Auction! ⚽🏆**