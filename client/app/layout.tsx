import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { RainbowProvider } from "@/lib/providers";
import { Toaster } from "react-hot-toast";
import { auth } from '@clerk/nextjs/server'



const geistSans = localFont({
  src: "./fonts/WorkSans.ttf",
  variable: "--font-geist-sans",
  weight: "100 200 300 400 500 600 700 800 900",
});
const geistMono = localFont({
  src: [
    {
      path: "./fonts/SpaceMono-Bold.ttf",
      weight: "700",

    },
    {
      path: "./fonts/SpaceMono-Regular.ttf",
      weight: "400",
    },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "NEFLEX NFT Marketplace",
  description: "NEFLEX is a distributed NFT marketplace that enables users to mint, list, buy, sell, and auction NFTs with support for royalties and marketplace fees.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();


  return (
    <ClerkProvider dynamic>
      <html lang="en" suppressHydrationWarning suppressContentEditableWarning className="h-full scroll-smooth bg-background">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
          >
          <RainbowProvider>
            <Toaster />
            <Navbar userId={userId} />
              {children}
            <Footer />
          </RainbowProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
