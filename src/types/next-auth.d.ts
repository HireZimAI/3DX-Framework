import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
      clientId: string | null
    }
  }
  interface User {
    role: Role
    clientId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    clientId: string | null
  }
}
