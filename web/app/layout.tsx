import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"담 · 나의 서재",description:"사진으로 정리하는 나만의 책장"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
