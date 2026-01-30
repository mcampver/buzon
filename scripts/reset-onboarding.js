
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetting onboarding status for all users...')

  const result = await prisma.user.updateMany({
    data: {
      hasSeenOnboarding: false
    }
  })

  console.log(`✅ Successfully reset onboarding for ${result.count} users!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
