import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./experience.css";
import "./focused.css";
import {storeMode,storeTitles} from "@/lib/store-config";
import {FocusedShell} from "@/components/focused-shell";
import {ResearcherGate} from "@/components/site-extras";
import {StoreShell} from "@/components/storefront";

export const metadata: Metadata = {
  title: storeTitles[storeMode],
  description: "Research peptides, bulk savings, and flexible subscriptions. Build your research box with Inno Aminos.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={'antialiased mode-'+storeMode}><ResearcherGate><div className="site-frame">{storeMode==='shop'?<StoreShell>{children}</StoreShell>:<FocusedShell>{children}</FocusedShell>}</div></ResearcherGate></body>
    </html>
  );
}
