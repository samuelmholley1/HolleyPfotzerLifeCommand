import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      // This callback is called whenever a session is checked.
      // We are adding the user's internal ID and active workspace from our database.
      if (session.user) {
        session.user.id = user.id;

        // Fetch the user's profile from the 'users' table to get the active_workspace_id
        const { data: profile } = await supabase
          .from('users')
          .select('active_workspace_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          (session.user as any).active_workspace_id = profile.active_workspace_id;
        }
      }
      return session;
    },
  },
};
