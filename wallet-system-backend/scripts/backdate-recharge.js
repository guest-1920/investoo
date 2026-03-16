export { };
const { DataSource } = require('typeorm');

const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'admin',
    database: 'investodb'
});

async function main() {
    await ds.initialize();
    console.log("Connected to DB.");

    const userEmail = "wowiyiw350@bigonla.com";
    const targetDate = new Date("2026-02-09T00:00:00.000Z");

    const users = await ds.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
    if (users.length === 0) {
        console.error("User not found.");
        process.exit(1);
    }
    const userId = users[0].id;
    console.log(`Found user: ${userId}`);

    // Update Recharges
    const recharges = await ds.query(`SELECT id, amount, status FROM recharge_requests WHERE "userId" = $1 AND amount = 5000`, [userId]);
    if (recharges.length > 0) {
        for (const recharge of recharges) {
            console.log(`Backdating recharge ${recharge.id} (${recharge.amount} USDT) to ${targetDate.toISOString()}`);
            await ds.query(`UPDATE recharge_requests SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2`, [targetDate, recharge.id]);
        }
    } else {
        console.log(`No 5000 USDT recharges found for user.`);
    }

    // Update Wallet Transactions for deposits
    // Usually DEPOSIT or RECHARGE
    const txs = await ds.query(`SELECT id, amount, source FROM wallet_transactions WHERE "userId" = $1 AND amount = 5000 AND type = 'CREDIT'`, [userId]);
    if (txs.length > 0) {
        for (const tx of txs) {
            if (tx.source !== 'DAILY_RETURN') {
                console.log(`Backdating wallet transaction ${tx.id} (Source: ${tx.source}) to ${targetDate.toISOString()}`);
                await ds.query(`UPDATE wallet_transactions SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2`, [targetDate, tx.id]);
            }
        }
    } else {
        console.log(`No matching 5000 USDT wallet transactions found.`);
    }

    // Since the daily returns already ran, we don't need to change the wallet balance.
    // The balance only needs to be backdated in terms of ledger records.
    
    await ds.destroy();
    console.log("Done.");
}

main().catch(console.error);
