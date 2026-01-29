const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const username = process.argv[2]
  if (!username) {
    console.error('Por favor, dime el usuario: node make-admin.js <username>')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { isAdmin: true }
    })
    console.log(`✅ ¡Listo! El usuario "${user.username}" ahora es ADMIN.`)
  } catch (e) {
    console.error('❌ Error: No encontré ese usuario o algo falló.', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
