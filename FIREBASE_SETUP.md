# Firebase Setup Guide for FIFA Auction App

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" 
3. Project name: `fifa-auction-app`
4. Continue through setup

### 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" sign-in method
5. Click "Save"

### 3. Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "Test mode" (we'll add rules later)
4. Choose location (pick closest to your users)
5. Click "Done"

### 4. Get Web App Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click web icon "</>" to add web app
4. App nickname: `fifa-auction-web`
5. Click "Register app"
6. Copy the firebaseConfig object

### 5. Update App.jsx
Replace the firebaseConfig in App.jsx (lines 25-31) with your actual config.

### 6. Set Firestore Security Rules
Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read all and write only their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Auction collection - everyone can read, authenticated users can write
    match /auction/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Players collection - everyone can read, authenticated users can update isSold field
    match /players/{playerId} {
      allow read: if true;
      allow update: if request.auth != null 
        && request.writeFields.hasOnly(['isSold'])
        && request.resource.data.isSold is bool;
    }
  }
}
```

### 7. Publish Rules
Click "Publish" to save the security rules.

## Example Config Format
Your firebaseConfig should look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Your actual API key
  authDomain: "fifa-auction-app.firebaseapp.com",
  projectId: "fifa-auction-app",
  storageBucket: "fifa-auction-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

## Quick Alternative (For Testing)
If you want to test without Firebase first, I can create a local storage version.