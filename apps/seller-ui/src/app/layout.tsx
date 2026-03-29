import './global.css';
import { Inter, Poppins, Roboto, Space_Grotesk } from 'next/font/google';
import { SecurityMonitor } from '../shared/components/SecurityMonitor';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'TecShop Seller',
  description: 'TecShop Seller Portal - Manage your business',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`min-h-screen bg-gray-50 dark:bg-slate-900 font-heading antialiased ${inter.variable} ${poppins.variable} ${roboto.variable} ${spaceGrotesk.variable}`}
    >
      <body suppressHydrationWarning className="font-sans h-screen overflow-hidden">
        <SecurityMonitor />
        {children}
      </body>
    </html>
  );
}
