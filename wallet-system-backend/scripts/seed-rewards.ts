import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reward, RewardType } from '../src/referrals/rewards/entities/reward.entity';
import { Repository } from 'typeorm';

const rewardsData = [
  {
    id: '06f33f81-ed49-48b5-a83e-ed4268a423e0',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-26T09:59:55.900Z'),
    name: 'iPhone 17 Pro / 10gm Gold',
    description: 'iphone 17 pro or 10gm gold or equivalent wallet amount credit to your wallet',
    type: RewardType.PHYSICAL,
    value: 1199,
    imageUrl: 'public/rewards/iPhone17_Pro_or_10gm_Gold_bar.png',
    isActive: true,
    stock: 48,
  },
  {
    id: '125f93e4-d3ab-4f3b-a4a3-1b9063e0352d',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-25T10:38:30.11Z'),
    name: 'Swift',
    description: 'Swift or equivalent wallet amount credit to your wallet',
    type: RewardType.PHYSICAL,
    value: 20000,
    imageUrl: 'public/rewards/swift.png',
    isActive: true,
    stock: 10,
  },
  {
    id: '3f1e89ab-45bb-44cc-84fd-07ea642d708f',
    createdAt: new Date('2026-01-25T12:04:37.565Z'),
    updatedAt: new Date('2026-01-26T12:01:16.139Z'),
    name: 'iPhone 17 Pro + 10gm Gold',
    description: null,
    type: RewardType.PHYSICAL,
    value: 3000,
    imageUrl: 'public/rewards/iPhone17_pro_and_10gm_gold_bar.png',
    isActive: true,
    stock: 9,
  },
  {
    id: '6106c1d3-5735-4c82-bb69-1b3653444b6d',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-25T10:38:30.11Z'),
    name: 'Scorpio-N',
    description: 'Scopio-N or equivalent wallet amount credit to your wallet',
    type: RewardType.PHYSICAL,
    value: 15000,
    imageUrl: 'public/rewards/ScorpioN.png',
    isActive: true,
    stock: 5,
  },
  {
    id: '84ac7b80-64fe-424a-86ff-38dd464abdf6',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-28T11:37:49.164Z'),
    name: '100 gm Silver',
    description: '100 gm Silver or equivalent wallet amount credited to your wallet',
    type: RewardType.PHYSICAL,
    value: 330,
    imageUrl: 'public/rewards/100gmSilver.png',
    isActive: true,
    stock: 93,
  },
  {
    id: '9b0ac5ee-a96c-4d46-adce-054845e0f66b',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-26T12:12:05.587Z'),
    name: '50 gm Silver',
    description: '50 gm Silver or equivalent wallet amount credited to your wallet',
    type: RewardType.PHYSICAL,
    value: 165,
    imageUrl: 'public/rewards/50gmSilver.png',
    isActive: true,
    stock: 94,
  },
  {
    id: 'ad746683-6c3f-4171-9e15-7e38d22dfc8a',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-25T10:38:30.11Z'),
    name: 'Innova Hycros',
    description: 'Innova Hycros or equivalent wallet amount credit to your wallet',
    type: RewardType.PHYSICAL,
    value: 35000,
    imageUrl: 'public/rewards/InnoveHycross.png',
    isActive: true,
    stock: 5,
  },
  {
    id: 'dfff0009-fea6-45ae-abc4-f2f90daea342',
    createdAt: new Date('2026-01-25T10:38:30.11Z'),
    updatedAt: new Date('2026-01-25T10:38:30.11Z'),
    name: 'iPhone 17 Pro',
    description: 'iphone17 pro or equivalent wallet amount credit to your wallet',
    type: RewardType.PHYSICAL,
    value: 1199,
    imageUrl: 'public/rewards/iPhone17Pro.png',
    isActive: true,
    stock: 50,
  }
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rewardRepo: Repository<Reward> = app.get(getRepositoryToken(Reward));

  console.log('Seeding Rewards...');

  for (const item of rewardsData) {
    const existing = await rewardRepo.findOneBy({ id: item.id });
    if (existing) {
      console.log(`Updating reward: ${item.name}`);
      await rewardRepo.update(item.id, item as any);
    } else {
      console.log(`Creating reward: ${item.name}`);
      const reward = rewardRepo.create(item as any);
      await rewardRepo.save(reward);
    }
  }

  console.log('Rewards seeded successfully.');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Failed to seed rewards', err);
  process.exit(1);
});
