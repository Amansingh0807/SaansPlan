import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F2] p-4">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create Your SaansPlan Account
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Family Air Defense Copilot · Protect your family from severe winter smog
        </p>
      </div>
      <Suspense
        fallback={
          <div className="h-96 w-full max-w-sm rounded-2xl border border-[#E4E1D8] bg-white p-6 shadow-sm flex items-center justify-center font-mono text-xs text-slate-500">
            Loading sign up…
          </div>
        }
      >
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </Suspense>
    </main>
  );
}
