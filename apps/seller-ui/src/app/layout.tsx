import './global.css';
import { Inter, Poppins, Roboto } from 'next/font/google';

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
      className={`min-h-screen bg-slate-900 font-heading antialiased ${inter.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body suppressHydrationWarning className="font-sans">
        {children}
      </body>
    </html>
  );
}
