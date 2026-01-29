const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function cleanupMessages() {
  console.log('🧹 Limpiando mensajes inconsistentes...')

  // Fix public messages that have a specific recipient (should be null)
  const result = await db.message.updateMany({
    where: {
      isPublic: true,
      toName: {
        not: null
      }
    },
    data: {
      toName: null
    }
  })

  console.log(`✅ Se limpiaron ${result.count} mensajes públicos con destinatario específico`)

  await db.$disconnect()
}

cleanupMessages()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
