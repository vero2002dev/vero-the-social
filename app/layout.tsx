import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
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
        <I18nProvider>
          <div className="min-h-screen bg-black text-white">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
