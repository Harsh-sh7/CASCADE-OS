import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './mongoClient';
import connectDB from './db';
import { User } from './models/User';
import nodemailer from 'nodemailer';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        const transport = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        try {
          console.log('[CASCADE] Initiating handshake for:', identifier);
          const result = await transport.sendMail({
            from: `"CASCADE OS" <${process.env.GMAIL_USER}>`,
            to: identifier,
            subject: `[ CASCADE OS ] — Login Access Protocol`,
            html: `
              <div style="background-color: #000; color: #fff; padding: 40px; font-family: monospace;">
                <div style="border: 1px solid #333; padding: 20px; text-align: center;">
                  <h1 style="font-size: 14px; letter-spacing: 4px; border-bottom: 2px solid #fff; padding-bottom: 10px; display: inline-block;">AUTH_LOGIN</h1>
                  <p style="font-size: 12px; color: #888; margin-top: 30px; line-height: 1.6;">A request to authenticate your identity for <strong>CASCADE OS</strong> has been received.</p>
                  <p style="font-size: 11px; color: #555; margin-top: 10px; margin-bottom: 30px;">[ TARGET: ${identifier} ]</p>
                  
                  <a href="${url}" style="display: inline-block; background: #fff; color: #000; padding: 16px 32px; text-decoration: none; font-weight: bold; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">INITIALIZE SESSION_ACCESS</a>
                  
                  <p style="font-size: 10px; color: #333; margin-top: 50px; letter-spacing: 3px;">CASCADE OS — NEURO-ADAPTIVE LIFE DEBUGGER</p>
                </div>
              </div>
            `,
          });
          console.log('[CASCADE] Handshake dispatched:', result.messageId);
        } catch (error) {
          console.error('[CASCADE] Authentication Handshake Error:', error);
          throw new Error('AUTH_PROTOCOL_FAILURE');
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      // Upsert into our custom User model (separate from NextAuth adapter users)
      try {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name || '',
            profile: { rcMultipliers: {}, constraints: [] },
          });
        }
      } catch (e) {
        // Non-fatal — don't block sign-in if Mongoose upsert errors
        console.error('[CASCADE] User upsert error (non-fatal):', e);
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'database' },
  secret: process.env.NEXTAUTH_SECRET,
};
