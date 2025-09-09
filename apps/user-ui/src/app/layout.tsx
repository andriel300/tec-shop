import Header from '../shared/widgets/header';
import './global.css';
import { Inter, Poppins, Roboto } from 'next/font/google';

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
      className={`${inter.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
