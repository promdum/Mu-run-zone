import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { RunsProvider } from "@/components/RunsProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MU RUN ZONE | มหาวิทยาลัยมหิดล ศาลายา",
    template: "%s | MU RUN ZONE",
  },
  description:
    "ชุมชนวิ่งเพื่อสุขภาพ ความสนุก และความสามัคคี ของนักศึกษาและบุคลากรมหาวิทยาลัยมหิดล วิทยาเขตศาลายา",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${thai.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <RunsProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <SiteFooter />
        </RunsProvider>
      </body>
    </html>
  );
}
