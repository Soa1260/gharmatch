import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@/generated/prisma/client";

/** The Auth.js adapter needs email on user rows, so it gets a client without the default omit. */
const globalForAuth = globalThis as unknown as { authDb?: PrismaClient };
function authDb(): PrismaClient {
  if (!globalForAuth.authDb) {
    globalForAuth.authDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
  }
  return globalForAuth.authDb;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(authDb()),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/signin" },
  // Google only: an account has to exist at Google, which rules out throwaway addresses made up on the spot.
  providers: [Google],
  events: {
    /** Google has already confirmed the address, so a Google sign-in counts as a verified email. Magic links verify themselves. */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user?.id || profile?.email_verified !== true) return;
      await authDb().user.updateMany({ where: { id: user.id, emailVerified: null }, data: { emailVerified: new Date() } });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});
