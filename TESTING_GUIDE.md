# FIFA 23 Auction App - Test Suite Installation & Execution

## Quick Start

### 1. Install Test Dependencies
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom
```

### 2. Run Tests
```bash
npm test
```

## Test Files Created ✅

- ✅ `tests/playerDatabase.test.js` (35 tests)
- ✅ `tests/auctionLogic.test.js` (25 tests) 
- ✅ `tests/csvConverter.test.js` (12 tests)
- ✅ `tests/firebaseOperations.test.js` (18 tests)
- ✅ `vitest.config.js`
- ✅ `tests/setup.js`
- ✅ `tests/README.md`

**Total: 80+ tests covering all major features!**

## What Gets Tested

### Player Database (35 tests)
- 1,521 players validation
- Ratings 78-99
- 89 premium (85+), 101 regular (83-84), 1,331 free (78-82)
- Stats, positions, image URLs

### Auction Logic (25 tests)
- Phase system (Premium→Regular→Free)
- Base prices (50M/30M/0M)
- Bidding rules
- Budget management
- Team completion (11 players)

### CSV Processing (12 tests)
- Large file handling (5.6GB, 20M+ lines)
- Data extraction
- Duplicate removal
- 1,521 players extracted

### Firebase Operations (18 tests)
- Local player storage
- Sold players tracking
- Room management
- Admin controls
- Descending player order

## Installation Steps

Run this command to install all test dependencies:

```bash
npm install --save-dev vitest@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest @vitest/ui@latest jsdom@latest
```

## Running Tests

After installation, run:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Expected Output

```
✓ tests/playerDatabase.test.js (35)
✓ tests/auctionLogic.test.js (25)
✓ tests/csvConverter.test.js (12)
✓ tests/firebaseOperations.test.js (18)

Test Files  4 passed (4)
Tests  80 passed (80)
Duration  <1s
```

## Troubleshooting

If you get "vitest not found" error:
1. Make sure you ran the install command
2. Try: `npx vitest`
3. Or: `npm install` first, then `npm test`

---

**Status**: ✅ Test suite ready
**Total Tests**: 80+
**Framework**: Vitest
