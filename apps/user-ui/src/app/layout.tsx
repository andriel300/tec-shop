import Header from '../shared/widgets/header';
import ConditionalFooter from '../shared/widgets/conditional-footer';
import './global.css';
import { Inter, Poppins, Roboto, Oregano, Jost } from 'next/font/google';
import { Providers } from './providers';

// Configure your fonts
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
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${roboto.variable} ${oregano.variable} ${jost.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-400px)]">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
