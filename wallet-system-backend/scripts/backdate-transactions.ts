import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'admin',
    database: process.env.DB_NAME || 'investodb',
    synchronize: false,
    logging: false,
});

async function backdateSpecificTransactions() {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    const userEmail = 'wowiyiw350@bigonla.com';
    const targetDate = new Date('2026-03-08T12:00:00.000Z');

    // 1. Find user
    const userResult = await dataSource.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
    if (userResult.length === 0) {
        console.error(`❌ User ${userEmail} not found.`);
        process.exit(1);
    }
    const userId = userResult[0].id;

    console.log(`👤 Backdating transactions for userId: ${userId} to March 8, 2026...`);

    // 2. Update Deposit transaction (+5000)
    // Looking for source REPLICATED or DEPOSIT or RECHARGE depending on schema
    const depositUpdate = await dataSource.query(
        `UPDATE wallet_transactions 
         SET "createdAt" = $1, "updatedAt" = $1 
         WHERE "userId" = $2 AND amount = 5000 AND type = 'CREDIT'
         RETURNING id, source, "referenceId"`,
        [targetDate, userId]
    );

    if (depositUpdate.length > 0) {
        console.log(`✅ Updated ${depositUpdate.length} Deposit transactions.`);
        for (const tx of depositUpdate) {
            if (tx.source === 'RECHARGE' && tx.referenceId) {
                console.log(`   - Updating linked RechargeRequest: ${tx.referenceId}`);
                await dataSource.query(
                    `UPDATE recharge_requests SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2`,
                    [targetDate, tx.referenceId]
                );
            }
        }
    } else {
        console.warn('⚠️ No Deposit transaction of 5000 found for this user.');
    }

    // 3. Update Plan Purchase transaction (-5000)
    const purchaseUpdate = await dataSource.query(
        `UPDATE wallet_transactions 
         SET "createdAt" = $1, "updatedAt" = $1 
         WHERE "userId" = $2 AND amount = 5000 AND type = 'DEBIT'
         RETURNING id, source, "referenceId"`,
        [targetDate, userId]
    );

    if (purchaseUpdate.length > 0) {
        console.log(`✅ Updated ${purchaseUpdate.length} Plan Purchase transactions.`);
        for (const tx of purchaseUpdate) {
            if (tx.source === 'PLAN_PURCHASE' && tx.referenceId) {
                console.log(`   - Updating linked Subscription: ${tx.referenceId}`);
                await dataSource.query(
                    `UPDATE subscriptions SET "createdAt" = $1, "updatedAt" = $1, "startDate" = $1 WHERE id = $2`,
                    [targetDate, tx.referenceId]
                );
            }
        }
    } else {
        console.warn('⚠️ No Plan Purchase (Debit) transaction of 5000 found for this user.');
    }

    await dataSource.destroy();
    console.log('\n✨ Transaction backdating completed!');
}

backdateSpecificTransactions().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
