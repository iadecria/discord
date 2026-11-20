/**
 * Which item of the DM sidebar's home block is selected.
 *
 * One function for all three items, because the selection is one fact: two
 * inline conditions per item is how a third page ends up with two items
 * selected at once. The space rail's `@me` item reads it too, to stay active
 * on `/backspace`.
 *
 * `/backspace` is a page in the main area and wins over a lingering channel
 * id. Anywhere else the Friends view is what shows when no channel is open,
 * and with a channel open none of the items is selected.
 */

export type HomeNavItem = 'friends' | 'backspace';

export function activeHomeNavItem(pathname: string, currentChannelId: string | null): HomeNavItem | null {
  if (pathname === '/backspace') return 'backspace';
  if (currentChannelId === null) return 'friends';
  return null;
}
