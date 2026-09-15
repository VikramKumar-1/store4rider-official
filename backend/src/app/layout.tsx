import Script from "next/script";

export const metadata = {
  title: "Store4Riders API Docs",
  description: "Enterprise Swagger API Documentation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
