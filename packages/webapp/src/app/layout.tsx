import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AAU Student Project Collaboration Explorer',
  description: 'Explore external collaborations in Aalborg University student thesis projects',
  keywords: ['Aalborg University', 'AAU', 'student projects', 'thesis', 'collaboration', 'research'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
