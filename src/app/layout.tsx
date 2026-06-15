import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barakat Estate",
  description: "Панель управления объявлениями Barakat Estate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
