import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastProvider from "./components/ToastProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mai Inji — Afro-Fusion Delights",
  description: "Experience the vibrant intersection of Afro-fusion flavors and premium artisan fast food in Lafia, Nasarawa State.",
  openGraph: {
    title: "Mai Inji — Afro-Fusion Delights",
    description: "FLAVOR THAT FEELS LIKE HOME.",
    images: ["/brand/logo/primary.png"],
  },
  icons: {
    icon: "/brand/logo/primary.png",
    apple: "/brand/logo/primary.png",
  }
};

import { LazyMotion, domAnimation } from "framer-motion";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
      >
        <LazyMotion features={domAnimation}>
          <ErrorBoundary>
            <Header />
            <ToastProvider />
            <main>{children}</main>
            <Footer />
          </ErrorBoundary>
        </LazyMotion>
      </body>
    </html>
  );
}

