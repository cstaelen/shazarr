export const ROOT_PATH = '/home/app/standalone/api';

export function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(find, 'g'), replace);
}