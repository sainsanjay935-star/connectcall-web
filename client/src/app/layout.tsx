import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ConnectCall Web",
    description: "Modern real-time chat and calling application",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <SocketProvider>
                        <div className="h-full bg-[#f0f2f5] dark:bg-[#0b141a]">
                            {children}
                        </div>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
