import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Regime Collapse Monitor | OSINT Intelligence Terminal",
  description: "Client-side geopolitical intelligence dashboard using Goldstone-PITF logistic regression to predict regime collapse probability for 160+ countries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="bg-slate-950 text-slate-200 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
