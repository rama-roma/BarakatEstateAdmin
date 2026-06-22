import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial system data...');

  // 1. Создаем дефолтный профиль системы (обязательно для работы UI)
  await prisma.profile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: "Barakat",
      description: "Ваш надежный партнер в недвижимости",
      phone: "+992000000000",
      email: "info@barakat.tj",
      instagram: "",
      telegram: "",
      facebook: "",
      whatsapp: "",
      logoUrl: "/barakat.PNG",
      avatarUrl: "",
      rating: 5,
      dealsCount: 0,
      experienceYears: 1,
      specializations: "",
    },
  });
  console.log('Created default profile.');

  // 2. Создаем чистый аккаунт админа для первого входа
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Главный Администратор',
      email: 'admin@barakat.tj',
      phone: '',
      whatsapp: '',
      telegram: '',
      instagram: '',
      facebook: '',
      avatar: '',
      bio: '',
      rating: 5,
      dealsCount: 0,
      experienceYears: 0,
      specializations: '',
      role: 'admin',
    },
  });
  console.log('Created admin user: login "admin", password "admin123".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
