import { isUrl } from '../../domain/station/isUrl';

export interface HuntIconProps {
  readonly icon: string | undefined;
  readonly title: string;
}

export function HuntIcon({ icon, title }: HuntIconProps) {
  if (!icon) return null;
  if (isUrl(icon)) {
    return <img src={icon} alt={title} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <span aria-hidden="true" className="text-2xl leading-none">
      {icon}
    </span>
  );
}
