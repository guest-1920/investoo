/**
 * Seed Script: Generate Historical Daily Return Logs + Summary Table
 * 
 * This script generates 3 years (~1095 days) of simulated daily return logs
 * for testing the dashboard graph performance with large datasets.
 * It also populates the pre-aggregated summary table.
 * 
 * Usage: npx ts-node scripts/seed-daily-returns.ts
 * 
 * Prerequisites:
 * - Database must be running
 * - Migration for daily_return_summary must be run first
 * - User must exist (uses user5@gmail.com by default)
 * - User must have at least one active subscription
 */

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
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'Investoo',
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

async function seedDailyReturns() {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    const userEmail = 'user5@gmail.com';

    // Find user
    const userResult = await dataSource.query(
        `SELECT id FROM users WHERE email = $1`,
        [userEmail]
    );

    if (userResult.length === 0) {
        console.error(`❌ User ${userEmail} not found. Please register first.`);
        process.exit(1);
    }

    const userId = userResult[0].id;
    console.log(`👤 Found user: ${userId}`);

    // Find user's subscription
    const subscriptionResult = await dataSource.query(
        `SELECT s.id as "subscriptionId", s."planId", p."dailyReturn" 
         FROM subscriptions s
         JOIN plans p ON p.id = s."planId"
         WHERE s."userId" = $1 AND s."isActive" = true
         LIMIT 1`,
        [userId]
    );

    if (subscriptionResult.length === 0) {
        console.error(`❌ No active subscription found for user. Please buy a plan first.`);
        process.exit(1);
    }

    const { subscriptionId, planId, dailyReturn } = subscriptionResult[0];
    console.log(`📦 Found subscription: ${subscriptionId}, dailyReturn: $${dailyReturn}`);

    // Configuration
    const DAYS_TO_GENERATE = 1095; // 3 years
    const DAILY_AMOUNT = Number(dailyReturn) || 1.5; // Use plan's daily return or default
    const VARIANCE = 0.2; // +/- 20% variance for more realistic data

    console.log(`\n📊 Generating ${DAYS_TO_GENERATE} days of daily returns...`);

    // Delete existing seeded data for this user (optional, for re-runs)
    const deleteResult = await dataSource.query(
        `DELETE FROM daily_return_logs WHERE "userId" = $1`,
        [userId]
    );
    console.log(`🗑️  Cleared ${deleteResult[1] || 0} existing log records`);

    // Also clear existing summaries for this user
    const deleteSummaryResult = await dataSource.query(
        `DELETE FROM daily_return_summary WHERE "userId" = $1`,
        [userId]
    );
    console.log(`🗑️  Cleared ${deleteSummaryResult[1] || 0} existing summary records`);

    // Generate historical data
    const today = new Date();
    const records: any[] = [];

    for (let i = DAYS_TO_GENERATE; i >= 0; i--) {
        const creditDate = new Date(today);
        creditDate.setDate(today.getDate() - i);
        creditDate.setHours(0, 0, 0, 0);

        // Add some variance to make data more realistic
        const variance = 1 + (Math.random() - 0.5) * VARIANCE * 2;
        const amount = (DAILY_AMOUNT * variance).toFixed(2);

        records.push({
            id: randomUUID(),
            subscriptionId,
            userId,
            planId,
            amount: Number(amount),
            creditedForDate: creditDate,
            createdAt: creditDate.toISOString(),
            updatedAt: creditDate.toISOString(),
            deleted: false,
        });
    }

    // Batch insert daily return logs
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const values = batch.map((r, idx) => {
            const offset = idx * 9;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
        }).join(', ');

        const params = batch.flatMap(r => [
            r.id,
            r.subscriptionId,
            r.userId,
            r.planId,
            r.amount,
            r.creditedForDate.toISOString().split('T')[0],
            r.createdAt,
            r.updatedAt,
            r.deleted
        ]);

        await dataSource.query(
            `INSERT INTO daily_return_logs (id, "subscriptionId", "userId", "planId", amount, "creditedForDate", "createdAt", "updatedAt", deleted)
             VALUES ${values}
             ON CONFLICT ("subscriptionId", "creditedForDate") DO NOTHING`,
            params
        );

        inserted += batch.length;
        process.stdout.write(`\r⏳ Inserted ${inserted}/${records.length} log records...`);
    }

    console.log(`\n\n✅ Successfully seeded ${records.length} daily return records!`);

    // ========== NOW POPULATE SUMMARY TABLE ==========
    console.log(`\n📊 Building pre-aggregated summary table...`);

    // Build summaries in memory
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

    // Insert summaries
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
                    "totalAmount" = $4,
                    "count" = $5,
                    "updatedAt" = NOW()`,
                [userId, periodType, periodKey, data.totalAmount.toFixed(2), data.count]
            );
            summaryInserted++;
        }

        process.stdout.write(`\r⏳ Inserted ${summaryInserted}/${summaryEntries.length} summary records...`);
    }

    console.log(`\n\n✅ Successfully created ${summaryInserted} summary records!`);

    // ========== VERIFICATION ==========
    console.log(`\n🔍 Verifying data consistency...`);

    // Get totals from logs
    const logTotals = await dataSource.query(
        `SELECT SUM(amount) as total, COUNT(*) as count FROM daily_return_logs WHERE "userId" = $1 AND deleted = false`,
        [userId]
    );

    // Get totals from day summaries (should match logs exactly)
    const summaryTotals = await dataSource.query(
        `SELECT SUM("totalAmount") as total, SUM(count) as count FROM daily_return_summary WHERE "userId" = $1 AND "periodType" = 'day' AND deleted = false`,
        [userId]
    );

    const logTotal = Number(logTotals[0].total).toFixed(2);
    const logCount = Number(logTotals[0].count);
    const summaryTotal = Number(summaryTotals[0].total).toFixed(2);
    const summaryCount = Number(summaryTotals[0].count);

    console.log(`   📜 Daily Return Logs: ${logCount} records, $${logTotal} total`);
    console.log(`   📊 Day Summaries:     ${summaryCount} records, $${summaryTotal} total`);

    if (logTotal === summaryTotal && logCount === summaryCount) {
        console.log(`   ✅ Data integrity verified - totals match!`);
    } else {
        console.log(`   ⚠️  Mismatch detected! Check data.`);
    }

    // Show summary breakdown
    const summaryCounts = await dataSource.query(
        `SELECT "periodType", COUNT(*) as count, SUM("totalAmount") as total 
         FROM daily_return_summary 
         WHERE "userId" = $1 AND deleted = false 
         GROUP BY "periodType"`,
        [userId]
    );

    console.log(`\n📈 Summary Breakdown:`);
    for (const row of summaryCounts) {
        console.log(`   - ${row.periodType.toUpperCase()}: ${row.count} periods, $${Number(row.total).toFixed(2)} total`);
    }

    // Show summary
    const totalProfit = records.reduce((acc, r) => acc + r.amount, 0);
    console.log(`\n📈 Final Summary:`);
    console.log(`   - Date Range: ${records[0].creditedForDate.toISOString().split('T')[0]} to ${records[records.length - 1].creditedForDate.toISOString().split('T')[0]}`);
    console.log(`   - Total Log Records: ${records.length}`);
    console.log(`   - Total Summary Records: ${summaryInserted}`);
    console.log(`   - Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`   - Average Daily: $${(totalProfit / records.length).toFixed(2)}`);

    await dataSource.destroy();
    console.log('\n👋 Done!');
}

seedDailyReturns().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});

