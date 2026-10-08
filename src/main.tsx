import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { scene } from './scene';
import './style.css';

function useSystemMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

const flakes = Array.from({ length: 50 }, (_, i) => ({
  x: 1170 + ((i * 137) % 460),
  y: (i * 73) % 700,
  radius: 1.4 + (i % 3) * 0.5,
  delay: -(i * 1.83),
  duration: scene.snowSeconds + (i % 7) * 2,
}));

function Atmosphere() {
  return <svg className="atmosphere" viewBox={`0 0 ${scene.width} ${scene.height}`} aria-hidden="true">
    <defs>
      <clipPath id="window-panes">
        {scene.panes.map(points => <polygon key={points} points={points} />)}
      </clipPath>
      <mask id="indoor-objects" maskUnits="userSpaceOnUse" x="0" y="0" width={scene.width} height={scene.height}>
        <rect width={scene.width} height={scene.height} fill="white" />
        {scene.foreground.map(points => <polygon key={points} points={points} fill="black" />)}
      </mask>
      <radialGradient id="warm-glow">
        <stop offset="0" stopColor="#ffb24b" stopOpacity=".42" />
        <stop offset=".4" stopColor="#ff9c39" stopOpacity=".2" />
        <stop offset="1" stopColor="#ff9834" stopOpacity="0" />
      </radialGradient>
      <clipPath id="fire-opening"><path d={scene.fireOpening} /></clipPath>
      <radialGradient id="fire-core">
        <stop offset="0" stopColor="#fff0b0" stopOpacity=".8" />
        <stop offset=".45" stopColor="#ffd36a" stopOpacity=".5" />
        <stop offset="1" stopColor="#ff9630" stopOpacity="0" />
      </radialGradient>
      <filter id="soft-steam" x="-100%" y="-40%" width="300%" height="180%">
        <feGaussianBlur stdDeviation="2.5" />
      </filter>
    </defs>
    <circle className="fire-glow" cx={scene.fire.x} cy={scene.fire.y} r={scene.fire.radius} fill="url(#warm-glow)" />
    <g clipPath="url(#fire-opening)">
      <ellipse className="fire-core" cx={scene.fire.x} cy={scene.fire.y} rx="90" ry="100" fill="url(#fire-core)" />
    </g>
    <g clipPath="url(#window-panes)" mask="url(#indoor-objects)">
      {flakes.map((flake, i) => <circle key={i} className="snowflake" cx={flake.x} cy={flake.y} r={flake.radius}
        fill="#fff5e4" style={{ animationDelay: `${flake.delay}s`, animationDuration: `${flake.duration}s` }} />)}
    </g>
    <g transform={`translate(${scene.cup.x} ${scene.cup.y})`} fill="none" stroke="#fff4e0" strokeWidth="12" strokeLinecap="round" filter="url(#soft-steam)">
      {[0, 1, 2].map(i => <path key={i} className="steam" d={`M ${-35 + i * 31} -14 C ${-53 + i * 31} -35, ${-12 + i * 31} -48, ${-30 + i * 31} -70 S ${-42 + i * 31} -93, ${-20 + i * 31} -112`}
        style={{ animationDelay: `${-i * scene.steamSeconds / 3}s` }} />)}
    </g>
  </svg>;
}

function SoundIcon({ playing }: { playing: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4Z" />
    {playing ? <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></> : <path d="m16 9 5 6m0-6-5 6" />}
  </svg>;
}

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(35);
  const [message, setMessage] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const systemMotion = useSystemMotion();
  const reduced = reduceMotion || systemMotion;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio || pendingRef.current) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    pendingRef.current = true;
    setLoading(true);
    setMessage('');
    try {
      // Only a user gesture starts sound. Missing or unsupported files are harmless.
      audio.volume = volume / 100;
      audio.load();
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setMessage('음원을 재생할 수 없어요. 그림은 그대로 즐겨주세요.');
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }

  const style = {
    '--scene-ratio': `${scene.width} / ${scene.height}`,
    '--scene-width': `${scene.width / scene.height * 100}svh`,
    '--steam-duration': `${scene.steamSeconds}s`,
    '--fire-duration': `${scene.fireSeconds}s`,
  } as CSSProperties;

  return <main className={`teahouse${reduced ? ' reduced-motion' : ''}`} style={style}>
    <header className="identity"><span className="identity-mark" aria-hidden="true">♨</span><h1>온기</h1><span className="identity-note">겨울 찻집</span></header>
    <div className="scene">
      <img className="background" src={scene.background} alt="색연필로 그린 겨울 찻집. 벽난로에 불이 타오르고, 눈 내리는 창가의 탁자에는 책과 따뜻한 유자차가 놓여 있습니다." draggable="false" />
      <Atmosphere />
    </div>
    <section className="controls" aria-label="찻집 환경 설정">
      {message && <p className="sound-message" role="status">{message}</p>}
      <div className="control-bar">
        <button className="sound-toggle" onClick={toggleSound} aria-pressed={playing} disabled={loading}>
          <SoundIcon playing={playing} /><span>{loading ? '소리 준비 중' : playing ? '소리 끄기' : '소리 켜기'}</span>
        </button>
        <label className="volume-control"><span>볼륨</span><input aria-label="모닥불 소리 볼륨" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /><output>{volume}%</output></label>
        <span className="divider" aria-hidden="true" />
        <label className="motion-control"><input type="checkbox" checked={reduced} disabled={systemMotion} onChange={e => setReduceMotion(e.target.checked)} /><span>움직임 줄이기</span></label>
      </div>
      {systemMotion && <p className="system-note">기기의 움직임 줄이기 설정이 적용되어 있어요.</p>}
    </section>
    <audio ref={audioRef} src={scene.audio} loop preload="none" onPause={() => setPlaying(false)} onError={() => { setPlaying(false); }} />
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
