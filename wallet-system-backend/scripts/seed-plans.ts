import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../src/plans/plan.entity';
import { Repository } from 'typeorm';

const plansData = [
  {
    id: '076a9793-319b-4549-ade7-c0a82e154251',
    createdAt: new Date('2026-01-25T11:00:39.933Z'),
    updatedAt: new Date('2026-01-26T10:54:07.732Z'),
    name: '20,000 USDT',
    price: 20000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 400,
    rewardId: '125f93e4-d3ab-4f3b-a4a3-1b9063e0352d',
  },
  {
    id: '093fbb2e-25fc-47d3-8d65-d38c518359d6',
    createdAt: new Date('2026-01-25T10:50:24.877Z'),
    updatedAt: new Date('2026-01-26T18:43:55.077Z'),
    name: '100 USDT',
    price: 100,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 0.25,
    rewardId: null,
  },
  {
    id: '0cd05d81-b10f-41ee-b85f-f13b784356c7',
    createdAt: new Date('2026-01-25T10:52:49.684Z'),
    updatedAt: new Date('2026-01-26T10:54:52.966Z'),
    name: '1,000 USDT',
    price: 1000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 7.5,
    rewardId: '9b0ac5ee-a96c-4d46-adce-054845e0f66b',
  },
  {
    id: '31696bc2-2f34-4d28-b48b-65e84c02a458',
    createdAt: new Date('2026-01-25T11:02:42.315Z'),
    updatedAt: new Date('2026-01-26T10:53:24.701Z'),
    name: '100,000 USDT',
    price: 100000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 4000,
    rewardId: 'ad746683-6c3f-4171-9e15-7e38d22dfc8a',
  },
  {
    id: '37022b9b-81f2-4b87-928b-7d78f91451f4',
    createdAt: new Date('2026-01-25T10:58:33.360Z'),
    updatedAt: new Date('2026-01-26T10:54:27.636Z'),
    name: '5,000 USDT',
    price: 5000,
    validity: 300,
    description: '',
    status: 'ACTIVE',
    dailyReturn: 62.5,
    rewardId: '06f33f81-ed49-48b5-a83e-ed4268a423e0',
  },
  {
    id: '4e007f58-a7c9-47c1-aad3-1553a5587ec5',
    createdAt: new Date('2026-01-25T10:59:38.010Z'),
    updatedAt: new Date('2026-01-26T10:54:17.010Z'),
    name: '10,000 USDT',
    price: 10000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 150,
    rewardId: '3f1e89ab-45bb-44cc-84fd-07ea642d708f',
  },
  {
    id: '540a2915-2339-4eea-9284-9fe3b80a4d87',
    createdAt: new Date('2026-01-25T11:01:38.013Z'),
    updatedAt: new Date('2026-01-26T10:53:34.168Z'),
    name: '50,000 USDT',
    price: 50000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 1500,
    rewardId: '6106c1d3-5735-4c82-bb69-1b3653444b6d',
  },
  {
    id: '5a5e821e-8474-46e7-904f-3def88848bd7',
    createdAt: new Date('2026-01-25T10:51:27.644Z'),
    updatedAt: new Date('2026-01-26T10:55:10.637Z'),
    name: '300 USDT',
    price: 300,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 0.9,
    rewardId: null,
  },
  {
    id: '69fdca66-017c-408b-9380-bda81e57cc11',
    createdAt: new Date('2026-01-25T10:52:03.614Z'),
    updatedAt: new Date('2026-01-26T18:50:33.186Z'),
    name: '500 USDT',
    price: 500,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 2.5,
    rewardId: null,
  },
  {
    id: 'a2114232-537b-47e0-9e38-38df02b4eda0',
    createdAt: new Date('2026-01-25T10:53:30.140Z'),
    updatedAt: new Date('2026-01-26T10:54:38.154Z'),
    name: '3,000 USDT',
    price: 3000,
    validity: 300,
    description: null,
    status: 'ACTIVE',
    dailyReturn: 30,
    rewardId: '84ac7b80-64fe-424a-86ff-38dd464abdf6',
  }
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const planRepo: Repository<Plan> = app.get(getRepositoryToken(Plan));

  console.log('Seeding Plans...');

  for (const item of plansData) {
    const existing = await planRepo.findOneBy({ id: item.id });
    if (existing) {
      console.log(`Updating plan: ${item.name}`);
      await planRepo.update(item.id, item as any);
    } else {
      console.log(`Creating plan: ${item.name}`);
      const plan = planRepo.create(item as any);
      await planRepo.save(plan);
    }
  }

  console.log('Plans seeded successfully.');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Failed to seed plans', err);
  process.exit(1);
});
