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
  readonly onSelect: (stationId: string) => void;
}

export function RouteMap(props: RouteMapProps) {
  void props;
  return null;
}
