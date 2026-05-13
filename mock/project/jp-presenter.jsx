// jp-presenter.jsx — Presenter big-screen view (1920 × 1080). Two modes: individuals + teams.

const { J, display, ui, PLAYERS, TEAMS, CATEGORIES, BOARD, VALUES,
        dollars, Pill } = window.JP;

// Shared chrome: top bar + 5x5 board + clue overlay
function PresenterFrame({ buzzedLabel, buzzedColor = J.magenta, children }) {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: `radial-gradient(ellipse at 50% 0%, ${J.bg3} 0%, ${J.bg} 60%)`,
      color: J.ink, fontFamily: ui,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '32px 56px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <span style={{
            fontFamily: display, fontSize: 56, letterSpacing: '0.02em',
            color: J.gold, lineHeight: 1,
          }}>JEOPARTY</span>
          <span style={{ fontSize: 18, color: J.dim, letterSpacing: '0.18em' }}>
            ROOM · 4Q7P
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Pill label="ROUND 1 OF 2" />
          <Pill label="14 OF 25 CLUES" muted />
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, padding: '0 56px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: '120px repeat(5, 1fr)',
          gap: 10, flex: 1,
        }}>
          {CATEGORIES.map((c, i) => (
            <div key={i} style={{
              background: `linear-gradient(180deg, ${J.violet} 0%, #5A3FE0 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, padding: 12,
              fontFamily: display, fontSize: 30, lineHeight: 1.0,
              letterSpacing: '0.02em', textAlign: 'center', whiteSpace: 'pre-line',
              boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.25), 0 6px 20px rgba(124,92,255,0.25)',
            }}>{c}</div>
          ))}
          {BOARD.flatMap((row, rIdx) => row.map((state, cIdx) => {
            const val = VALUES[rIdx];
            const open = state === 0;
            const current = state === 2;
            return (
              <div key={`${rIdx}-${cIdx}`} style={{
                background: current ? J.gold : open ? J.bg4 : 'transparent',
                border: open || current ? 'none' : `2px dashed ${J.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4,
                fontFamily: display,
                fontSize: open || current ? 72 : 0,
                color: current ? '#0E0B22' : J.gold,
                boxShadow: open
                  ? 'inset 0 -6px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : current
                    ? '0 0 60px rgba(255,200,61,0.55), inset 0 -6px 0 rgba(0,0,0,0.2)'
                    : 'none',
                transform: current ? 'scale(1.02)' : 'none',
                position: 'relative',
              }}>
                {(open || current) && `$${val}`}
                {current && (
                  <div style={{
                    position: 'absolute', inset: -3, borderRadius: 6,
                    boxShadow: `0 0 0 3px ${J.gold}`, pointerEvents: 'none',
                  }}/>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {/* Clue overlay */}
      <div style={{
        position: 'absolute',
        top: 200, left: 140, right: 140,
        background: `linear-gradient(180deg, #1A1340 0%, #0F0A28 100%)`,
        border: `2px solid ${J.gold}`,
        borderRadius: 10,
        padding: '44px 64px 56px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 8px rgba(255,200,61,0.08)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 28,
        }}>
          <span style={{
            fontFamily: display, fontSize: 28, color: J.dim,
            letterSpacing: '0.1em',
          }}>SCIENCE FRICTION · $600</span>
        </div>
        <div style={{
          fontFamily: display, fontSize: 88, lineHeight: 1.05,
          letterSpacing: '0.01em', textWrap: 'balance',
        }}>
          THIS NOBLE GAS IS WHAT GIVES NEON SIGNS THEIR CLASSIC RED-ORANGE GLOW.
        </div>
        {/* Buzz-in chip */}
        <div style={{
          position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
          background: buzzedColor,
          padding: '14px 32px',
          borderRadius: 999,
          fontFamily: display, fontSize: 28, letterSpacing: '0.06em',
          color: '#0E0B22',
          boxShadow: `0 12px 36px ${buzzedColor}80`,
          display: 'flex', alignItems: 'center', gap: 14,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 14, height: 14, background: '#0E0B22', borderRadius: 999,
            animation: 'jp-pulse 1.2s ease-in-out infinite',
          }}/>
          {buzzedLabel}
        </div>
      </div>

      {/* Scoreboard slot */}
      {children}
    </div>
  );
}

// =============== PRESENTER · INDIVIDUAL ===============
function Presenter() {
  return (
    <PresenterFrame buzzedLabel="PRIYA BUZZED IN">
      <div style={{
        padding: '20px 56px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14,
      }}>
        {PLAYERS.map((p, i) => {
          const isBuzzed = p.name === 'PRIYA';
          return (
            <div key={i} style={{
              background: isBuzzed ? J.bg3 : '#120D2E',
              border: `2px solid ${isBuzzed ? p.color : 'transparent'}`,
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: isBuzzed ? `0 0 24px ${p.color}55` : 'none',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#0E0B22', fontWeight: 700,
              }}>{p.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: display, fontSize: 20, letterSpacing: '0.04em',
                  color: J.ink,
                }}>{p.name}</div>
                <div style={{
                  fontFamily: display, fontSize: 28,
                  color: p.score < 0 ? J.red : J.gold,
                  lineHeight: 1, marginTop: 2,
                }}>{dollars(p.score)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </PresenterFrame>
  );
}

// =============== PRESENTER · TEAMS ===============
function PresenterTeam() {
  // Priya is on Team Encyclopedia
  const buzzedTeam = TEAMS.find(t => t.members.some(m => m.name === 'PRIYA'));
  return (
    <PresenterFrame
      buzzedLabel={`TEAM ${buzzedTeam.name} · PRIYA`}
      buzzedColor={buzzedTeam.color}
    >
      <div style={{
        padding: '20px 56px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
      }}>
        {TEAMS.map(team => {
          const isBuzzed = team.name === buzzedTeam.name;
          return (
            <div key={team.name} style={{
              background: isBuzzed ? J.bg3 : '#120D2E',
              border: `2px solid ${isBuzzed ? team.color : 'transparent'}`,
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: isBuzzed ? `0 0 28px ${team.color}55` : 'none',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, background: team.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: '#0E0B22', fontWeight: 800,
                }}>{team.glyph}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: display, fontSize: 16, color: J.dim,
                    letterSpacing: '0.18em',
                  }}>TEAM</div>
                  <div style={{
                    fontFamily: display, fontSize: 28, letterSpacing: '0.04em',
                    color: J.ink, lineHeight: 1,
                  }}>{team.name}</div>
                </div>
                <div style={{
                  fontFamily: display, fontSize: 44,
                  color: team.score < 0 ? J.red : J.gold,
                  lineHeight: 1,
                }}>{dollars(team.score)}</div>
              </div>
              {/* Members */}
              <div style={{
                display: 'flex', gap: 8,
                paddingTop: 14,
                borderTop: `1px dashed ${J.line2}`,
              }}>
                {team.members.map(m => (
                  <div key={m.name} style={{
                    flex: 1,
                    background: '#0E0B22',
                    borderRadius: 8, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: m.name === 'PRIYA' && isBuzzed
                      ? `1.5px solid ${team.color}` : `1px solid ${J.line}`,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 5, background: m.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#0E0B22', fontWeight: 700,
                    }}>{m.avatar}</span>
                    <span style={{
                      fontFamily: display, fontSize: 16,
                      letterSpacing: '0.04em', flex: 1,
                    }}>{m.name}</span>
                    <span style={{
                      fontFamily: display, fontSize: 16,
                      color: m.score < 0 ? J.red : J.dim,
                    }}>{dollars(m.score)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PresenterFrame>
  );
}

Object.assign(window.JP, { Presenter, PresenterTeam });
