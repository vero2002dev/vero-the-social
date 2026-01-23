import "./globals.css";
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
        <div className="min-h-screen bg-black text-white">{children}</div>
      </body>
    </html>
  );
}
