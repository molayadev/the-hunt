import { createFileRoute, Link } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { useMyHunts } from '../../features/hunt/useMyHunts';
import { ProfileNameForm } from '../../features/profile/ProfileNameForm';
import { useLocalProfile } from '../../features/profile/useLocalProfile';

export const Route = createFileRoute('/')({
  component: HomeScreen,
});

function HomeScreen() {
  const { profile, saveProfile } = useLocalProfile();
  const { uid } = useSession();
  const { hunts, isLoading } = useMyHunts(profile ? uid : null);

  if (!profile) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="font-display text-4xl font-semibold text-primary">Rastro</h1>
        <ProfileNameForm onSubmit={saveProfile} />
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 p-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Hola, {profile.name}</h1>

      {!isLoading && hunts.length === 0 && (
        <p className="max-w-sm text-center text-muted-foreground">
          Encuentra los rastros de un tesoro escaneando su primer código QR, o únete con un código.
        </p>
      )}

      <ul className="flex w-full max-w-sm flex-col gap-3">
        {hunts.map((hunt) => (
          <li key={hunt.huntId}>
            <Link
              to="/h/$huntId"
              params={{ huntId: hunt.huntId }}
              className="block rounded-md border border-border bg-card p-4"
            >
              <p className="font-display text-lg font-semibold text-foreground">{hunt.title}</p>
              <p className="text-sm text-muted-foreground">
                {hunt.solvedCount} de {hunt.totalCount} · {hunt.completionPct}%
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/join"
        className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
      >
        Unirse a una ruta
      </Link>
    </main>
  );
}
