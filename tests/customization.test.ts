import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, loadScene, readPreferences, savePreferences, storageKey } from '../src/customization.ts';

const storage = (raw: string | null) => ({ getItem: () => raw });
test('missing, invalid or inaccessible preferences use snowy winter and yuja tea', () => {
  for (const raw of [null, '{}', 'broken', 'null', '[]', '{"season":"autumn","drink":"unknown"}', '{"season":"unknown","drink":"coffee"}']) {
    assert.deepEqual(readPreferences(storage(raw)), defaults);
  }
  assert.deepEqual(readPreferences({ getItem() { throw new Error('blocked'); } }), defaults);
});
test('valid saved preferences are restored and only selection values are saved', () => {
  const selection = { season: 'autumn', drink: 'coffee' } as const;
  assert.deepEqual(readPreferences(storage(JSON.stringify(selection))), selection);
  let saved = '';
  const loadedSelection = { ...selection, background: '/an-image.png', drinkImage: '/a-drink.png', fallback: false };
  savePreferences({ setItem(key, value) { assert.equal(key, storageKey); saved = value; } }, loadedSelection);
  assert.deepEqual(JSON.parse(saved), selection);
  assert.doesNotThrow(() => savePreferences({ setItem() { throw new Error('quota'); } }, selection));
});
test('loads the actual selected filenames under the deployment base', async () => {
  const calls: string[] = [];
  const result = await loadScene({ season: 'early-winter', drink: 'cocoa' }, '/ongi/', async src => { calls.push(src); });
  assert.deepEqual(calls, ['/ongi/assets/backgrounds/early-winter.png', '/ongi/assets/drinks/cocoa.png']);
  assert.equal(result.fallback, false);
  assert.equal(result.drink, 'cocoa');
});
test('failed background safely falls back while retaining the selected drink', async () => {
  const result = await loadScene({ season: 'autumn', drink: 'coffee' }, '/', async src => {
    if (src.endsWith('/autumn.png')) throw new Error('404');
  });
  assert.equal(result.season, 'snowy-winter');
  assert.equal(result.drink, 'coffee');
  assert.equal(result.fallback, true);
});
test('failed drink uses transparent yuja tea with the selected season', async () => {
  const result = await loadScene({ season: 'early-autumn', drink: 'cocoa' }, '/', async src => {
    if (src.endsWith('/cocoa.png')) throw new Error('404');
  });
  assert.equal(result.season, 'early-autumn');
  assert.equal(result.drink, 'yuja-tea');
  assert.ok(result.drinkImage?.endsWith('/yuja_tea.png'));
});
test('missing default image uses original embedded cup without drawing a second drink', async () => {
  const result = await loadScene(defaults, '/', async src => {
    if (src.endsWith('/yuja_tea.png')) throw new Error('404');
  });
  assert.equal(result.background, '/assets/backgrounds/winter-house.png');
  assert.equal(result.drinkImage, null);
  assert.deepEqual({ season: result.season, drink: result.drink }, defaults);
});
test('all images unavailable rejects so the caller can retain the visible scene', async () => {
  await assert.rejects(loadScene(defaults, '/', async () => { throw new Error('offline'); }));
});
test('does not commit before both images are ready', async () => {
  let release!: () => void;
  const drinkReady = new Promise<void>(resolve => { release = resolve; });
  let completed = false;
  const pending = loadScene(defaults, '/', async src => {
    if (src.includes('/drinks/')) await drinkReady;
  }).then(result => { completed = true; return result; });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(completed, false);
  release();
  await pending;
  assert.equal(completed, true);
});
