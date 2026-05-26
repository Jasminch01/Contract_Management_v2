import "./globals.css";
import localFont from "next/font/local";
import QueryProvider from "@/provider/QueryProvider";
import { ClerkProvider } from "@clerk/nextjs";

const satoshiFont = localFont({
  src: [
    {
      path: "../asset/font/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../asset/font/Satoshi-Bold.otf",
      weight: "700",
      style: "bold",
    },
    {
      path: "../asset/font/Satoshi-Medium.otf",
      weight: "600",
      style: "medium",
    },
    {
      path: "../asset/font/Satoshi-Light.otf",
      weight: "300",
      style: "light",
    },
  ],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <link rel="shortcut icon" href="/Favicon.png" type="image/x-icon" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Contract Management" />
      <link rel="apple-touch-icon" href="/Favicon.png" />
      <ClerkProvider>
        <body className={satoshiFont.className}>
          <QueryProvider>
            <div>{children}</div>
          </QueryProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
