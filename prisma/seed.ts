import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Default password for all users
  const hashedPassword = await bcrypt.hash("REDACTED", 12)

  // Check if there are any users already
  const existingUsers = await prisma.user.findMany()
  
  if (existingUsers.length === 0) {
    console.log("No users found. Please create users manually or through the application.")
    console.log("Example: Create users via the API or database directly")
  } else {
    console.log(`Found ${existingUsers.length} existing users:`)
    existingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`)
    })
  }

  // Create default categories with equal split (works with any number of users)
  const categories = [
    { name: "Rent", splitType: "EQUAL" as const },
    { name: "Utilities", splitType: "EQUAL" as const },
    { name: "Internet", splitType: "EQUAL" as const },
    { name: "Groceries", splitType: "EQUAL" as const },
    { name: "Electricity", splitType: "EQUAL" as const },
    { name: "Cleaning", splitType: "EQUAL" as const },
    { name: "Maintenance", splitType: "EQUAL" as const },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        splitType: category.splitType,
      },
    })
  }
  console.log(`Created/Updated ${categories.length} categories with EQUAL split type`)

  // Create current month CIP configuration (independent of users)
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
  console.log(`Created/Updated CIP configuration for ${currentMonth}`)

  console.log("\nSeed completed successfully!")
  console.log("\nNote: This application works with any number of users.")
  console.log("Users can be created through:")
  console.log("1. The application's user management interface")
  console.log("2. Direct database insertion")
  console.log("3. API endpoints")
  console.log("\nAll expenses will be automatically split among active users.")
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