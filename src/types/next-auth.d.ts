declare module 'next-auth' {
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'USER' | 'ADMIN';
  }

  interface Session {
    expires: string;
    user?: User & {
      id: string;
      role: 'USER' | 'ADMIN';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'ADMIN';
  }
}
