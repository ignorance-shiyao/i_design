import { useIcon, type IconName, type IconOptions } from '@i-design/core';
import { toProps } from '../utils.js';

export interface IconProps extends IconOptions {
  className?: string;
}

export function Icon({ className, ...rest }: IconProps) {
  const behavior = useIcon({ ...rest, extraClass: className });
  return (
    <svg {...toProps(behavior.root)}>
      {behavior.paths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}

export type { IconName };
