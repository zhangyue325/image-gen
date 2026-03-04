import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "./components/top-nav";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Gemini Creative Lab",
  description: "Generate and refine brand images and videos with Gemini and Veo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${spaceMono.variable}`}>
        <TopNav />
        <main>
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <span className="text-sm uppercase tracking-[0.4em] text-[color:var(--ink-muted)]">
                Gemini Creative Lab
              </span>
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-semibold">
                  Generate brand visuals with Gemini and Veo
                </h1>
                <p className="text-base md:text-lg text-[color:var(--ink-muted)] max-w-2xl">
                  Local-first workspace for crafting ad creatives, email visuals,
                  and social media imagery. Upload reference assets, tune your
                  prompts, and save outputs to this machine.
                </p>
              </div>
            </header>

            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
