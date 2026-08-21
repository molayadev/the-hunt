import type { KeyboardEvent } from 'react';
import { mapNodePosition, mapRowCount } from '../../domain/progress/mapLayout';

export type RouteMapNode =
  | { readonly order: number; readonly state: 'unknown' }
  | {
      readonly order: number;
      readonly state: 'locked';
      readonly id: string;
      readonly title: string;
    }
  | {
      readonly order: number;
      readonly state: 'unlockable';
      readonly id: string;
      readonly title: string;
    }
  | {
      readonly order: number;
      readonly state: 'solved';
      readonly id: string;
      readonly title: string;
    };

export interface RouteMapProps {
  readonly nodes: readonly RouteMapNode[];
  readonly columns?: number;
  readonly onSelect: (stationId: string) => void;
}

const DEFAULT_COLUMNS = 3;
const SPACING = 72;
const NODE_RADIUS = 18;
const MARGIN = 32;

function isInteractive(
  node: RouteMapNode,
): node is Extract<RouteMapNode, { state: 'unlockable' | 'solved' | 'locked' }> {
  return node.state === 'unlockable' || node.state === 'solved' || node.state === 'locked';
}

function nodeLabel(node: RouteMapNode): string {
  switch (node.state) {
    case 'unknown':
      return `Estación ${String(node.order)} — sin descubrir`;
    case 'locked':
      return `${node.title} — bloqueada`;
    case 'unlockable':
      return `${node.title} — resolver`;
    case 'solved':
      return `${node.title} — resuelta`;
  }
}

function nodeFill(node: RouteMapNode): string {
  if (node.state === 'solved') return 'var(--primary)';
  if (node.state === 'unlockable') return 'var(--card)';
  if (node.state === 'locked') return 'var(--muted-foreground)';
  return 'var(--background)';
}

function nodeStroke(node: RouteMapNode): string {
  if (node.state === 'unlockable') return 'var(--primary)';
  if (node.state === 'unknown') return 'var(--muted-foreground)';
  return 'transparent';
}

export function RouteMap({ nodes, columns = DEFAULT_COLUMNS, onSelect }: RouteMapProps) {
  const positioned = nodes.map((node) => ({
    node,
    point: mapNodePosition(node.order, columns, SPACING),
  }));
  const rows = mapRowCount(nodes.length, columns);
  const width = (Math.min(columns, nodes.length || 1) - 1) * SPACING + MARGIN * 2;
  const height = (rows - 1) * SPACING + MARGIN * 2;

  function handleKeyDown(event: KeyboardEvent<SVGCircleElement>, stationId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(stationId);
  }

  return (
    <svg
      viewBox={`${String(-MARGIN)} ${String(-MARGIN)} ${String(width)} ${String(height)}`}
      role="img"
      aria-label="Mapa de la ruta"
      className="w-full max-w-md"
    >
      {positioned.slice(1).map(({ node, point }, index) => {
        const prev = positioned[index];
        if (!prev) return null;
        return (
          <line
            key={`edge-${String(node.order)}`}
            x1={prev.point.x}
            y1={prev.point.y}
            x2={point.x}
            y2={point.y}
            stroke={prev.node.state === 'solved' ? 'var(--primary)' : 'var(--muted)'}
            strokeWidth={3}
          />
        );
      })}
      {positioned.map(({ node, point }) => {
        const interactive = isInteractive(node);
        return (
          <g
            key={`node-${String(node.order)}`}
            transform={`translate(${String(point.x)}, ${String(point.y)})`}
          >
            <circle
              r={NODE_RADIUS}
              fill={nodeFill(node)}
              stroke={nodeStroke(node)}
              strokeWidth={2}
              role={interactive ? 'button' : 'img'}
              tabIndex={interactive ? 0 : -1}
              aria-label={nodeLabel(node)}
              className={interactive ? 'cursor-pointer' : undefined}
              onClick={
                interactive
                  ? () => {
                      onSelect(node.id);
                    }
                  : undefined
              }
              onKeyDown={
                interactive
                  ? (event) => {
                      handleKeyDown(event, node.id);
                    }
                  : undefined
              }
            />
            {node.state === 'solved' && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={16}
                fill="var(--primary-foreground)"
                pointerEvents="none"
              >
                ★
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
