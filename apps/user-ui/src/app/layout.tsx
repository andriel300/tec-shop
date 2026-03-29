import './global.css';
import { Nunito_Sans, Rubik, Oregano, Jost } from 'next/font/google';
import { SecurityMonitor } from '../shared/components/SecurityMonitor';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
});

const oregano = Oregano({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-oregano',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata = {
  title: 'Welcome to TecShop',

  description: 'TecShop - Your technology marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${nunitoSans.variable} ${rubik.variable} ${oregano.variable} ${jost.variable}`}
    >
      <body suppressHydrationWarning>
        <SecurityMonitor />
        {children}
      </body>
    </html>
  );
}
