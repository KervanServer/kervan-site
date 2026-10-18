import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { SITE } from "@/lib/site";
import "./globals.css";
import "./reference.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  display: "swap",
  variable: "--font-manrope",
  weight: "200 800",
});
const space = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  display: "swap",
  variable: "--font-space",
  weight: "300 700",
});
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Kervan — One binary. Every protocol. Total control.",
    template: "%s | Kervan",
  },
  description:
    "FTP, FTPS, SFTP and SCP in one pure Go binary. A shared filesystem, unified authentication, an embedded WebUI and a complete audit trail. Open source. MIT licensed.",
  openGraph: {
    type: "website",
    siteName: "Kervan",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Kervan — One binary. Every protocol. Total control.",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${space.variable}`}
    >
      <head>
        <script>{`try{var t=localStorage.getItem('kervan-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`}</script>
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
