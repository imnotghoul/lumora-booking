import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "Lumora — онлайн-запись к специалистам",
    template: "%s — Lumora",
  },
  description:
    "Удобная онлайн-запись к профессионалам: выберите услугу, специалиста и подходящее время.",
  metadataBase: new URL("https://lumora.example"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
