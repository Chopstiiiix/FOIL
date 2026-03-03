import { classNames } from './classNames';

export function cn(...inputs: Parameters<typeof classNames>) {
  return classNames(...inputs);
}
