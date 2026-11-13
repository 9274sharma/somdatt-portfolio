import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/** Single-password gate for /admin. Set ADMIN_PASSWORD (env). */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { password: { label: "Password", type: "password" } },
      authorize(creds) {
        const pw = process.env.ADMIN_PASSWORD;
        if (pw && typeof creds?.password === "string" && creds.password === pw) {
          return { id: "admin", name: "Admin" };
        }
        return null;
      },
    }),
  ],
});
