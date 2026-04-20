import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 이메일이 없거나 허용된 회사 도메인이 아니면 로그인 거부
      if (!user?.email) return false;
      if (allowedDomain && !user.email.toLowerCase().endsWith('@' + allowedDomain.toLowerCase())) {
        return false;
      }
      return true;
    },
  },
});

export { handler as GET, handler as POST };
