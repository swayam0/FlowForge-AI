import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '../components/providers/QueryProvider';
import { Toaster } from 'sonner';

import { AppLayout } from '../components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowForge AI',
  description: 'AI Workflow Automation Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster theme="dark" position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
