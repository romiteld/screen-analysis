import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Syne } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Workflow Analyzer - AI-Powered Process Automation Discovery",
  description: "Upload screen recordings and discover automation opportunities with AI analysis. Transform manual workflows into efficient automated processes.",
  keywords: ["workflow automation", "AI analysis", "process optimization", "screen recording", "automation discovery"],
  authors: [{ name: "Workflow Analyzer" }],
  openGraph: {
    title: "Workflow Analyzer - AI-Powered Process Automation Discovery",
    description: "Upload screen recordings and discover automation opportunities with AI analysis.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
