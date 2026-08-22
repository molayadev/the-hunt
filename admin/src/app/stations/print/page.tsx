'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthGate } from '@/features/auth/AuthGate';
import { useHunt } from '@/features/hunts/useHunt';
import { PrintableQr } from '@/features/stations/PrintableQr';
import { useStations } from '@/features/stations/useStations';

type PerPage = 3 | 4;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export default function PrintStationsPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <main className="p-6">
            <p className="text-neutral-500">Cargando…</p>
          </main>
        }
      >
        <PrintSheet />
      </Suspense>
    </AuthGate>
  );
}

function PrintSheet() {
  const searchParams = useSearchParams();
  const huntId = searchParams.get('huntId');
  const router = useRouter();
  const { hunt } = useHunt(huntId);
  const { stations, isLoading } = useStations(huntId);
  const [perPage, setPerPage] = useState<PerPage>(4);

  useEffect(() => {
    if (!huntId) router.replace('/hunts');
  }, [huntId, router]);

  if (!huntId) return null;

  const qrStations = stations.filter((station) => (station.unlock ?? 'qr') === 'qr');
  const pages = chunk(qrStations, perPage);

  return (
    <>
      <div className="flex flex-col gap-4 p-6 print:hidden">
        <Link href={`/stations?huntId=${huntId}`} className="text-sm text-neutral-500 underline">
          ← Estaciones
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Imprimir códigos QR — {hunt?.title ?? 'Ruta'}</h1>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Por hoja
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value) as PerPage);
              }}
              className="rounded-md border border-neutral-300 px-2 py-1"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
        {isLoading && <p className="text-neutral-500">Cargando…</p>}
        {!isLoading && qrStations.length === 0 && (
          <p className="text-neutral-500">Esta ruta no tiene estaciones con desbloqueo por QR.</p>
        )}
      </div>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className={`qr-page qr-page--${String(perPage)}`}>
          {page.map((station) => (
            <PrintableQr
              key={station.id}
              token={`${huntId}-${station.id}`}
              order={station.order}
              title={station.title}
              icon={hunt?.icon}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        .qr-page {
          display: grid;
          gap: 1rem;
          margin: 0 1.5rem 1.5rem;
        }
        .qr-page--4 {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }
        .qr-page--3 {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr 1fr 1fr;
        }
        @media print {
          .qr-page {
            margin: 0;
            page-break-after: always;
            height: 100vh;
          }
          .qr-page:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .qr-page {
            border: 1px dashed #d4d4d4;
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}
