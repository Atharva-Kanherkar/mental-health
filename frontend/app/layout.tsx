import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import JournalNavigation from '@/components/JournalNavigation';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "Echoes",
    template: "%s | Echoes",
  },
  description: "Echoes — a gentle space where your memories become medicine and music becomes your companion on the hardest days.",
  openGraph: {
    title: 'Echoes',
    description: 'Echoes — a gentle space where your memories become medicine and music becomes your companion on the hardest days.',
    siteName: 'Echoes',
    images: [
      {
        url: '/preview.png',
        width: 1400,
        height: 720,
        alt: 'Echoes — gentle landing preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echoes',
    description: 'A gentle space where your memories become medicine.',
    images: ['/preview.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" className={inter.className}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <JournalNavigation />
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
