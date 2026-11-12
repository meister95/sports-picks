import type { Metadata } from "next";
import "./globals.css";
import "./quick.css";
import "./auth.css";
import { AuthLinkHandler } from "@/components/auth-link-handler";
export const metadata:Metadata={title:"PREDIQ — Sporttipps",description:"Sporttipps mit klarer Begründung und transparentem Ergebnis."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body><AuthLinkHandler/>{children}</body></html>}
