import type { Metadata, Viewport } from "next"
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
})

// Display serif for keywords in the word cloud.
const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "오늘의 파편",
  description: "하루의 파편을 모아 일기와 영어로 정리하는 곳",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${gowunBatang.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
