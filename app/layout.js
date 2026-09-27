import "./globals.css";

export const metadata = {
  title: "FlowDesk — Small Business Command Center",
  description: "Manage your tasks, team, and business operations in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-100 antialiased">{children}</body>
    </html>
  );
}
