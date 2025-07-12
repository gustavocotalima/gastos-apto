import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create users
  const hashedPassword = await bcrypt.hash("REDACTED", 12)

  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      name: "user1",
      email: "user1@example.com",
      password: hashedPassword,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      name: "user2",
      email: "user2@example.com",
      password: hashedPassword,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: "user3@example.com" },
    update: {},
    create: {
      name: "user3",
      email: "user3@example.com",
      password: hashedPassword,
    },
  })

  // Create default categories
  const categories = [
    { name: "Condomínio", splitType: "DEFAULT" as const },
    { name: "Internet", splitType: "DEFAULT" as const },
    { name: "Aluguel", splitType: "DEFAULT" as const },
    { name: "Supermercado", splitType: "DEFAULT" as const },
    { name: "Energia", splitType: "DEFAULT" as const },
    { name: "Desconto Total", splitType: "CUSTOM" as const, user1user2: 0, user3: 100 },
    { name: "Garagem user3", splitType: "CUSTOM" as const, user1user2: 33.33, user3: 66.67 },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create current month CIP configuration
  const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  
  await prisma.cipConfiguration.upsert({
    where: { monthYear: currentMonth },
    update: {},
    create: {
      monthYear: currentMonth,
      baseCalculationValue: 516.84,
      tiers: {
        create: [
          { minKwh: 0, maxKwh: 80, percentage: 0 },
          { minKwh: 81, maxKwh: 100, percentage: 3.03 },
          { minKwh: 101, maxKwh: 150, percentage: 5.95 },
          { minKwh: 151, maxKwh: 200, percentage: 7.57 },
          { minKwh: 201, maxKwh: 250, percentage: 9.73 },
          { minKwh: 251, maxKwh: 300, percentage: 10.83 },
          { minKwh: 301, maxKwh: 350, percentage: 12.98 },
          { minKwh: 351, maxKwh: null, percentage: 15.15 },
        ],
      },
    },
  })

  console.log("Seed completed successfully!")
  console.log("Users created:")
  console.log("- user1: user1@example.com / REDACTED")
  console.log("- user2: user2@example.com / REDACTED")
  console.log("- user3: user3@example.com / REDACTED")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })