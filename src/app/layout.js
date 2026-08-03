import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "Auto Instagram Scheduler",
  description: "Schedule and publish Instagram Reels automatically",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
