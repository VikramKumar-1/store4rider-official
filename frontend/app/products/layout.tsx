import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Store4Riders",
  description: "Browse our collection of premium motorcycle riding gear.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
