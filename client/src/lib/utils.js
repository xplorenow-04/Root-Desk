import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MONGO_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(id) {
  return typeof id === 'string' && MONGO_ID_RE.test(id);
}
