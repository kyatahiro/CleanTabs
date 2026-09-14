


export function ShortURL(url?: string): string {
  if (!url) return '';
  let s = url;
  const u = URL.parse(url);
  if (u?.origin && u?.origin !== 'null') {
    s = u?.origin
  }
  return s
}


export interface Flag {
  id: number;
  always_keep?: boolean;
}

export const DefaultFlags: Flag[] = [];

/**
 * Returns whether a tab is currently producing audio according to the browser.
 */
export function IsTabAudible(tab: { audible?: boolean }): boolean {
  return tab.audible === true
}
