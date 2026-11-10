import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/sora";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import SceneRoot from "@/components/scene/SceneRoot";
import Nav from "@/components/ui/Nav";

export const metadata: Metadata = {
  title: { default: "CineMood — Discover movies that match your mood", template: "%s · CineMood" },
  description:
    "An immersive movie discovery universe. Tell CineMood how you feel and get films scored for your exact emotional state.",
  applicationName: "CineMood",
};

export const viewport: Viewport = {
  themeColor: "#04050c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <Suspense fallback={<div className="backdrop" aria-hidden />}>
          <SceneRoot />
        </Suspense>
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        <AuthSync />
        <main id="main" className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-24 pb-32 md:px-10 md:pt-32 md:pb-24">
          {children}
        </main>
      </body>
    </html>
  );
}
