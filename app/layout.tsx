import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'SaansPlan — Family Air Defense Copilot',
  description:
    'Turn city AQI into each family member’s personal PM2.5 exposure score, time-blocked clean air plan, and quantified impact ledger.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const content = (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F7F6F2] text-[#0F172A] selection:bg-teal-600/15 selection:text-teal-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-teal-800 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );

  if (hasClerkKey) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
