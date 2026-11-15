import heroLoungeImg from '../assets/images/hero_infinity_lounge_1794758886584.jpg';
import vipConsoleImg from '../assets/images/station_console_vip_1794758885866.jpg';
import pcArenaImg from '../assets/images/station_pc_arena_1794758887301.jpg';
import cafeRefreshmentsImg from '../assets/images/cafe_craft_refreshments_1794758886787.jpg';
import tournamentEventImg from '../assets/images/tournament_arena_event_1794758887502.jpg';

export const MEDIA_ASSETS = {
  heroLounge: heroLoungeImg,
  vipConsole: vipConsoleImg,
  pcArena: pcArenaImg,
  cafeRefreshments: cafeRefreshmentsImg,
  tournamentEvent: tournamentEventImg,
};

const PATH_MAP: Record<string, string> = {
  '/src/assets/images/hero_infinity_lounge_1794758886584.jpg': heroLoungeImg,
  '/src/assets/images/station_console_vip_1794758885866.jpg': vipConsoleImg,
  '/src/assets/images/station_pc_arena_1794758887301.jpg': pcArenaImg,
  '/src/assets/images/cafe_craft_refreshments_1794758886787.jpg': cafeRefreshmentsImg,
  '/src/assets/images/tournament_arena_event_1794758887502.jpg': tournamentEventImg,
};

export function resolveMediaUrl(url?: string): string {
  if (!url) return heroLoungeImg;
  return PATH_MAP[url] || url;
}
