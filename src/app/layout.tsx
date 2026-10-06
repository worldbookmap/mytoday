import type { Metadata, Viewport } from "next"
import { Noto_Sans_KR } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
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
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
