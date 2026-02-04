import { ReactNode } from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 MediQueue Hospital OPD System. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Note: Queue positions may change due to emergency cases.
          </p>
        </div>
      </footer>
    </div>
  );
}
