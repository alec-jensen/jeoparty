// jp-shared.jsx — colors, type, data, primitives. Exposes window.JP.

const J = {
  bg: '#0E0B22',
  bg2: '#171234',
  bg3: '#1F1947',
  bg4: '#100A2E',
  ink: '#F4EEFF',
  dim: '#9C95C4',
  dim2: '#6B6391',
  gold: '#FFC83D',
  magenta: '#FF3D8E',
  mint: '#5EEBC1',
  violet: '#7C5CFF',
  red: '#FF5A5A',
  line: 'rgba(255,255,255,0.08)',
  line2: 'rgba(255,255,255,0.16)',
};

const display = `'Anton', 'Archivo Black', system-ui, sans-serif`;
const ui = `'Space Grotesk', system-ui, -apple-system, sans-serif`;

// Sample game data — shared across every screen
const PLAYERS = [
  { name: 'ALEX',   score: 3200, color: J.gold,    avatar: '◆', team: 'HOT TAKES' },
  { name: 'PRIYA',  score: 5400, color: J.magenta, avatar: '✦', team: 'ENCYCLOPEDIA' },
  { name: 'SAM',    score: -400, color: J.mint,    avatar: '●', team: 'LAB RATS' },
  { name: 'JORDAN', score: 2800, color: J.violet,  avatar: '▲', team: 'LAB RATS' },
  { name: 'MIKA',   score: 1600, color: '#FF8A3D', avatar: '◐', team: 'HOT TAKES' },
  { name: 'LEE',    score:  800, color: '#5BA9FF', avatar: '■', team: 'ENCYCLOPEDIA' },
];

// Teams derived from PLAYERS; team color = a curated accent, not a player's.
const TEAMS = [
  { name: 'HOT TAKES',    color: J.gold,    glyph: '◆' },
  { name: 'ENCYCLOPEDIA', color: J.magenta, glyph: '✦' },
  { name: 'LAB RATS',     color: J.mint,    glyph: '●' },
].map(t => {
  const members = PLAYERS.filter(p => p.team === t.name);
  return { ...t, members, score: members.reduce((s, p) => s + p.score, 0) };
});

const CATEGORIES = [
  'BUTTERY\nCINEMA',
  'STATE OF\nTHE UNION',
  'SCIENCE\nFRICTION',
  'POP\nTARTS',
  'WORD\nUP',
];

// Track which dollar values have been answered. 0 = open, 1 = solved, 2 = current
const BOARD = [
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 1, 2, 0, 0], // $600 Science Friction is current
  [0, 0, 1, 1, 0],
  [1, 0, 0, 0, 1],
];
const VALUES = [200, 400, 600, 800, 1000];

// Formats numbers like $5,400 or -$400
function dollars(n) {
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
}

// ============== PRIMITIVES ==============

const btnBase = {
  border: 'none', borderRadius: 10, cursor: 'pointer',
  fontFamily: ui, fontWeight: 600,
};

function Pill({ label, muted, accent }) {
  return (
    <div style={{
      padding: '10px 18px',
      borderRadius: 999,
      border: `1.5px solid ${muted ? J.line : (accent || J.gold)}`,
      color: muted ? J.dim : (accent || J.gold),
      fontFamily: display, letterSpacing: '0.12em', fontSize: 16,
    }}>{label}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, color: J.dim, letterSpacing: '0.22em',
      fontFamily: ui, fontWeight: 600,
    }}>{children}</div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, color: J.dim, letterSpacing: '0.25em',
      fontFamily: ui, fontWeight: 600,
    }}>{children}</div>
  );
}

function SmallBtn({ children, accent }) {
  return (
    <button style={{
      ...btnBase, background: accent || '#1A1340', color: accent ? '#0E0B22' : J.ink,
      border: accent ? 'none' : `1px solid ${J.line}`,
      fontSize: 12, padding: '8px 12px', letterSpacing: '0.1em',
    }}>{children}</button>
  );
}

function GhostBtn({ children }) {
  return (
    <button style={{
      ...btnBase, background: 'transparent', color: J.ink,
      border: `1.5px solid ${J.line}`,
      fontSize: 13, padding: '12px 14px', letterSpacing: '0.12em',
      fontFamily: display,
    }}>{children}</button>
  );
}

function Stepper({ children }) {
  return (
    <button style={{
      ...btnBase, width: 22, height: 22, borderRadius: 6,
      background: '#1A1340', color: J.ink, fontSize: 13,
      border: `1px solid ${J.line}`, padding: 0,
    }}>{children}</button>
  );
}

function PhoneShell({ children }) {
  return (
    <div style={{
      width: 390, height: 844,
      background: J.bg, color: J.ink, fontFamily: ui,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* status bar */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 24px',
        fontSize: 13, color: J.ink, fontWeight: 600,
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ width: 14, height: 9, borderRadius: 2, background: J.ink, opacity: 0.85 }}/>
          <span style={{ width: 14, height: 9, borderRadius: 2, background: J.ink, opacity: 0.85 }}/>
          <span style={{ width: 22, height: 11, border: `1.5px solid ${J.ink}`, borderRadius: 3, position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 1.5, background: J.ink, borderRadius: 1, width: '70%' }}/>
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

// Shared keyframes injected once
if (typeof document !== 'undefined' && !document.getElementById('jp-keyframes')) {
  const s = document.createElement('style');
  s.id = 'jp-keyframes';
  s.textContent = `
    @keyframes jp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
    @keyframes jp-caret { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    @keyframes jp-ring {
      0% { transform: scale(.7); opacity: 0.3; }
      80% { opacity: 0; }
      100% { transform: scale(1.15); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

window.JP = {
  J, display, ui, PLAYERS, TEAMS, CATEGORIES, BOARD, VALUES,
  dollars, btnBase,
  Pill, SectionLabel, Label, SmallBtn, GhostBtn, Stepper, PhoneShell,
};
