import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@easycare.com'
  const password = 'admin123'

  const hashedPassword = await bcrypt.hash(password, 10)

  const existing = await prisma.admin.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('Admin already exists')
    return
  }

  await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      isActive: true,
    },
  })

  console.log('Admin created:')
  console.log('Email:', email)
  console.log('Password:', password)
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())