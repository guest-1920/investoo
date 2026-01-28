import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/roles.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error(
      '❌ Usage: npx ts-node src/cli/create-admin.ts <email> <password> [name]',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);

  const existing = await usersService.findByEmail(email);
  if (existing) {
    console.error('❌ User already exists');
    await app.close();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await usersService.create({
    email,
    password: hashedPassword,
    name,
    role: Role.ADMIN,
    referralCode: `ADMIN_${Date.now()}`,
  });

  console.log(`✅ Admin user created: ${email}`);

  await app.close();
  process.exit(0);
}

bootstrap();
