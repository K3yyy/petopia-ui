import "./globals.css";

export const metadata = {
  title: "Petopia | Find a friend. Change a life.",
  description:
    "Find pets, support animal care, and help reunite lost pets with their families.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
