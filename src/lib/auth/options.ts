import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { consumeRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "E-mail i hasło",
      credentials: { email: { label: "E-mail", type: "email" }, password: { label: "Hasło", type: "password" } },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const limit = await consumeRateLimit({ scope: "login", identifier: parsed.data.email, limit: 10, windowMs: 15 * 60_000 });
        if (!limit.allowed) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !(await verify(user.passwordHash, parsed.data.password))) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id;
      return session;
    },
  },
};
