import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/Toast";
import { LanguageProvider } from "@/context/LanguageContext";
import { APP_NAME, LOGO_PATH } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Voice-enabled personal expense tracker for English and Telugu",
  manifest: "/manifest.json",
  icons: { icon: LOGO_PATH },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body className="relative min-h-screen bg-canvas font-sans text-ink antialiased">
        {/* Fixed background layers — logo watermark, colored glow, faint grid */}
        <div className="bg-watermark" aria-hidden />
        <div className="bg-glow" aria-hidden />
        <div className="bg-grid" aria-hidden />

        <LanguageProvider>
          <Toaster />
          <div className="relative z-10">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
