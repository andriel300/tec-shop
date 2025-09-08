import Header from '../shared/widgets/header';
import './global.css';

export const metadata = {
  title: 'Welcome to TecShop',

  description: 'TecShop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
