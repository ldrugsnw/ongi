import { useEffect, useRef, useState } from 'react';
import { defaults, drinks, loadScene, readPreferences, savePreferences, type LoadedScene, type Preferences } from './customization';
import { scene } from './scene';

export function usePersonalScene(reduced: boolean) {
  const [selection, setSelection] = useState<Preferences>(() => {
    try { return readPreferences(window.localStorage); } catch { return { ...defaults }; }
  });
  const [current, setCurrent] = useState<LoadedScene>({ ...defaults, background: scene.background, drinkImage: null, fallback: false });
  const [previous, setPrevious] = useState<LoadedScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotice('');
    loadScene(selection, import.meta.env.BASE_URL).then(next => {
      if (cancelled) return;
      setPrevious(initialized.current && !reduced ? current : null);
      setCurrent(next);
      initialized.current = true;
      setNotice(next.fallback ? '이미지를 불러오지 못해 기본 이미지로 바꿨어요.' : '');
      try { savePreferences(window.localStorage, next); } catch { /* No storage access. */ }
    }).catch(() => {
      if (!cancelled) setNotice('이미지를 불러오지 못했어요. 현재 공간을 유지할게요.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Only a new selection starts an image request; motion changes must not reload it.
  }, [selection]);

  useEffect(() => {
    if (!previous) return;
    if (reduced) { setPrevious(null); return; }
    const timer = setTimeout(() => setPrevious(null), 1050);
    return () => clearTimeout(timer);
  }, [previous, reduced]);

  return { current, previous, loading, notice, choose: setSelection, busy: loading || previous !== null };
}

export function SceneLayer({ value, entering }: { value: LoadedScene; entering?: boolean }) {
  const drink = drinks.find(d => d.id === value.drink)!;
  const label = `${value.season === 'snowy-winter' ? '눈 내리는' : value.season === 'early-winter' ? '초겨울의' : value.season === 'autumn' ? '가을의' : '초가을의'} 찻집, ${drink.label}`;
  return <div className={`scene-layer${entering ? ' entering' : ''}`} aria-hidden={entering === false ? true : undefined}>
    <img className="background" src={value.background} alt={label} draggable="false" />
    {value.drinkImage && <svg className="drink-overlay" viewBox={`0 0 ${scene.width} ${scene.height}`} aria-hidden="true">
      <svg x="1000" y="606" width="374" height="278" viewBox={drink.crop} preserveAspectRatio="xMidYMax meet" overflow="visible">
        <image href={value.drinkImage} width={drink.width} height={drink.height} />
      </svg>
    </svg>}
  </div>;
}
