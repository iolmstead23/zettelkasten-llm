import { Metadata } from "next";
import { Inter } from "next/font/google";
import "styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { NavigationDebugger } from "components/logging/NavigationDebugger";
import Sidebars from "components/ui/Sidebars";
import LogWrapper from "components/logging/LogWrapper";
import { Suspense } from "react";

/**
 * Inter font configuration
 * @constant
 * @type {Font}
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

/**
 * Application metadata configuration
 * @type {Metadata}
 * @property {string} title - Application title
 * @property {string} description - Application description
 */
export const metadata: Metadata = {
  title: "Zettelkasten LLM",
  description: "Created by Ian Olmstead",
};

/**
 * Root layout component for Zettelkasten LLM application
 * @component
 * @example
 * return (
 *   <RootLayout>
 *     {children}
 *   </RootLayout>
 * )
 *
 * @remarks
 * Provides:
 * - Auth0 user authentication context
 * - UI provider context
 * - Dynamic sidebar component
 * - Global font (Inter)
 * - HTML lang attribute
 * - Metadata configuration
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} Root layout wrapper
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="text-center align-middle">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  );

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className}`}>
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>
          <UserProvider>
            <LogWrapper>
              <Sidebars />
              <NavigationDebugger />
              {children}
            </LogWrapper>
          </UserProvider>
        </Suspense>
      </body>
    </html>
  );
}
