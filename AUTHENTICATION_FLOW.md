# IntelliSecure Authentication Flow

## Overview
The system now supports two types of accounts:
1. **Customer/User Account** - For individual consumers
2. **Business Account** - For merchants and business owners

## Sign-In Flow

### Step 1: Homepage
- User visits `localhost:5174` (Homepage)
- Clicks "Sign in with Google" button
- Redirected to `/login` page

### Step 2: Login Page
User sees two options:

#### Option A: Personal Account (Customer)
- Blue-themed card
- Features:
  - Track personal transactions
  - Monitor spending patterns
  - Get fraud alerts
  - View transaction history
- Clicking "Sign in with Google" → Creates/uses account with `accountType: 'user'`
- Redirects to → `/dashboard` (User Dashboard)

#### Option B: Business Account
- Green-themed card
- Features:
  - Monitor business revenue
  - Track customer transactions
  - Advanced analytics
  - Fraud detection for incoming payments
- Clicking "Sign in with Google" → Creates/uses account with `accountType: 'business'`
- Redirects to → `/business-dashboard` (Business Dashboard)

### Step 3: Dashboard Display

#### User Dashboard (`/dashboard`)
- **Theme**: Blue accents
- **Tracks**: Outgoing transactions (where user sent money)
- **Query**: `where("senderUPI", "==", userUpiId)`
- **Shows**:
  - Current Balance
  - Total Spending
  - Transaction Count
  - Monthly spending line chart
  - Spending by category pie chart
- **Redirects business users** to `/business-dashboard`

#### Business Dashboard (`/business-dashboard`)
- **Theme**: Green accents
- **Tracks**: Incoming transactions (where business received money)
- **Query**: `where("recipientUPI", "==", businessUpiId)`
- **Shows**:
  - Total Revenue
  - Total Customers (unique senders)
  - Total Transactions
  - Average Transaction Value
  - Monthly revenue bar chart
  - Top products/services pie chart
- **Redirects regular users** to `/dashboard`

## Database Structure

### User Document (Firebase)
```javascript
{
  uid: string,
  name: string,
  email: string,
  photoURL: string,
  upiId: string,
  accountType: 'user' | 'business', // NEW FIELD
  businessName: string,              // Only for business accounts
  businessCategory: string,          // Only for business accounts
  createdAt: timestamp,
  transactionDetails: object,
  modelData: object,
  balance: number                    // Only for user accounts
}
```

### Transaction Document (Firebase)
```javascript
{
  senderUPI: string,      // Who sent the money
  recipientUPI: string,   // Who received the money
  amount: number,
  remarks: string,        // Product/service category
  type: 'outgoing',
  status: 'Completed',
  createdAt: timestamp
}
```

## Protection Mechanism

### Dashboard Protection
- When user loads `/dashboard`:
  1. Checks `accountType` in Firebase
  2. If `accountType === 'business'` → Redirect to `/business-dashboard`
  3. If `accountType === 'user'` or undefined → Show user dashboard

### Business Dashboard Protection
- When user loads `/business-dashboard`:
  1. Checks `accountType` in Firebase
  2. If `accountType !== 'business'` → Redirect to `/dashboard`
  3. If `accountType === 'business'` → Show business dashboard

## Testing the Flow

### Test Case 1: New Customer Sign-In
1. Clear Firebase data for test user
2. Go to homepage → Click "Sign in with Google"
3. On login page → Click "Sign in with Google" under "Personal Account"
4. Verify:
   - Redirected to `/dashboard`
   - Shows blue-themed dashboard
   - Firebase user has `accountType: 'user'`

### Test Case 2: New Business Sign-In
1. Clear Firebase data for test user
2. Go to homepage → Click "Sign in with Google"
3. On login page → Click "Sign in with Google" under "Business Account"
4. Verify:
   - Redirected to `/business-dashboard`
   - Shows green-themed dashboard
   - Firebase user has `accountType: 'business'`

### Test Case 3: Existing User Try to Access Business Dashboard
1. Sign in as regular user (customer)
2. Manually navigate to `/business-dashboard`
3. Verify:
   - Automatically redirected to `/dashboard`

### Test Case 4: Existing Business Try to Access User Dashboard
1. Sign in as business user
2. Manually navigate to `/dashboard`
3. Verify:
   - Automatically redirected to `/business-dashboard`

## Routes Summary

| Route | Purpose | Accessible By |
|-------|---------|---------------|
| `/` | Homepage with sign-in button | Everyone |
| `/login` | Choose account type | Everyone |
| `/dashboard` | User dashboard (spending analytics) | User accounts only |
| `/business-dashboard` | Business dashboard (revenue analytics) | Business accounts only |
| `/transactions` | Transaction history | Both (shows respective data) |
| `/predict` | AI fraud detection | Both |

## Notes
- Existing users (before this update) will default to `accountType: 'user'`
- Sign-out clears all state and redirects to homepage
- Auth state listener ensures real-time sync
- Console logs added for debugging during testing
