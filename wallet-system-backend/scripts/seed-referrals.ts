/**
 * Seed Script: Populate Referral System Data
 * 
 * Generates sample data for:
 * 1. Rewards Catalog (Physical, Digital)
 * 2. Referral Windows (Active, Upcoming, Expired)
 * 
 * Usage: npx ts-node scripts/seed-referrals.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// Create minimal datasource
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

async function seedReferrals() {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Get a user (optional, just to verify DB connection mostly)
        const users = await queryRunner.query(`SELECT id, email FROM users LIMIT 1`);
        if (users.length > 0) {
            console.log(`👤 DB Check OK - Found users.`);
        }

        // 3. Create Rewards Catalog
        console.log('\n🎁 Creating Rewards Catalog...');
        const rewards = [
            {
                id: randomUUID(),
                name: '50 gm Silver',
                description: '50 gm Silver or equivalent wallet amount credited to your wallet',
                type: 'PHYSICAL',
                value: 4000,
                isActive: true,
                stock: 100,
                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png' // Placeholder
            },
            {
                id: randomUUID(),
                name: '100 gm Silver',
                description: '100 gm Silver or equivalent wallet amount credited to your wallet',
                type: 'PHYSICAL',
                value: 8000,
                isActive: true,
                stock: 100,
                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png'
            },
            {
                id: randomUUID(),
                name: 'iPhone 17 Pro / 10gm Gold',
                description: 'iphone 17 pro or 10gm gold or equivalent wallet amount credit to your wallet',
                type: 'PHYSICAL',
                value: 150000,
                isActive: true,
                stock: 50,
                imageUrl: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-black-titanium-select-202309?wid=940&hei=1112&fmt=png-alpha'
            },
            {
                id: randomUUID(),
                name: 'iPhone 17 Pro',
                description: 'iphone17 pro or equivalent wallet amount credit to your wallet',
                type: 'PHYSICAL',
                value: 150000,
                isActive: true,
                stock: 50,
                imageUrl: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-black-titanium-select-202309?wid=940&hei=1112&fmt=png-alpha'
            },
            {
                id: randomUUID(),
                name: 'Swift',
                description: 'Swift or equivalent wallet amount credit to your wallet',
                type: 'PHYSICAL',
                value: 600000,
                isActive: true,
                stock: 10,
                imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/158679/swift-exterior-right-front-three-quarter.jpeg' // Placeholder
            },
            {
                id: randomUUID(),
                name: 'Scorpio-N',
                description: 'Scopio-N or equivalent wallet amount credit to your wallet',
                type: 'PHYSICAL',
                value: 1500000,
                isActive: true,
                stock: 5,
                imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/40432/scorpio-n-exterior-right-front-three-quarter-75.jpeg' // Placeholder
            },
            {
                id: randomUUID(),
                name: 'Innova Hycros',
                description: 'Innova Hycros or equivalent wallet amount credit to your wallet',
                type: 'PHYSICAL',
                value: 2500000,
                isActive: true,
                stock: 5,
                imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/140809/innova-hycross-exterior-right-front-three-quarter-2.jpeg' // Placeholder
            }
        ];

        for (const r of rewards) {
            await queryRunner.query(
                `INSERT INTO rewards (id, name, description, type, value, "isActive", stock, "imageUrl", "createdAt", "updatedAt", deleted)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), false)`,
                [r.id, r.name, r.description, r.type, r.value, r.isActive, r.stock, r.imageUrl]
            );
        }
        console.log(`✅ Created ${rewards.length} rewards`);

        // REMOVED: Referral Windows creation
        // console.log('\n🪟 Creating Referral Windows...');
        // ...

        // Commit transaction
        await queryRunner.commitTransaction();
        console.log('\n✨ Seeding completed successfully! (Rewards created, no windows)');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

seedReferrals().catch(err => {
    console.error('❌ Critical error:', err);
    process.exit(1);
});
