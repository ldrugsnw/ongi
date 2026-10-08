export const seasons = [
  { id: 'early-autumn', label: '초가을', file: 'early-autumn.png' },
  { id: 'autumn', label: '가을', file: 'autumn.png' },
  { id: 'early-winter', label: '초겨울', file: 'early-winter.png' },
  { id: 'snowy-winter', label: '눈 오는 겨울', file: 'snowy-winter.png' },
] as const;
export const drinks = [
  { id: 'coffee', label: '커피', file: 'coffee.png', width: 1448, height: 1086, crop: '189 97 1159 927' },
  { id: 'cocoa', label: '마시멜로 코코아', file: 'cocoa.png', width: 1434, height: 1097, crop: '143 105 1219 952' },
  { id: 'yuja-tea', label: '유자차', file: 'yuja_tea.png', width: 1454, height: 1082, crop: '154 82 1237 948' },
] as const;
export type Season = typeof seasons[number]['id'];
export type Drink = typeof drinks[number]['id'];
export type Preferences = { season: Season; drink: Drink };
export const defaults: Preferences = { season: 'snowy-winter', drink: 'yuja-tea' };
export const storageKey = 'ongi.preferences.v1';

export function readPreferences(storage: Pick<Storage, 'getItem'>): Preferences {
  try {
    const value = JSON.parse(storage.getItem(storageKey) ?? 'null');
    if (value && seasons.some(s => s.id === value.season) && drinks.some(d => d.id === value.drink)) {
      return { season: value.season, drink: value.drink };
    }
  } catch { /* Private browsing and invalid JSON use defaults. */ }
  return { ...defaults };
}
export function savePreferences(storage: Pick<Storage, 'setItem'>, value: Preferences) {
  try { storage.setItem(storageKey, JSON.stringify({ season: value.season, drink: value.drink })); } catch { /* Storage can be unavailable. */ }
}

const imageCache = new Map<string, Promise<void>>();
export function preloadImage(src: string): Promise<void> {
  const existing = imageCache.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error('Image timeout')); }, 15000);
    const finish = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; };
    image.onload = async () => {
      try { await image.decode(); finish(); resolve(); }
      catch (error) { finish(); reject(error); }
    };
    image.onerror = () => { finish(); reject(new Error(`Image unavailable: ${src}`)); };
    image.src = src;
  }).catch(error => { imageCache.delete(src); throw error; });
  imageCache.set(src, promise);
  return promise;
}
export type LoadedScene = Preferences & { background: string; drinkImage: string | null; fallback: boolean };

// A pair is returned only after both images decode, including any fallback files.
export async function loadScene(preferences: Preferences, base: string, load = preloadImage): Promise<LoadedScene> {
  const backgroundUrl = (id: Season) => `${base}assets/backgrounds/${seasons.find(s => s.id === id)!.file}`;
  const drinkUrl = (id: Drink) => `${base}assets/drinks/${drinks.find(d => d.id === id)!.file}`;
  async function resolve<T extends string>(id: T, fallback: T, url: (id: T) => string) {
    try { await load(url(id)); return id; }
    catch { if (id === fallback) throw new Error('Default image unavailable'); await load(url(fallback)); return fallback; }
  }
  const result = await Promise.allSettled([
    resolve(preferences.season, defaults.season, backgroundUrl),
    resolve(preferences.drink, defaults.drink, drinkUrl),
  ]);
  if (result[0].status === 'fulfilled' && result[1].status === 'fulfilled') {
    const season = result[0].value;
    const drink = result[1].value;
    return { season, drink, background: backgroundUrl(season), drinkImage: drinkUrl(drink), fallback: season !== preferences.season || drink !== preferences.drink };
  }
  // The original illustration already contains yuja tea: do not draw a second cup.
  const background = `${base}assets/backgrounds/winter-house.png`;
  await load(background);
  return { ...defaults, background, drinkImage: null, fallback: true };
}
