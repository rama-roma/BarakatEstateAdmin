import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barakat Estate",
  description: "Панель управления объявлениями Barakat Estate",
  icons: {
    icon: "/barakat.PNG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/barakat.PNG" type="image/png" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
