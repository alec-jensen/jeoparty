// jp-host.jsx — Host control surface, redesigned for phone (390 × 844).
// Two modes: individuals + teams.

const { J, display, ui, PLAYERS, TEAMS, CATEGORIES, BOARD, VALUES,
        dollars, btnBase, PhoneShell } = window.JP;

// =============== HOST · INDIVIDUAL ===============
function HostMobile() {
  return (
    <PhoneShell>
      <HostFrame mode="solo">
        <ClueCard/>
        <JudgePanel
          buzzedName="PRIYA"
          buzzedColor={J.magenta}
          buzzedGlyph="✦"
          buzzedSubline={'said: "What is neon?"'}
          queue={[
            { label: '2 · ALEX',   color: J.gold },
            { label: '3 · JORDAN', color: J.violet },
          ]}
          reward="+ $600 → PRIYA"
        />
      </HostFrame>
    </PhoneShell>
  );
}

// =============== HOST · TEAMS ===============
function HostMobileTeam() {
  const buzzedTeam = TEAMS.find(t => t.name === 'ENCYCLOPEDIA');
  return (
    <PhoneShell>
      <HostFrame mode="team">
        <ClueCard/>
        <JudgePanel
          buzzedName={`TEAM ${buzzedTeam.name}`}
          buzzedSubline={'PRIYA buzzed first · "What is neon?"'}
          buzzedColor={buzzedTeam.color}
          buzzedGlyph={buzzedTeam.glyph}
          queue={[
            { label: '2 · TEAM HOT TAKES', color: J.gold },
            { label: '3 · TEAM LAB RATS',  color: J.mint },
          ]}
          reward={`+ $600 → TEAM ${buzzedTeam.name}`}
        />
      </HostFrame>
    </PhoneShell>
  );
}

// ============================================================
// SHARED HOST SCAFFOLD
// ============================================================
function HostFrame({ mode, children }) {
  return (
    <div style={{
      flex: 1, paddingTop: 44,
      display: 'flex', flexDirection: 'column',
      background: J.bg,
    }}>
      {/* App bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 10px',
        borderBottom: `1px solid ${J.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: display, fontSize: 22, color: J.gold,
            letterSpacing: '0.04em', lineHeight: 1,
          }}>JEOPARTY</span>
          <span style={{
            fontSize: 9, color: J.dim, letterSpacing: '0.22em',
            padding: '3px 6px', background: J.bg2,
            borderRadius: 4,
          }}>HOST</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, color: J.dim, letterSpacing: '0.18em',
          }}>4Q7P</span>
          <button style={{
            ...btnBase, width: 30, height: 30, borderRadius: 8,
            background: J.bg2, color: J.ink, fontSize: 14,
            border: `1px solid ${J.line}`,
          }}>⋯</button>
        </div>
      </div>

      {/* Round / progress */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: `1px solid ${J.line}`,
        background: J.bg2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: display, fontSize: 13, letterSpacing: '0.12em',
            color: J.ink,
          }}>ROUND 1 · 14/25</span>
          {mode === 'team' && (
            <span style={{
              fontSize: 9, color: J.bg, letterSpacing: '0.18em',
              padding: '3px 7px', background: J.mint,
              borderRadius: 999, fontWeight: 700,
            }}>TEAMS</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            ...btnBase, padding: '6px 10px', background: J.bg, color: J.ink,
            border: `1px solid ${J.line}`, fontSize: 10, letterSpacing: '0.14em',
          }}>BOARD</button>
          <button style={{
            ...btnBase, padding: '6px 10px', background: J.bg, color: J.ink,
            border: `1px solid ${J.line}`, fontSize: 10, letterSpacing: '0.14em',
          }}>NEXT →</button>
        </div>
      </div>

      {/* Scrollable middle */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: '14px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {children}

        {/* Players / Teams list */}
        {mode === 'solo' ? <PlayersList/> : <TeamsList/>}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: `1px solid ${J.line}`,
        background: J.bg2,
        paddingBottom: 8,
      }}>
        <BottomTab label="CLUE" active glyph="◆"/>
        <BottomTab label="BOARD" glyph="▦"/>
        <BottomTab label={mode === 'team' ? 'TEAMS' : 'PLAYERS'} glyph="◯"/>
      </div>
    </div>
  );
}

function BottomTab({ label, active, glyph }) {
  return (
    <button style={{
      ...btnBase, padding: '10px 0 6px',
      background: 'transparent', borderRadius: 0,
      borderTop: active ? `2px solid ${J.gold}` : `2px solid transparent`,
      color: active ? J.gold : J.dim,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: 16 }}>{glyph}</span>
      <span style={{
        fontFamily: display, fontSize: 11, letterSpacing: '0.16em',
      }}>{label}</span>
    </button>
  );
}

function ClueCard() {
  const [revealed, setRevealed] = React.useState(true);
  return (
    <div style={{
      background: J.bg2, borderRadius: 12, border: `1px solid ${J.line}`,
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: display, fontSize: 14, letterSpacing: '0.06em',
        }}>SCIENCE FRICTION</span>
        <span style={{
          fontFamily: display, fontSize: 18, color: J.gold,
        }}>$600</span>
      </div>
      <div style={{
        fontSize: 9, color: J.dim, letterSpacing: '0.22em',
        marginBottom: 4,
      }}>CLUE</div>
      <div style={{
        fontFamily: display, fontSize: 17, lineHeight: 1.2,
        letterSpacing: '0.01em',
      }}>
        This noble gas is what gives neon signs their classic red-orange glow.
      </div>
      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: `1px dashed ${J.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 9, color: J.dim, letterSpacing: '0.22em',
            marginBottom: 4,
          }}>ANSWER</div>
          <div style={{
            fontFamily: display, fontSize: 18, color: J.mint,
            letterSpacing: '0.04em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>WHAT IS NEON?</div>
        </div>
        <button style={{
          ...btnBase, background: J.bg, color: J.ink,
          border: `1px solid ${J.line}`,
          fontSize: 10, padding: '8px 10px',
          letterSpacing: '0.14em', flex: '0 0 auto',
        }}>📺 REVEAL ON TV</button>
      </div>
    </div>
  );
}

function JudgePanel({ buzzedName, buzzedSubline, buzzedColor, buzzedGlyph, queue, reward }) {
  return (
    <div style={{
      background: J.bg2, borderRadius: 12,
      border: `1.5px solid ${buzzedColor}`,
      boxShadow: `0 0 32px ${buzzedColor}33`,
      padding: '14px 14px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12,
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: 999, background: buzzedColor,
          boxShadow: `0 0 10px ${buzzedColor}`,
          animation: 'jp-pulse 1.2s ease-in-out infinite',
        }}/>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.22em',
        }}>BUZZED IN · 0.42s</span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: buzzedColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#0E0B22', fontWeight: 800,
        }}>{buzzedGlyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: display, fontSize: 22, letterSpacing: '0.04em',
            color: J.ink, lineHeight: 1.1,
          }}>{buzzedName}</div>
          <div style={{
            fontSize: 11, color: J.dim, marginTop: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{buzzedSubline}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button style={{
          ...btnBase, background: J.red, color: '#fff',
          fontFamily: display, fontSize: 18, letterSpacing: '0.06em',
          padding: '14px 0',
        }}>✕ WRONG</button>
        <button style={{
          ...btnBase, background: J.mint, color: '#0E0B22',
          fontFamily: display, fontSize: 18, letterSpacing: '0.06em',
          padding: '14px 0',
        }}>✓ CORRECT</button>
      </div>
      <div style={{
        marginTop: 8, textAlign: 'center',
        fontSize: 11, color: J.dim, letterSpacing: '0.04em',
      }}>{reward}</div>

      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: `1px dashed ${J.line}`,
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 9, color: J.dim, letterSpacing: '0.22em',
        }}>QUEUE</span>
        {queue.map(q => (
          <span key={q.label} style={{
            fontFamily: display, fontSize: 11, letterSpacing: '0.06em',
            color: J.ink,
            background: J.bg, padding: '4px 8px', borderRadius: 999,
            border: `1px solid ${q.color}55`,
          }}>{q.label}</span>
        ))}
      </div>
    </div>
  );
}

function PlayersList() {
  const sorted = [...PLAYERS].sort((a, b) => b.score - a.score);
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.22em',
        }}>PLAYERS · 6</span>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.04em',
        }}>tap ± to adjust</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: p.name === 'PRIYA' ? J.bg3 : '#120D2E',
            border: p.name === 'PRIYA' ? `1px solid ${p.color}` : '1px solid transparent',
            padding: '8px 10px', borderRadius: 10,
          }}>
            <span style={{
              fontFamily: display, fontSize: 12, color: J.dim, width: 12,
            }}>{i + 1}</span>
            <span style={{
              width: 26, height: 26, borderRadius: 6, background: p.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#0E0B22', fontWeight: 700,
            }}>{p.avatar}</span>
            <span style={{
              flex: 1, fontFamily: display, fontSize: 14, letterSpacing: '0.04em',
            }}>{p.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MiniStep>−</MiniStep>
              <span style={{
                fontFamily: display, fontSize: 14,
                color: p.score < 0 ? J.red : J.gold,
                minWidth: 56, textAlign: 'right',
              }}>{dollars(p.score)}</span>
              <MiniStep>+</MiniStep>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsList() {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.22em',
        }}>TEAMS · 3 · 6 PLAYERS</span>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.04em',
        }}>tap ± to adjust team</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...TEAMS].sort((a, b) => b.score - a.score).map((t, i) => (
          <div key={t.name} style={{
            background: i === 0 ? J.bg3 : '#120D2E',
            border: `1px solid ${i === 0 ? t.color : 'transparent'}`,
            padding: '10px 12px', borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: display, fontSize: 12, color: J.dim, width: 12,
              }}>{i + 1}</span>
              <span style={{
                width: 30, height: 30, borderRadius: 7, background: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#0E0B22', fontWeight: 800,
              }}>{t.glyph}</span>
              <span style={{
                flex: 1, fontFamily: display, fontSize: 16, letterSpacing: '0.04em',
              }}>{t.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MiniStep>−</MiniStep>
                <span style={{
                  fontFamily: display, fontSize: 18,
                  color: t.score < 0 ? J.red : J.gold,
                  minWidth: 64, textAlign: 'right',
                }}>{dollars(t.score)}</span>
                <MiniStep>+</MiniStep>
              </div>
            </div>
            <div style={{
              marginTop: 8, paddingTop: 8,
              borderTop: `1px dashed ${J.line}`,
              display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {t.members.map(m => (
                <span key={m.name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: J.bg, padding: '4px 8px',
                  borderRadius: 999, fontSize: 11,
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 4, background: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#0E0B22', fontWeight: 800,
                  }}>{m.avatar}</span>
                  <span style={{
                    fontFamily: display, letterSpacing: '0.04em',
                  }}>{m.name}</span>
                  <span style={{ color: J.dim }}>{dollars(m.score)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStep({ children }) {
  return (
    <button style={{
      ...btnBase, width: 22, height: 22, borderRadius: 5,
      background: J.bg, color: J.ink, fontSize: 13,
      border: `1px solid ${J.line}`, padding: 0,
    }}>{children}</button>
  );
}

Object.assign(window.JP, { HostMobile, HostMobileTeam });
