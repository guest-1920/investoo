# Referral Flow Test Script

## Overview

This script tests the complete referral flow to verify that fulfillments are created when users complete referral windows.

## What It Does

1. **Creates a referrer user** with a referral code
2. **Creates 5 referred users** using the referrer's code
3. **Adds wallet balance** to each referred user (>$1000)
4. **Makes plan purchases** for each referred user
5. **Triggers referral tracking** via subscription events
6. **Verifies fulfillment creation** with status `PENDING_SELECTION`

## Prerequisites

- Database must be running
- At least one active referral window configured
- Referral window must have a reward assigned

## How to Run

### Option 1: Using npm script

```bash
cd wallet-system-backend
npm run test:referral-flow
```

### Option 2: Using ts-node directly

```bash
cd wallet-system-backend
npx ts-node -r tsconfig-paths/register scripts/test-referral-flow.ts
```

## Expected Output

```
🚀 Starting Referral Flow Test...

📝 Step 1: Creating referrer user...
✅ Referrer created: abc-123 (Code: TESTREF)

📝 Step 2: Finding active plan...
✅ Using plan: Premium Plan ($1000)

📝 Step 3: Creating 5 referred users and simulating purchases...

  👤 Creating referred user 1...
  ✅ User created: Referred User 1
  💰 Added $1000 to wallet
  📦 Subscription created: sub-123
  💸 Deducted $1000 for purchase
  
  ... (repeats for users 2-5)

📝 Step 4: Checking referral window progress...
✅ Window Progress Found:
   Window: Refer 5 People & Get iPhone 17 Pro
   Progress: 5/5
   Status: COMPLETED
   Reward: iPhone 17 Pro

📝 Step 5: Checking fulfillment creation...
✅ FULFILLMENT CREATED!
   ID: fulfillment-123
   Reward: iPhone 17 Pro (PHYSICAL)
   Status: PENDING_SELECTION
   Created: 2026-01-26

🎉 TEST PASSED! Fulfillment was created successfully!
```

## Troubleshooting

### No fulfillment created

1. Check if referral window exists and is active
2. Verify window has a reward assigned (`rewardId` is not null)
3. Check backend logs for errors
4. Verify the bug fix was applied correctly

### Window progress not found

1. Ensure subscription.purchased event is being emitted
2. Check if WindowsService is properly tracking referrals
3. Verify minimum purchase amount is met

## Cleanup

The script creates test data. To clean up:

```sql
DELETE FROM reward_fulfillments WHERE "userId" IN (
    SELECT id FROM users WHERE email LIKE 'referrer@test.com' OR email LIKE 'referred%@test.com'
);

DELETE FROM subscriptions WHERE "userId" IN (
    SELECT id FROM users WHERE email LIKE 'referrer@test.com' OR email LIKE 'referred%@test.com'
);

DELETE FROM wallet_transactions WHERE "userId" IN (
    SELECT id FROM users WHERE email LIKE 'referrer@test.com' OR email LIKE 'referred%@test.com'
);

DELETE FROM referral_window_progress WHERE "userId" IN (
    SELECT id FROM users WHERE email LIKE 'referrer@test.com' OR email LIKE 'referred%@test.com'
);

DELETE FROM users WHERE email LIKE 'referrer@test.com' OR email LIKE 'referred%@test.com';
```
