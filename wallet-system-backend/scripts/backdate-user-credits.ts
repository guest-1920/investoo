import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// Period type enum values (must match the database enum)
const PeriodType = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
} as const;

// Create a minimal datasource for seeding
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

/**
 * Get period key for a given date
 */
function getPeriodKey(date: Date, periodType: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (periodType) {
        case PeriodType.DAY:
            return `${year}-${month}-${day}`;
        case PeriodType.WEEK:
            const weekNum = getISOWeekNumber(date);
            return `${year}-W${String(weekNum).padStart(2, '0')}`;
        case PeriodType.MONTH:
            return `${year}-${month}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

/**
 * Get ISO week number for a date
 */
function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

async function backdateUserCredits() {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    // We take the provided user email
    const userEmail = process.env.TARGET_EMAIL || 'wowiyiw350@bigonla.com';

    // Find user
    const userResult = await dataSource.query(
        `SELECT id, "walletBalance" FROM users WHERE email = $1`,
        [userEmail]
    );

    if (userResult.length === 0) {
        console.error(`❌ User ${userEmail} not found.`);
        process.exit(1);
    }

    const user = userResult[0];
    const userId = user.id;
    console.log(`👤 Found user: ${userId} (${userEmail})`);

    // Backdate the user created AT to Mar 09
    const targetDateStr = '2026-03-09T00:00:00.000Z';
    const targetDate = new Date(targetDateStr);

    console.log(`⏱️ Backdating user creation to ${targetDateStr}`);
    await dataSource.query(`UPDATE users SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2`, [targetDate, userId]);

    // Find the user's active subscription (we assume they just bought ONE plan today)
    const subscriptionResult = await dataSource.query(
        `SELECT s.id as "subscriptionId", s."planId", p."dailyReturn", p.validity 
         FROM subscriptions s
         JOIN plans p ON p.id = s."planId"
         WHERE s."userId" = $1 AND s."isActive" = true
         LIMIT 1`,
        [userId]
    );

    if (subscriptionResult.length === 0) {
        console.error(`❌ No active subscription found for user ${userEmail}. They need an active plan to backdate returns.`);
        process.exit(1);
    }

    const { subscriptionId, planId, dailyReturn, validity } = subscriptionResult[0];
    const dailyAmount = Number(dailyReturn);

    // Calculate new end date based on validity starting from Feb 09
    const newEndDate = new Date(targetDate);
    newEndDate.setDate(newEndDate.getDate() + validity);

    console.log(`⏱️ Backdating subscription ${subscriptionId} to start on ${targetDateStr} and end on ${newEndDate.toISOString()}`);
    await dataSource.query(
        `UPDATE subscriptions SET "startDate" = $1, "endDate" = $2, "createdAt" = $1, "updatedAt" = $1 WHERE id = $3`, 
        [targetDate, newEndDate, subscriptionId]
    );

    console.log(`\n📦 Plan pays out $${dailyAmount} / day.`);

    const startTimestamp = targetDate.getTime();
    // End iteration at TODAY's date (March 16, 2026)
    const endTimestamp = new Date('2026-03-16T00:00:00.000Z').getTime();

    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const daysToSimulate = Math.floor((endTimestamp - startTimestamp) / DAY_IN_MS);

    if (daysToSimulate <= 0) {
        console.log(`⚠️ Calculation shows 0 or negative days to simulate. Is the target date in the future? `);
        process.exit(0);
    }

    console.log(`📊 Generating ${daysToSimulate} days of daily returns and wallet transactions...`);

    const records: any[] = [];
    const walletRecords: any[] = [];
    let totalProfit = 0;

    for (let i = 0; i < daysToSimulate; i++) {
        // Step forward day by day from Mar 09
        const creditDate = new Date(startTimestamp + (i * DAY_IN_MS));
        
        const returnId = randomUUID();

        // 1. Generate the expected daily_return_logs for the graphs
        records.push({
            id: returnId,
            subscriptionId,
            userId,
            planId,
            amount: dailyAmount,
            creditedForDate: creditDate,
            createdAt: creditDate.toISOString(),
            updatedAt: creditDate.toISOString(),
            deleted: false,
        });

        // 2. Generate the wallet_transactions ledger entry that credits the user
        walletRecords.push({
            id: randomUUID(),
            userId,
            type: 'CREDIT',     // WalletTransactionType.CREDIT
            amount: dailyAmount,
            source: 'DAILY_RETURN', // WalletTransactionSource.DAILY_RETURN
            referenceId: returnId,
            status: 'SUCCESS',    // WalletTransactionStatus.SUCCESS
            createdAt: creditDate.toISOString(),
            updatedAt: creditDate.toISOString(),
            deleted: false
        });

        totalProfit += dailyAmount;
    }

    // Batch insert daily return logs
    const BATCH_SIZE = 100;

    console.log(`\n💾 Inserting daily_return_logs...`);
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const values = batch.map((r, idx) => {
            const offset = idx * 9;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
        }).join(', ');

        const params = batch.flatMap(r => [
            r.id, r.subscriptionId, r.userId, r.planId, r.amount, 
            r.creditedForDate.toISOString().split('T')[0], r.createdAt, r.updatedAt, r.deleted
        ]);

        await dataSource.query(
            `INSERT INTO daily_return_logs (id, "subscriptionId", "userId", "planId", amount, "creditedForDate", "createdAt", "updatedAt", deleted)
             VALUES ${values}
             ON CONFLICT ("subscriptionId", "creditedForDate") DO NOTHING`,
            params
        );
    }

    console.log(`💾 Inserting wallet_transactions ledger entries...`);
    for (let i = 0; i < walletRecords.length; i += BATCH_SIZE) {
        const batch = walletRecords.slice(i, i + BATCH_SIZE);

        const values = batch.map((r, idx) => {
            const offset = idx * 10;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
        }).join(', ');

        const params = batch.flatMap(r => [
            r.id, r.userId, r.type, r.amount, r.source, r.referenceId, r.status, r.createdAt, r.updatedAt, r.deleted
        ]);

        await dataSource.query(
            `INSERT INTO wallet_transactions (id, "userId", "type", "amount", "source", "referenceId", "status", "createdAt", "updatedAt", "deleted")
             VALUES ${values}`,
            params
        );
    }

    // ========== NOW POPULATE SUMMARY TABLE ==========
    console.log(`\n📊 Building pre-aggregated summary table for graphs...`);

    const summaries: Map<string, { totalAmount: number; count: number }> = new Map();

    for (const record of records) {
        const periodTypes = [PeriodType.DAY, PeriodType.WEEK, PeriodType.MONTH];

        for (const periodType of periodTypes) {
            const periodKey = getPeriodKey(record.creditedForDate, periodType);
            const key = `${periodType}:${periodKey}`;

            const existing = summaries.get(key) || { totalAmount: 0, count: 0 };
            summaries.set(key, {
                totalAmount: existing.totalAmount + record.amount,
                count: existing.count + 1,
            });
        }
    }

    let summaryInserted = 0;
    const summaryEntries = Array.from(summaries.entries());

    for (let i = 0; i < summaryEntries.length; i += BATCH_SIZE) {
        const batch = summaryEntries.slice(i, i + BATCH_SIZE);

        for (const [key, data] of batch) {
            const [periodType, periodKey] = key.split(':');

            await dataSource.query(
                `INSERT INTO daily_return_summary ("id", "userId", "periodType", "periodKey", "totalAmount", "count", "createdAt", "updatedAt", "deleted")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW(), false)
                 ON CONFLICT ("userId", "periodType", "periodKey") DO UPDATE SET
                    "totalAmount" = "daily_return_summary"."totalAmount" + $4,
                    "count" = "daily_return_summary"."count" + $5,
                    "updatedAt" = NOW()`,
                [userId, periodType, periodKey, data.totalAmount.toFixed(2), data.count]
            );
            summaryInserted++;
        }
    }

    console.log(`✅ Computed ${summaryInserted} summary aggregations!`);

    console.log(`\n💰 Finalizing Database Sync...`);
    const newWalletBalance = Number(user.walletBalance) + totalProfit;
    
    // Add total profit safely directly into their wallet_balance
    await dataSource.query(`UPDATE users SET "walletBalance" = "walletBalance" + $1 WHERE id = $2`, [totalProfit, userId]);

    // ========== VERIFICATION ==========
    
    console.log(`\n📈 Final Report for ${userEmail}:`);
    console.log(`   - Date Range Generated: Mar 09 -> Mar 16`);
    console.log(`   - Days processed: ${daysToSimulate}`);
    console.log(`   - Backdated Amount Added: $${totalProfit.toFixed(2)}`);
    console.log(`   - New Wallet Balance: $${newWalletBalance.toFixed(2)}`);

    await dataSource.destroy();
    console.log('\n🥂 Backdate completed successfully!');
}

backdateUserCredits().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
