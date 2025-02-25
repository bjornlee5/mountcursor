import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from './context/AuthContext'
import NavigationWrapper from './components/NavigationWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Image Generator',
  description: 'Generate amazing images using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <AuthProvider>
          <NavigationWrapper>
            {children}
          </NavigationWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
