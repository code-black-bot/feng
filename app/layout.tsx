import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FENG 商家智能工作台",
  description: "面向电商商家的订单、售后与 AI Agent 可观测性后台。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
