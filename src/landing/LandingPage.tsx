import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { LandingFaq } from './components/LandingFaq';
import { getLandingHref, landingConfig, type LandingConfig } from './landing.config';

const VISIT_YEAR = new Date().getFullYear();
const VISIT_BIRTH_YEAR = VISIT_YEAR - (1 + Math.floor(Math.random() * 3));

const epitaphs = [
  'Worked on my machine.',
  'One more feature away.',
  'The README was optimistic.',
  'Dependencies outlived the plan.',
  'It compiled once.',
  'Paused for a better week.',
  'Nearly ready for the next rewrite.',
  'A promising collection of TODOs.',
];

const verdicts = [
  { name: 'Phoenix', line: 'Give the smallest useful version three focused days.', detail: 'A short sprint with a checklist based on what the autopsy found.' },
  { name: 'Pivot', line: 'Keep the useful work; change the question.', detail: 'Preserve the original record, then choose a smaller or more useful direction.' },
  { name: 'Salvage', line: 'Keep the parts that still earn their place.', detail: 'Move reusable components into a local catalog and close the remaining file.' },
  { name: 'Archive', line: 'Write the epitaph and close the file.', detail: 'Record what you learned, mark the project at rest, and make room for the next one.' },
];

function Headstone({ name, birthYear, deathYear, epitaph, nameCarve, epitaphCarve, onNameChange, onNextEpitaph }: {
  name: string;
  birthYear: number;
  deathYear: number;
  epitaph: string;
  nameCarve: number;
  epitaphCarve: number;
  onNameChange: (name: string) => void;
  onNextEpitaph: () => void;
}) {
  const nameFontSize = Math.min(31, 360 / Math.max(name.length, 1));
  return (
    <div className="stone-wrap">
      <div className="stone-frame">
        <svg className="stone-art" viewBox="0 0 460 540" aria-hidden="true">
          <defs>
            <filter id="stone-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="12" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer><feFuncA type="table" tableValues="0 0.07" /></feComponentTransfer>
            </filter>
          </defs>
          <path d="M91 474 87 206Q91 93 165 64q61-28 125-3 84 27 85 146l-6 267q-138 13-278 0Z" fill="var(--muted)" stroke="var(--violet-soft)" strokeWidth="7" />
          <path d="M91 474 87 206Q91 93 165 64q61-28 125-3 84 27 85 146l-6 267q-138 13-278 0Z" filter="url(#stone-grain)" opacity=".07" />
          <path d="M111 112q28-32 56-35m180 92 12 19M106 428l7 18" fill="none" stroke="var(--text)" strokeOpacity=".25" strokeWidth="2" />
          <path d="m90 185-9-7 5 18m283 37 10-5-6 17M94 391l-9 6 10 5" fill="var(--surface-2)" stroke="var(--violet)" strokeWidth="2" />
          <path d="M108 472q17-19 34-3 12-18 26-2m134 6q14-20 28-4 15-14 30 2" fill="none" stroke="var(--acid)" strokeWidth="6" strokeLinecap="round" />
          <path d="M45 486h369m-353 0-6-13m17 13 4-10m327 10 7-12" fill="none" stroke="var(--violet-soft)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="stone-inscription" aria-label={`${name || 'Unnamed project'}, ${birthYear} to ${deathYear}. ${epitaph}`}>
          <span className="carved carved-small" key="here">Here lies</span>
          <span className={`carved carved-name ${nameCarve > 0 ? 'carved-update' : ''}`} key={`name-${nameCarve}`} style={{ fontSize: `${nameFontSize}px` }}>{name || 'Unnamed project'}</span>
          <span className="carved carved-years" key="years">{birthYear} to {deathYear}</span>
          <span className={`carved carved-epitaph ${epitaphCarve > 0 ? 'carved-update' : ''}`} key={`epitaph-${epitaphCarve}`}>{epitaph}</span>
        </div>
      </div>
      <form className="stone-controls" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="project-name">Name your dead project</label>
        <input id="project-name" maxLength={24} value={name} onChange={(event) => onNameChange(event.target.value)} />
        <Button variant="outline" size="sm" type="button" onClick={onNextEpitaph}>Another epitaph</Button>
      </form>
    </div>
  );
}

function HeroScene({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const skyRaw = useTransform(progress, [0, 1], [0, 22]);
  const hillRaw = useTransform(progress, [0, 1], [0, 48]);
  const gateRaw = useTransform(progress, [0, 1], [0, 90]);
  const gravesRaw = useTransform(progress, [0, 1], [0, 138]);
  const grassRaw = useTransform(progress, [0, 1], [0, 190]);
  const skyY = useSpring(skyRaw, { stiffness: 75, damping: 25 });
  const hillY = useSpring(hillRaw, { stiffness: 75, damping: 25 });
  const gateY = useSpring(gateRaw, { stiffness: 75, damping: 25 });
  const gravesY = useSpring(gravesRaw, { stiffness: 75, damping: 25 });
  const grassY = useSpring(grassRaw, { stiffness: 75, damping: 25 });
  const fogOneRaw = useTransform(progress, [0, 1], [0, 120]);
  const fogTwoRaw = useTransform(progress, [0, 1], [0, -160]);
  const fogOneX = useSpring(fogOneRaw, { stiffness: 60, damping: 26 });
  const fogTwoX = useSpring(fogTwoRaw, { stiffness: 60, damping: 26 });
  const crowRaw = useTransform(progress, [0, .02, .13], [0, 0, 235]);
  const crowOpacityRaw = useTransform(progress, [0, .02, .16], [1, 1, .15]);
  const crowX = useSpring(crowRaw, { stiffness: 100, damping: 24 });
  const crowOpacity = useSpring(crowOpacityRaw, { stiffness: 100, damping: 24 });

  return (
    <div className="hero-scene" aria-hidden="true">
      <motion.div className="scene-layer scene-sky" style={{ y: reduced ? 0 : skyY }}>
        <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMax slice">
          <circle className="moon" cx="1120" cy="130" r="52" />
          <path d="M0 490q80-85 123-8 40-73 93-25 54-74 117-8 52-56 112-6 63-82 127-5 56-71 119 0 66-88 138-4 63-71 127 0 57-66 117-8 66-84 127 0 62-58 103 7V760H0Z" />
          <path d="M177 487v-220m0 87-48-62m49 31 45-69m-43 120 66-47M360 480V218m0 112-58-64m58 26 57-81m-57 137 70-53M845 483V230m0 49q-36 3-54 38m53-19q36 6 53 41m-52-12q-38 7-51 43m52-20q31 6 46 40m-48-20q-30 12-37 46M1250 491V202m0 98-55-75m55 22 60-88m-60 153 74-58" />
        </svg>
      </motion.div>
      <motion.div className="scene-layer scene-hills" style={{ y: reduced ? 0 : hillY }}>
        <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMax slice">
          <path d="M0 575q130-130 245-53 95-93 219-30 117-105 251-27 137-108 268-17 117-112 236-31 96-81 181 22V760H0Z" />
        </svg>
      </motion.div>
      <motion.div className="scene-layer scene-gate" style={{ y: reduced ? 0 : gateY }}>
        <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMax slice">
          <path d="M135 760V494q0-152 139-152t139 152v266M987 760V494q0-152 139-152t139 152v266M118 498h307m548 0h307M92 760h1214M489 760V455l85-106 85 106v305M518 505h112m-112 61h112m-112 61h112m-112 61h112" />
          <path d="M225 368q46 43 93 0t93 0m624 0q46 43 93 0t93 0M160 500v215m48-215v215m48-215v215m48-215v215m48-215v215m48-215v215m612-215v215m48-215v215m48-215v215m48-215v215m48-215v215m48-215v215" />
          <path d="M372 327q28-41 57-8 26 26 49-16m511 24q-28-41-57-8-26 26-49-16" />
          <g fill="currentColor" stroke="none">
            <path d="m685 300 11-7 10 6-8-1-7 5Zm72-20 12-8 12 6-9-1-8 6Zm45 25 10-7 11 6-8-1-7 5Z" />
          </g>
          <motion.g style={{ x: reduced ? 0 : crowX, opacity: reduced ? 1 : crowOpacity }}>
            <path d="m822 294 15-11 14 7-10-1-9 7Z" fill="currentColor" stroke="none" />
          </motion.g>
        </svg>
      </motion.div>
      <motion.div className="scene-layer scene-graves" style={{ y: reduced ? 0 : gravesY }}>
        <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMax slice">
          <path d="M165 760V627q0-65 60-65t60 65v133Zm130 0V672h66v88Zm318 0V595l47-53 48 53v165Zm87 0V621q0-68 61-68t61 68v139Zm430 0V637l47-64 47 64v123Zm124 0V680h72v80Z" />
          <path d="M178 760H65m69-18 9 18m59-13 10 13m380-120 17 14-13 17 19 14-12 16m457 68v-80m-21 27h42m-1271-7v-84m-19 25h38" fill="none" />
          <path d="M77 624v-67m-16 19h32m1101 88v-56m-15 17h30" />
          <path d="M500 722v-34h10v34m-12-34h14m-10-12v-4m18 50v-43h11v43m-13-43h15m-10-12v-4" />
          <path className="candle-flame" d="M503 675q-7-9 2-17 6 7-2 17m20-8q-7-9 2-17 6 7-2 17" />
          <path d="M1150 760V643q0-57 55-57t55 57v117Z" />
          <path d="M1280 760V590l28-43 28 43v170Z" />
        </svg>
      </motion.div>
      <motion.div className="scene-layer scene-grass" style={{ y: reduced ? 0 : grassY }}>
        <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMax slice">
          <path d="M0 692q100-24 193 0 116-39 217 0 135-27 246 0 130-45 255 0 122-33 238 0 120-41 251 0v68H0Z" />
          <path d="M20 683q26-34 33-70m-13 54-30-20m85 32q19-29 12-60m-9 42 28-20m164 34q22-32 15-66m-8 49-28-18m732 34q20-31 16-62m-8 48 32-22m135 35q26-39 16-73m-8 53-28-18" fill="none" />
          <path d="M85 675q18-28 38-12l-9 24-25-2Zm1018 12q14-27 36-11l-6 24-30-2Zm-703-8q21-32 42-12l-11 25-29-2Z" />
          <path d="M1290 690q-5-35 18-49 16 25-18 49Zm-12-20q-25-21-15-39 24 11 15 39Zm20-20q18-26 36-17-8 28-36 17Z" />
          <path d="M1190 699q-4-42-24-57m24 57q18-30 40-35m-40 35q-17-16-32-11m32 11 1-25m-27-31q-17-4-18-19 18-3 18 19m31 27q8-17 23-15-1 18-23 15m-44-6q-13-13-25-6 6 14 25 6" />
        </svg>
      </motion.div>
      <motion.div className="fog-band fog-band-one" style={{ x: reduced ? 0 : fogOneX }} />
      <motion.div className="fog-band fog-band-two" style={{ x: reduced ? 0 : fogTwoX }} />
    </div>
  );
}

function MarkerArt({ type }: { type: string }) {
  const sharedGround = <><ellipse className="stone-shadow" cx="110" cy="281" rx="91" ry="8" /><path className="stone-grass" d="m19 278 8-12 2 12 8-15 1 15m148 0 8-13 2 13 8-16 1 16" /></>;
  if (type === 'Phoenix') return (
    <svg className="marker-art" viewBox="0 0 220 300" aria-hidden="true">
      {sharedGround}
      <path className="stone-side" d="M75 244v-88H62v-23h13V92h31V57q0-8 8-8t8 8v35h31v41h13v23h-13v88Z" />
      <path className="stone-front" d="M54 244v-88H42v-23h12V92h36V58q0-8 8-8t8 8v34h36v41h12v23h-12v88Z" />
      <path className="stone-bevel" d="M42 133V92h6v41Zm36-41V58q0-8 8-8h8q-2 3-2 8v34Zm0 0h36v6H78Zm36 0h26v6h-26Z" />
      <circle className="stone-front" cx="102" cy="132" r="25" />
      <circle className="stone-side" cx="102" cy="132" r="14" />
      <path className="stone-incision" d="M62 235h80v-74m-80-60h25m31-34v27m27 7h17" />
      <path className="stone-base-side" d="M31 268h160v10H31Zm18-20h124v9H49Z" />
      <path className="stone-base" d="M23 263h160v10H23Zm18-20h124v9H41Z" />
    </svg>
  );
  if (type === 'Pivot') return (
    <svg className="marker-art marker-art-pivot" viewBox="0 0 220 300" aria-hidden="true">
      {sharedGround}
      <path className="stone-side" d="m95 245 4-146 20-47 23 47 4 146Z" />
      <path className="stone-front" d="m79 245 4-146 20-47 23 47 4 146Z" />
      <path className="stone-bevel" d="m83 99 20-47 3 7-17 40Z" />
      <path className="stone-incision" d="m91 235 4-128 11-30m5 157 3-126" />
      <path className="stone-base-side" d="M48 265h126v13H48Zm16-20h94v10H64Z" />
      <path className="stone-base" d="M39 260h126v13H39Zm16-20h94v10H55Z" />
    </svg>
  );
  if (type === 'Salvage') return (
    <svg className="marker-art" viewBox="0 0 220 300" aria-hidden="true">
      {sharedGround}
      <path className="stone-side" d="m64 245 4-146 17 9 12-8 10 9 10-8 11 9 12-7 10 8 6-3v137Z" />
      <path className="stone-front" d="m45 245 4-146 17 9 12-8 10 9 10-8 11 9 10-7 10 8 7-4v138Z" />
      <path className="stone-bevel" d="m49 99 17 9 12-8 5 5-13 9-17-9Z" />
      <path className="stone-incision" d="m65 118-2 112m22-111-2 111m22-110-2 110m22-109-2 109" />
      <path className="stone-base-side" d="M36 266h150v12H36Z" />
      <path className="stone-base" d="M26 260h150v13H26Z" />
      <path className="stone-front" d="m157 253 20-30 17 8-7 24Z" />
      <path className="stone-side" d="m177 223 17 8-7 24-12-2Z" />
      <path className="ivy" d="M31 259q7-21 22-29m-11 16q-12-10-13-20 14 1 18 13m-4 4q12-13 23-12-4 15-18 18" />
    </svg>
  );
  return (
    <svg className="marker-art" viewBox="0 0 220 300" aria-hidden="true">
      {sharedGround}
      <path className="stone-side" d="m106 235 1-138q17 5 31 20l-1 118Zm12-138q24 11 41 32l-3 106h-19V117Z" />
      <path className="stone-front" d="M48 235V117q15-15 43-20v138Zm43-138q16 3 29 11v127H91Z" />
      <path className="stone-bevel" d="M48 117q15-15 43-20v7q-22 3-37 18v113h-6Z" />
      <path className="stone-incision" d="M62 126q13-12 24-15v105m-34-82q16-16 34-20m11 5q15 4 25 11m-25 12q15 4 25 11" />
      <path className="stone-base-side" d="M39 264h143v14H39Z" />
      <path className="stone-base" d="M29 258h143v14H29Z" />
    </svg>
  );
}

function RisingVerdict({ item, index, progress, reduced, active, ready, onActive }: { item: (typeof verdicts)[number]; index: number; progress: MotionValue<number>; reduced: boolean; active: boolean; ready: boolean; onActive: (name: string | null) => void }) {
  const start = .08 + index * .055;
  const end = .38 + index * .055;
  const riseRaw = useTransform(progress, [start, end], [145, 0]);
  const opacityRaw = useTransform(progress, [start, Math.min(end + .08, .8)], [0, 1]);
  const y = useSpring(riseRaw, { stiffness: 80, damping: 24 });
  const opacity = useSpring(opacityRaw, { stiffness: 90, damping: 26 });
  return (
    <motion.button
      type="button"
      className={`plot-marker ${active ? 'is-active' : ''}`}
      style={{ y: reduced ? 0 : y, opacity: reduced ? 1 : opacity }}
      onFocus={() => onActive(item.name)}
      onBlur={() => onActive(null)}
      onMouseEnter={() => onActive(item.name)}
      onMouseLeave={() => onActive(null)}
    >
      {ready && <MarkerArt type={item.name} />}
      <span className="marker-name">{item.name}</span>
      <span className="marker-line">{item.line}</span>
      <span className="marker-detail">{item.detail}</span>
    </motion.button>
  );
}

function LanternIcon() {
  return <svg viewBox="0 0 80 140" aria-hidden="true"><path className="lantern-loop" d="M27 38q13-32 26 0" /><path className="lantern-cap" d="M20 43h40l-5 10H25Z" /><path className="lantern-glass" d="M26 54h28l-4 42H30Z" /><path className="flame" d="M40 61c-10 13 3 15 0 28 13-9 10-20 0-28Z" /><path className="lantern-base" d="m29 96-5 14h32l-5-14Z" /><path className="lantern-handle" d="M40 17v16M13 32l12 9m42-9-12 9" /></svg>;
}

interface LandingPageProps {
  config?: LandingConfig;
  onBuryProject?: () => void;
}

export function LandingPage({ config = landingConfig, onBuryProject }: LandingPageProps = {}) {
  const [name, setName] = useState('todo-app-v3');
  const [epitaphIndex, setEpitaphIndex] = useState(0);
  const [nameCarve, setNameCarve] = useState(0);
  const [epitaphCarve, setEpitaphCarve] = useState(0);
  const [activeVerdict, setActiveVerdict] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const caseRef = useRef<HTMLElement>(null);
  const ribbonRef = useRef<HTMLElement>(null);
  const verdictRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const verdictInView = useInView(verdictRef, { once: true, margin: '140px' });
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const { scrollYProgress: caseProgress } = useScroll({ target: caseRef, offset: ['start end', 'end start'] });
  const { scrollYProgress: ribbonProgress } = useScroll({ target: ribbonRef, offset: ['start end', 'end start'] });
  const { scrollYProgress: verdictProgress } = useScroll({ target: verdictRef, offset: ['start end', 'end start'] });

  const caseYRaw = useTransform(caseProgress, [0, .56, 1], [135, 0, -22]);
  const caseOpacityRaw = useTransform(caseProgress, [0, .42, 1], [.45, 1, 1]);
  const caseY = useSpring(caseYRaw, { stiffness: 80, damping: 25 });
  const caseOpacity = useSpring(caseOpacityRaw, { stiffness: 80, damping: 25 });
  const stampRaw = useTransform(caseProgress, [.34, .7, .8], [1.13, 1.13, 1]);
  const stampScale = useSpring(stampRaw, { stiffness: 200, damping: 18 });
  const ribbonXRaw = useTransform(ribbonProgress, [0, 1], [100, -240]);
  const ribbonX = useSpring(ribbonXRaw, { stiffness: 70, damping: 25 });
  const lanternOpacityRaw = useTransform(verdictProgress, [.13, .34, .5], [0, .14, .14]);
  const lanternOpacity = useSpring(lanternOpacityRaw, { stiffness: 45, damping: 25 });
  const scrollScaleRaw = useTransform(scrollYProgress, [0, 1], [.01, 1]);
  const scrollScale = useSpring(scrollScaleRaw, { stiffness: 75, damping: 30 });
  const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
  const scrollLanternYRaw = useTransform(scrollYProgress, [0, 1], [0, viewportHeight * .66]);
  const scrollLanternY = useSpring(scrollLanternYRaw, { stiffness: 75, damping: 30 });
  const currentEpitaph = epitaphs[epitaphIndex];
  const reduced = Boolean(reducedMotion);
  const goToVault = () => window.location.assign(getLandingHref(config.vaultPath, config.appUrl));
  const buryProject = () => {
    if (onBuryProject) {
      onBuryProject();
      return;
    }
    window.location.assign(getLandingHref(config.buryProjectPath, config.appUrl));
  };

  const changeName = (nextName: string) => {
    setName(nextName.slice(0, 24));
    setNameCarve((version) => version + 1);
  };
  const nextEpitaph = () => {
    setEpitaphIndex((index) => (index + 1) % epitaphs.length);
    setEpitaphCarve((version) => version + 1);
  };

  return (
    <main className="landing-root">
      {!reduced && <div className="scroll-marker" aria-hidden="true"><div className="scroll-track" /><motion.div className="scroll-fill" style={{ scaleY: scrollScale }} /><motion.div className="scroll-lantern" style={{ y: scrollLanternY }}><LanternIcon /></motion.div></div>}
      <section className="landing-section hero-section" ref={heroRef} aria-labelledby="hero-title">
        <HeroScene progress={heroProgress} reduced={reduced} />
        <div className="hero-grid page-width">
          <div className="hero-copy">
            <p className="registry-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22V9q0-7 7-7t7 7v13Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 6v9m-4-4 4-5 4 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>The Project Graveyard <span>/</span> Local register</p>
            <h1 id="hero-title">Somewhere there is a repo you stopped touching in March.</h1>
            <p className="hero-deck">Bury it properly. Find out why it stopped, score its chances, then decide: revive it, rebuild it, strip it for parts, or let it rest.</p>
            <div className="hero-actions">
              <Button onClick={buryProject}>Bury a project</Button>
              <Button variant="link" onClick={goToVault}>Open the vault</Button>
            </div>
            <p className="hero-note">A private record kept in this browser.</p>
          </div>
          <div className="hero-stone">
            <Headstone name={name} birthYear={VISIT_BIRTH_YEAR} deathYear={VISIT_YEAR} epitaph={currentEpitaph} nameCarve={nameCarve} epitaphCarve={epitaphCarve} onNameChange={changeName} onNextEpitaph={nextEpitaph} />
            <Button variant="outline" onClick={buryProject}>Bury it for real</Button>
          </div>
        </div>
        {!reduced && <div className="stone-specks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>}
      </section>

      <section className="landing-section case-section" id="case-file" ref={caseRef} aria-labelledby="case-heading">
        <div className="page-width case-layout">
          <div>
            <p className="section-kicker">Register entry 014</p>
            <h2 id="case-heading">A short account of where the work stopped.</h2>
            <motion.div style={{ y: reduced ? 0 : caseY, opacity: reduced ? 1 : caseOpacity }}>
              <Card className="case-paper">
                <figure>
                  <div className="case-title"><span>Coroner's case file</span><span>No. 014 / 2025 <svg className="case-hourglass" viewBox="0 0 18 24" aria-hidden="true"><path d="M3 2h12M3 22h12M5 3q0 5 4 9-4 4-4 9m8-18q0 5-4 9 4 4 4 9" /></svg></span></div>
                  <dl className="case-fields">
                    <div><dt>Project</dt><dd>todo-app-v3</dd></div>
                    <div><dt>Stack</dt><dd>React, TypeScript, PostgreSQL</dd></div>
                    <div><dt>Last commit</dt><dd>12 March, 23:48</dd></div>
                    <div><dt>What broke</dt><dd>Authentication kept resetting during deploy.</dd></div>
                    <div><dt>Why it stopped</dt><dd>The rewrite began before the first version shipped.</dd></div>
                  </dl>
                  <motion.div className="score-stamp" style={{ scale: reduced ? 1 : stampScale }} aria-label="Resurrection score 71 of 100, rule-based heuristic">
                    <span>Resurrection score</span><strong>71 <small>of 100</small></strong><span>Rule-based heuristic</span>
                  </motion.div>
                  <figcaption>Example data. The score is a guide, not a prediction.</figcaption>
                </figure>
              </Card>
            </motion.div>
          </div>
          <div className="autopsy-list-wrap">
            <h3>The five-step autopsy</h3>
            <ol className="autopsy-list">
              <li><span>01</span>Record what you set out to build.</li>
              <li><span>02</span>Name the thing that broke.</li>
              <li><span>03</span>Write down why you stopped.</li>
              <li><span>04</span>Weigh time, scope, and useful parts.</li>
              <li><span>05</span>Read the score and choose a path.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="ribbon-section landing-section" ref={ribbonRef} aria-label="Project epitaphs">
        <motion.div className="epitaph-ribbon" style={{ x: reduced ? 0 : ribbonX }} aria-hidden="true">
          {[...epitaphs, ...epitaphs].map((epitaph, index) => <span key={`${epitaph}-${index}`}>{epitaph}</span>)}
        </motion.div>
      </section>

      <section className="landing-section verdict-section" ref={verdictRef} aria-labelledby="verdict-heading">
        <div className="page-width verdict-content">
          <div className="verdict-intro"><p className="section-kicker">After the examination</p><h2 id="verdict-heading">Four ways to settle the matter.</h2><p>Choose a course of action. The score advises; the decision is yours.</p></div>
          <div className="verdict-stage">
            <motion.div className="lantern-beam" style={{ opacity: reduced ? .14 : lanternOpacity }} aria-hidden="true" />
            <div className="plot-ground">
              <div className="lantern" aria-hidden="true"><LanternIcon /></div>
              {verdicts.map((item, index) => <RisingVerdict key={item.name} item={item} index={index} progress={verdictProgress} reduced={reduced} active={activeVerdict === item.name} ready={verdictInView} onActive={setActiveVerdict} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section faq-section" aria-labelledby="faq-heading">
        <div className="page-width">
          <p className="section-kicker">The register, plainly</p>
          <h2 id="faq-heading">Questions, answered plainly</h2>
          <LandingFaq />
        </div>
      </section>

      <section className="landing-section closing-section" aria-labelledby="closing-heading">
        <div className="page-width closing-content">
          <div className="closing-copy">
            <p className="section-kicker">The file is ready</p>
            <h2 id="closing-heading">Give the unfinished work an ending.</h2>
            <Button onClick={buryProject}>Bury a project</Button>
          </div>
          <svg className="closing-lantern" viewBox="0 0 120 190" aria-hidden="true">
            <ellipse cx="60" cy="104" rx="52" ry="68" fill="var(--amber)" opacity=".16" />
            <path d="M42 47q18-42 36 0" fill="none" stroke="var(--violet-soft)" strokeWidth="7" strokeLinecap="round" />
            <path d="M25 49h70l-9 16H34Z" fill="var(--violet)" />
            <path d="M35 65h50l-7 72H42Z" fill="var(--amber)" />
            <path d="M60 78c-15 20 5 24 0 43 19-12 15-29 0-43Z" fill="var(--acid)" />
            <path d="m42 136-9 23h54l-9-23Z" fill="var(--violet)" />
            <path d="M60 15v20M17 28l15 13m71-13L88 41" fill="none" stroke="var(--violet-soft)" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
        <footer className="page-width site-footer">
          <span>Made by Code_Cartel</span>
          <nav aria-label="Existing app pages">{config.footerLinks.map((link) => <a href={getLandingHref(link.path, config.appUrl)} key={link.label}>{link.label}</a>)}</nav>
          <span>A local-first project register.</span>
        </footer>
      </section>
    </main>
  );
}
