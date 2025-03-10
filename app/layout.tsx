import type { Metadata } from 'next';
import '../src/app/globals.css';
import '../src/styles/fonts.css';

export const metadata: Metadata = {
  title: 'GrymSynth',
  description: 'Text-to-Audio Synthesis Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-text">
        <main className="flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
