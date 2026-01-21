import "./globals.css";
import Nav from "./components/Nav";

export const metadata = {
  title: "VERO",
  description: "Rede social com verificação e menos pressão social.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark">
      <body>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <div className="font-semibold text-lg">VERO</div>
              <Nav />
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
