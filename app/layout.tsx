import type { Metadata } from "next";
import { Inter, Indie_Flower } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const indieFlower = Indie_Flower({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-indie',
});

export const metadata: Metadata = {
  title: "Buzón del Amor",
  description: "Comparte amor en la oficina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${indieFlower.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
