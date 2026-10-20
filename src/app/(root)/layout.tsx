import type { Metadata } from "next";

export const metadata: Metadata = { title: "Case № 404" };

export default function RootRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0806" }}>{children}</body>
    </html>
  );
}
