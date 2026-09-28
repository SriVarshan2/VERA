import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type Role = "visitor" | "participant" | "judge" | "organizer" | "admin";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValid = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "vera-fallback-secret-2026",
};

/**
 * Gets the current session user on server-side.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Enforces role isolation in API route handlers.
 * Returns { user, response: null } if allowed, or { user: null, response: NextResponse } if unauthorized.
 */
export async function enforceApiAuth(allowedRoles?: Role[]) {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Admin always has bypass authorization access
    if (user.role !== "admin" && !allowedRoles.includes(user.role as Role)) {
      return {
        user: null,
        response: NextResponse.json(
          { error: `Forbidden: Role '${user.role}' is not authorized to perform this action` },
          { status: 403 }
        ),
      };
    }
  }

  return { user, response: null };
}
