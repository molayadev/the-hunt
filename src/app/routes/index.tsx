import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeScreen,
});

function HomeScreen() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-4xl font-semibold text-primary">Rastro</h1>
      <p className="max-w-sm text-muted-foreground">Búsqueda del tesoro por QR. En construcción.</p>
    </main>
  );
}
