import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import diaLogo from "@/assets/dia-das-criancas.png";

const bg = "/assets/Background.png";
const logo = "/assets/Logo_Raimundinho.png";
const mascote = "/assets/mascote_astronauta.png";

const s1 = "/assets/estrela1.png";
const s2 = "/assets/estrela2.png";
const s3 = "/assets/estrela3.png";
const s4 = "/assets/estrela4.png";

const meteoro = "/assets/meteoro.png";
const musica = "/assets/musica.mp3";
const click = "/assets/click.wav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pegue as Estrelas — Super Raimundinho" },
      { name: "description", content: "Jogo de Dia das Crianças do Super Raimundinho: toque nas estrelas em 30 segundos!" },
      { property: "og:title", content: "Pegue as Estrelas — Super Raimundinho" },
      { property: "og:description", content: "Toque nas estrelas antes que elas sumam! Jogo de Dia das Crianças." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

const W = 1080;
const H = 1920;
const DURATION = 30;
const MUSIC_START = 11;
const STARS = [s1, s2, s3, s4];
const FRASES = [
  "Você brilha mais que todas as estrelas!",
  "Criança feliz é criança que sonha alto!",
  "Você é um campeão de verdade!",
  "Continue sorrindo, o mundo fica mais bonito!",
  "Sua alegria ilumina o dia!",
  "Você é uma estrela super especial!",
  "Brincar é a melhor aventura do mundo!",
  "Acredite: você pode tudo!",
];

type Star = { id: number; x: number; y: number; size: number; speed: number; rot: number; spin: number; img: string; meteor?: boolean };
type Pop = { id: number; x: number; y: number; text: string; bad: boolean };

const TWINKLES = Array.from({ length: 28 }, (_, i) => ({ x: (i * 397) % 1040 + 20, y: (i * 613) % 1700 + 60, d: (i * 0.37) % 4, s: 10 + (i * 7) % 18 }));
const SHOOTERS = Array.from({ length: 5 }, (_, i) => ({ x: 200 + i * 210, y: 40 + (i * 271) % 700, d: i * 2.3, dur: 7 + (i % 3) * 2 }));

function SkyFx() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {TWINKLES.map((t, i) => (
        <span key={i} className="absolute animate-twinkle sparkle" style={{ left: t.x, top: t.y, width: t.s, height: t.s, animationDelay: `${t.d}s`, animationDuration: `${2.5 + (i % 4)}s` }} />
      ))}
      {SHOOTERS.map((sh, i) => (
        <span key={i} className="absolute animate-shoot shooting-star" style={{ left: sh.x, top: sh.y, animationDelay: `${sh.d}s`, animationDuration: `${sh.dur}s` }} />
      ))}
    </div>
  );
}
type Screen = "home" | "play" | "end";

function useStageScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const f = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return scale;
}

function Game() {
  const scale = useStageScale();
  const [screen, setScreen] = useState<Screen>("home");
  const [stars, setStars] = useState<Star[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [frase, setFrase] = useState<string>(FRASES[0]!);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef(0);
  const scoreRef = useRef(0);

  const playClick = () => {
    const a = new Audio(click);
    a.volume = 0.9;
    a.play().catch(() => {});
  };

  const start = () => {
    playClick();
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
    scoreRef.current = 0;
    setScore(0);
    setStars([]);
    setPops([]);
    setTimeLeft(DURATION);
    if (!musicRef.current) {
      musicRef.current = new Audio(musica);
      musicRef.current.loop = true;
      musicRef.current.volume = 0.6;
    }
    musicRef.current.currentTime = MUSIC_START;
    musicRef.current.play().catch(() => {});
    setScreen("play");
  };

  // game loop
  useEffect(() => {
    if (screen !== "play") return;
    let raf = 0;
    let last = performance.now();
    let spawnAcc = 0;
    const startT = last;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const elapsed = (t - startT) / 1000;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]!);
        setScreen("end");
        return;
      }
      const interval = Math.max(0.35, 0.9 - elapsed * 0.018);
      spawnAcc += dt;
      const spawn: Star[] = [];
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        const size = 170 + Math.random() * 90;
        spawn.push({
          id: idRef.current++,
          x: Math.random() * (W - size),
          y: -size,
          size,
          speed: 380 + Math.random() * 260 + elapsed * 10,
          rot: Math.random() * 360,
          spin: (Math.random() - 0.5) * 180,
          img: STARS[Math.floor(Math.random() * STARS.length)]!,
        });
      }
      if (elapsed > 2 && Math.random() < dt * 0.45) {
        const size = 200 + Math.random() * 60;
        spawn.push({ id: idRef.current++, x: Math.random() * (W - size), y: -size, size, speed: 750 + Math.random() * 300, rot: 0, spin: (Math.random() - 0.5) * 120, img: meteoro, meteor: true });
      }
      setStars((prev) =>
        prev
          .map((s) => ({ ...s, y: s.y + s.speed * dt, rot: s.rot + s.spin * dt }))
          .filter((s) => s.y < H - 120)
          .concat(spawn),
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  // end → home
  useEffect(() => {
    if (screen !== "end") return;
    const fade = window.setInterval(() => {
      const m = musicRef.current;
      if (m && m.volume > 0.05) m.volume = Math.max(0, m.volume - 0.05);
    }, 200);
    const t = window.setTimeout(() => {
      musicRef.current?.pause();
      if (musicRef.current) musicRef.current.volume = 0.6;
      setStars([]);
      setScreen("home");
    }, 7000);
    return () => {
      clearTimeout(t);
      clearInterval(fade);
    };
  }, [screen]);

  const catchStar = useCallback((s: Star) => {
    playClick();
    scoreRef.current = s.meteor ? Math.max(0, scoreRef.current - 3) : scoreRef.current + 1;
    setScore(scoreRef.current);
    setStars((prev) => prev.filter((p) => p.id !== s.id));
    const pop = { id: s.id, x: s.x + s.size / 2, y: s.y + s.size / 2, text: s.meteor ? "-3" : "+1", bad: !!s.meteor };
    setPops((p) => [...p, pop]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 600);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-stage select-none touch-none">
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
        }}
      >
        <SkyFx />
        {screen === "home" && (
          <div className="flex h-full flex-col items-center px-16 pt-16 font-display">
            <img src={logo} alt="Super Raimundinho" className="w-[520px]" />
            <div className="relative -mt-2">
              <div className="absolute inset-0 animate-glow rounded-full glow-ring" />
              {[[-40,80,0],[900,40,0.6],[-20,420,1.2],[930,400,0.3],[440,-30,0.9],[200,500,1.5],[700,510,0.4]].map(([x,y,d],i)=>(
                <span key={i} className="absolute animate-twinkle sparkle" style={{left:x,top:y,width:60,height:60,animationDelay:`${d}s`,animationDuration:"1.8s"}} />
              ))}
              <img src={s3} alt="" className="absolute -left-6 top-10 w-24 animate-orbit" />
              <img src={s4} alt="" className="absolute -right-4 bottom-16 w-20 animate-orbit" style={{animationDelay:"-1.5s"}} />
              <img src={diaLogo} alt="Dia das Crianças" width={1536} height={1024} className="relative w-[940px] animate-float" />
            </div>
            <h1 className="text-stroke -mt-6 text-center text-[120px] font-bold leading-none text-brand-yellow">
              Pegue as Estrelas!
            </h1>
            <img src={mascote} alt="Mascote" className="mt-4 h-[500px] animate-bounce-slow" />
            <button
              onClick={start}
              className="mt-6 animate-pulse-btn rounded-full border-[10px] border-primary-foreground bg-brand-orange px-24 py-10 text-[90px] font-bold text-primary-foreground shadow-btn active:scale-95"
            >
              Iniciar Jogo
            </button>
          </div>
        )}

        {screen === "play" && (
          <>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-12 pt-10 font-display">
              <div className="flex items-center gap-4 rounded-full bg-brand-blue/90 px-10 py-4 text-[72px] font-bold text-primary-foreground shadow-btn">
                <img src={s2} alt="" className="h-20 w-20" /> {score}
              </div>
              <img src={logo} alt="Super Raimundinho" className="w-[300px]" />
              <div className="rounded-full bg-brand-orange/95 px-10 py-4 text-[72px] font-bold text-primary-foreground shadow-btn">
                {timeLeft}s
              </div>
            </div>
            {stars.map((s) =>
              s.meteor ? (
                <div key={s.id} onPointerDown={() => catchStar(s)} className="absolute cursor-pointer" style={{ left: s.x, top: s.y, width: s.size, height: s.size }}>
                  <div className="meteor-fire animate-fire absolute left-1/2 bottom-1/2 -translate-x-1/2" style={{ width: s.size * 0.9, height: s.size * 2.2 }} />
                  <img src={s.img} alt="Meteoro" draggable={false} className="relative h-full w-full drop-shadow-fire" style={{ transform: `rotate(${s.rot}deg)` }} />
                </div>
              ) : (
                <img key={s.id} src={s.img} alt="Estrela" draggable={false} onPointerDown={() => catchStar(s)} className="absolute cursor-pointer drop-shadow-star" style={{ left: s.x, top: s.y, width: s.size, height: s.size, transform: `rotate(${s.rot}deg)` }} />
              ),
            )}
            {pops.map((p) => (
              <div
                key={p.id}
                className={`pointer-events-none absolute animate-pop font-display text-[90px] font-bold text-stroke ${p.bad ? "text-destructive" : "text-brand-yellow"}`}
                style={{ left: p.x - 50, top: p.y - 60 }}
              >
                {p.text}
              </div>
            ))}
            <img src={mascote} alt="" className="pointer-events-none absolute -bottom-10 -left-10 h-[420px] opacity-95" />
          </>
        )}

        {screen === "end" && (
          <div className="flex h-full flex-col items-center justify-center px-16 text-center font-display">
            <img src={logo} alt="Super Raimundinho" className="w-[600px]" />
            <h1 className="text-stroke mt-10 animate-pop-in text-[170px] font-bold leading-none text-brand-yellow">
              Parabéns!
            </h1>
            <div className="mt-10 flex items-center gap-6 rounded-full bg-brand-blue/90 px-14 py-6 text-[90px] font-bold text-primary-foreground shadow-btn">
              <img src={s1} alt="" className="h-28 w-28" /> {score} estrelas
            </div>
            <p className="text-stroke-sm mt-12 max-w-[900px] text-[80px] font-bold leading-tight text-primary-foreground">
              {frase}
            </p>
            <img src={mascote} alt="Mascote" className="mt-10 h-[600px] animate-bounce-slow" />
          </div>
        )}
      </div>
    </div>
  );
}
