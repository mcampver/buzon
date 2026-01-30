
// Script to clean up invalid reactions (emoji injection)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting reaction cleanup...')

  // Fetch all reactions to inspect them (Prisma doesn't support length filtering in where clause easily for SQLite/Postgres across versions without raw SQL, 
  // and for safety we'll do it in memory since dataset isn't huge yet)
  const allReactions = await prisma.reaction.findMany({
    select: { id: true, emoji: true }
  })

  console.log(`🔍 Inspecting ${allReactions.length} reactions...`)

  const invalidReactions = allReactions.filter(r => r.emoji.length > 8)

  if (invalidReactions.length === 0) {
    console.log('✨ No invalid reactions found.')
    return
  }

  console.log(`⚠️ Found ${invalidReactions.length} invalid reactions. Deleting...`)

  const ids = invalidReactions.map(r => r.id)

  const result = await prisma.reaction.deleteMany({
    where: {
      id: { in: ids }
    }
  })

  console.log(`✅ Deleted ${result.count} reactions. Database cleaned!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
