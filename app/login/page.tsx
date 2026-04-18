'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  let errorMessage = '';
  if (errorParam === 'OAuthAccountNotLinked') {
    errorMessage = 'Auth Error: Account mismatch. Authenticate with initial provider.';
  } else if (errorParam) {
    errorMessage = 'Auth Error: Connect failure. Retry operation.';
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
    setSent(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 font-mono">
      <div className="w-full max-w-sm animate-slide-up border border-zinc-900 bg-black">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 text-center">
          <div className="w-8 h-8 border border-white mx-auto mb-4 flex items-center justify-center select-none bg-white">
            <span className="text-black font-bold">C</span>
          </div>
          <h1 className="text-white font-bold text-sm tracking-widest uppercase">Sys_Login</h1>
          <p className="text-zinc-500 text-[10px] mt-1 tracking-widest uppercase">
            {sent ? 'Awaiting Handshake' : 'Authenticate to Begin'}
          </p>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-6 p-3 border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs text-center">
              {errorMessage}
            </div>
          )}

          {sent ? (
            <div className="border border-zinc-800 bg-zinc-950 p-6 text-center">
              <Terminal className="w-6 h-6 text-white mx-auto mb-4 opacity-50" />
              <p className="text-zinc-400 text-xs tracking-wider uppercase mb-1">Secure Link Sent</p>
              <p className="text-white text-sm break-all">{email}</p>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                id="google-signin-btn"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider transition-colors mb-6"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70 grayscale contrast-200">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Auth
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-zinc-600 text-[10px] tracking-widest uppercase">Or Manual</span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@host.com"
                  className="w-full px-4 py-3 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-white transition-colors text-center"
                />
                <button
                  id="magic-link-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-300 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Initializing' : 'Request Connection'}
                  {!loading && <ArrowRight className="w-3 h-3" />}
                </button>
              </form>
            </>
          )}
        </div>
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <Link href="/" className="block w-full text-center text-zinc-500 hover:text-white text-[10px] tracking-widest uppercase transition-colors">
            [ Abort ]
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 font-mono">
        <div className="w-full max-w-sm border border-zinc-900 bg-black p-12 text-center text-zinc-500 text-[10px] uppercase tracking-widest">
          Loading_System...
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
