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
        {children}
      </body>
    </html>
  );

  if (hasClerkKey) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
