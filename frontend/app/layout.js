import "./globals.css";

export const metadata = {
  title: "Elecciones 2026 - Encuesta y Actas",
  description: "Encuesta publica y registro de actas: Fuerza Popular vs Juntos por el Peru",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
