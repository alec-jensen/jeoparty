// jp-meta.jsx — Homepage (1280 × 880) + Board Editor (1440 × 900).

const { J, display, ui, CATEGORIES, btnBase } = window.JP;

// ============================================================
// HOMEPAGE
// ============================================================
function Homepage() {
  return (
    <div style={{
      width: 1280, height: 1140,
      background: `radial-gradient(ellipse at 30% -10%, ${J.bg3} 0%, ${J.bg} 55%)`,
      color: J.ink, fontFamily: ui,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: display, fontSize: 32, color: J.gold,
            letterSpacing: '0.02em', lineHeight: 1,
          }}>JEOPARTY</span>
          <span style={{
            fontSize: 10, color: J.dim, letterSpacing: '0.24em',
            padding: '3px 8px', borderRadius: 4, background: J.bg2,
          }}>v0.4.2</span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {['Boards', 'How it works', 'GitHub'].map(l => (
            <a key={l} href="#" style={{
              color: J.dim, fontSize: 14, textDecoration: 'none',
              letterSpacing: '0.04em',
            }}>{l}</a>
          ))}
          <button style={{
            ...btnBase, background: 'transparent', color: J.ink,
            border: `1px solid ${J.line2}`, padding: '8px 14px',
            fontSize: 12, letterSpacing: '0.14em', fontFamily: display,
          }}>SIGN IN</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 48px 24px', display: 'flex', gap: 48 }}>
        <div style={{ flex: 1, paddingTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: J.bg2, border: `1px solid ${J.line2}`,
            fontSize: 12, color: J.dim, letterSpacing: '0.14em',
            marginBottom: 18,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: J.mint }}/>
            SELF-HOSTED · OPEN SOURCE · NO ACCOUNTS
          </div>
          <h1 style={{
            fontFamily: display, fontSize: 110, lineHeight: 0.9,
            letterSpacing: '0.01em', margin: 0,
            color: J.ink,
          }}>
            TRIVIA NIGHT,<br/>
            <span style={{ color: J.gold }}>YOUR LIVING&nbsp;ROOM.</span>
          </h1>
          <p style={{
            marginTop: 22, maxWidth: 540,
            color: J.dim, fontSize: 17, lineHeight: 1.5,
          }}>
            Build a board in five minutes, beam it to the TV, and let everyone
            buzz in from their phone. No installs. No accounts. No ads on the
            big game-show buzzer in your friend's hand.
          </p>
        </div>

        {/* Two action cards */}
        <div style={{ width: 460, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* HOST */}
          <div style={{
            background: `linear-gradient(160deg, ${J.violet} 0%, #4830C9 100%)`,
            borderRadius: 18, padding: '24px 26px',
            boxShadow: `0 20px 50px rgba(124,92,255,0.32), inset 0 -8px 0 rgba(0,0,0,0.22)`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -30, top: -40,
              width: 140, height: 140, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }}/>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.22em', marginBottom: 6,
            }}>HOST A GAME</div>
            <div style={{
              fontFamily: display, fontSize: 44, color: '#fff', lineHeight: 1,
              letterSpacing: '0.02em',
            }}>START A ROOM</div>
            <div style={{
              marginTop: 12,
              fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5,
            }}>
              Pick a board, cast to your TV, and share the 4-letter code with
              your friends. The host runs the show from their phone.
            </div>
            <div style={{
              marginTop: 18, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <button style={{
                ...btnBase, background: J.gold, color: '#0E0B22',
                fontFamily: display, fontSize: 18, letterSpacing: '0.08em',
                padding: '12px 22px', borderRadius: 999,
                boxShadow: '0 8px 0 rgba(0,0,0,0.25)',
              }}>NEW ROOM →</button>
              <span style={{
                fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em',
              }}>or resume last game</span>
            </div>
          </div>

          {/* JOIN */}
          <div style={{
            background: J.bg2, borderRadius: 18,
            border: `1.5px solid ${J.line2}`,
            padding: '22px 24px',
          }}>
            <div style={{
              fontSize: 11, color: J.dim, letterSpacing: '0.22em',
              marginBottom: 8,
            }}>JOIN A GAME</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {['4', 'Q', '7', 'P'].map((c, i) => (
                <div key={i} style={{
                  width: 56, height: 64, borderRadius: 10,
                  background: J.bg, border: `2px solid ${J.gold}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: display, fontSize: 36, color: J.ink,
                }}>{c}</div>
              ))}
              <button style={{
                ...btnBase, flex: 1, marginLeft: 8, padding: '20px 0',
                background: J.gold, color: '#0E0B22',
                fontFamily: display, fontSize: 22, letterSpacing: '0.08em',
                borderRadius: 12,
              }}>JOIN →</button>
            </div>
            <div style={{
              marginTop: 10, fontSize: 12, color: J.dim, letterSpacing: '0.04em',
            }}>
              Players don't need to install anything — open the code on any phone.
            </div>
          </div>
        </div>
      </div>

      {/* Boards */}
      <div style={{ padding: '8px 48px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontFamily: display, fontSize: 28, color: J.ink,
            letterSpacing: '0.04em', margin: 0,
          }}>YOUR BOARDS</h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="#" style={{
              color: J.gold, fontSize: 12, letterSpacing: '0.14em',
              fontFamily: display, textDecoration: 'none',
            }}>BROWSE COMMUNITY →</a>
            <button style={{
              ...btnBase, background: 'transparent', color: J.ink,
              border: `1px solid ${J.line2}`, padding: '8px 14px',
              fontSize: 12, letterSpacing: '0.14em', fontFamily: display,
            }}>+ NEW BOARD</button>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flex: 1,
        }}>
          <BoardCard
            title="PARTY MIX VOL. 3"
            edited="Edited 2 days ago"
            stats="2 rounds · 60 clues"
            accent={J.gold}
            featured
          />
          <BoardCard
            title="OFFICE TRIVIA"
            edited="Edited last week"
            stats="1 round · 30 clues · DRAFT"
            accent={J.magenta}
          />
          <BoardCard
            title="WHO MADE THIS REFERENCE"
            edited="Played 3 times"
            stats="2 rounds · 60 clues"
            accent={J.mint}
          />
          <BoardCard
            title="MOVIE NIGHT — ANIMATED"
            edited="Edited Apr 2"
            stats="2 rounds · 50 clues"
            accent={J.violet}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 48px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', fontSize: 11, color: J.dim2, letterSpacing: '0.1em',
        borderTop: `1px solid ${J.line}`,
      }}>
        <span>SELF-HOSTED · DEPLOY IN ONE COMMAND · MIT LICENSED</span>
        <span>JEOPARTY IS A FAN PROJECT · NOT AFFILIATED WITH ANY GAME SHOW</span>
      </div>
    </div>
  );
}

function BoardCard({ title, edited, stats, accent, featured }) {
  return (
    <div style={{
      background: J.bg2,
      border: `1.5px solid ${featured ? accent : J.line}`,
      borderRadius: 14,
      padding: '16px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
      boxShadow: featured ? `0 0 28px ${accent}33` : 'none',
    }}>
      {/* Mini board preview */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2,
        background: J.bg, padding: 6, borderRadius: 6,
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`h${i}`} style={{
            aspectRatio: '1',
            background: accent,
            opacity: 0.85,
            borderRadius: 1,
          }}/>
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`c${i}`} style={{
            aspectRatio: '1',
            background: i % 3 === 0 ? 'transparent' : J.bg4,
            border: i % 3 === 0 ? `1px dashed ${J.line}` : 'none',
            borderRadius: 1,
          }}/>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: display, fontSize: 18, letterSpacing: '0.04em',
          lineHeight: 1.1, color: J.ink,
        }}>{title}</div>
        <div style={{ fontSize: 11, color: J.dim, marginTop: 6, letterSpacing: '0.04em' }}>
          {stats}
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: J.dim2,
      }}>
        <span>{edited}</span>
        <span style={{
          fontFamily: display, fontSize: 12, color: accent, letterSpacing: '0.14em',
        }}>PLAY →</span>
      </div>
    </div>
  );
}

// ============================================================
// BOARD EDITOR
// ============================================================
function BoardEditor() {
  // 5×5 truncated clue text
  const CLUES = [
    ['Cary Grant chase scene…',  'The crop duster lands…',  'Vertigo opening shot…',     'Hitchcock cameo in…',  'The Birds is set in…'],
    ['First state to ratify…',   'Capital moved to D.C.…',  'The 27th amendment…',       'POTUS pardons…',       'The Senate filibuster…'],
    ['Schrödinger imagined…',    'A black hole\'s event…',  'This noble gas glows…',     'Quantum entanglement…','The Hubble constant…'],
    ['Britney\'s 2003 single…',  'Aqua\'s Barbie Girl…',    'Carly Rae\'s peak…',        'One-hit wonder of…',    'Robyn\'s 2010 anthem…'],
    ['A palindrome that…',       'The longest word in…',    'Etymology of "robot"…',     'A hapax legomenon…',    'Why "ghoti" might…'],
  ];
  const selR = 2, selC = 2; // $600 Science Friction selected

  return (
    <div style={{
      width: 1440, height: 900,
      background: J.bg,
      color: J.ink, fontFamily: ui,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* App bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', borderBottom: `1px solid ${J.line}`,
        background: J.bg2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{
            ...btnBase, background: 'transparent', color: J.dim,
            border: `1px solid ${J.line2}`, padding: '6px 12px',
            fontSize: 12, letterSpacing: '0.1em',
          }}>← BOARDS</button>
          <span style={{
            fontFamily: display, fontSize: 22, color: J.gold,
            letterSpacing: '0.04em',
          }}>JEOPARTY</span>
          <span style={{
            fontSize: 10, color: J.dim, letterSpacing: '0.22em',
            padding: '3px 8px', background: J.bg, borderRadius: 4,
          }}>EDITOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: display, fontSize: 22, color: J.ink, letterSpacing: '0.04em',
          }}>PARTY MIX VOL. 3</span>
          <span style={{
            fontSize: 10, color: J.dim, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: J.mint }}/>
            AUTOSAVED · 2 MIN AGO
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            ...btnBase, background: 'transparent', color: J.ink,
            border: `1px solid ${J.line2}`, padding: '10px 14px',
            fontSize: 11, letterSpacing: '0.14em', fontFamily: display,
          }}>SHARE</button>
          <button style={{
            ...btnBase, background: J.gold, color: '#0E0B22',
            padding: '10px 16px', fontSize: 13, letterSpacing: '0.14em',
            fontFamily: display, fontWeight: 700,
          }}>▶ START GAME</button>
        </div>
      </div>

      {/* Round tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 28px 0',
        borderBottom: `1px solid ${J.line}`,
      }}>
        {[
          { label: 'ROUND 1', active: true, fill: '25 / 25' },
          { label: 'ROUND 2', fill: '12 / 25' },
          { label: 'FINAL',   fill: '1 / 1'  },
        ].map(t => (
          <button key={t.label} style={{
            ...btnBase, padding: '10px 18px', borderRadius: '8px 8px 0 0',
            background: t.active ? J.bg2 : 'transparent',
            color: t.active ? J.gold : J.dim,
            border: t.active ? `1px solid ${J.line2}` : '1px solid transparent',
            borderBottom: t.active ? 'none' : '1px solid transparent',
            fontFamily: display, fontSize: 13, letterSpacing: '0.14em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t.label}
            <span style={{
              fontSize: 10, color: J.dim, padding: '2px 6px',
              background: J.bg, borderRadius: 4, letterSpacing: '0.06em',
            }}>{t.fill}</span>
          </button>
        ))}
      </div>

      {/* Main: board + side panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* Board */}
        <div style={{ padding: 24, overflow: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'auto repeat(5, 1fr)',
            gap: 8,
            height: '100%',
          }}>
            {CATEGORIES.map((c, i) => (
              <div key={i} style={{
                background: `linear-gradient(180deg, ${J.violet} 0%, #5A3FE0 100%)`,
                color: '#fff', padding: '10px 8px', borderRadius: 4,
                fontFamily: display, fontSize: 16, lineHeight: 1.0,
                letterSpacing: '0.02em', textAlign: 'center', whiteSpace: 'pre-line',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 56, position: 'relative',
                boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25)',
              }}>
                {c}
                <span style={{
                  position: 'absolute', top: 4, right: 6,
                  fontSize: 9, color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.18em',
                }}>EDIT</span>
              </div>
            ))}
            {CLUES.flatMap((row, rIdx) => row.map((clue, cIdx) => {
              const v = (rIdx + 1) * 200;
              const isSel = rIdx === selR && cIdx === selC;
              const isDD = rIdx === 3 && cIdx === 4; // mock Daily Double
              return (
                <div key={`${rIdx}-${cIdx}`} style={{
                  background: isSel ? J.bg3 : J.bg2,
                  border: `2px solid ${isSel ? J.gold : J.line}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  display: 'flex', flexDirection: 'column',
                  gap: 6, position: 'relative',
                  boxShadow: isSel ? `0 0 28px ${J.gold}55` : 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontFamily: display, fontSize: 18, color: J.gold,
                    }}>${v}</span>
                    {isDD && (
                      <span style={{
                        fontSize: 9, letterSpacing: '0.18em', color: '#0E0B22',
                        background: J.gold, padding: '2px 6px', borderRadius: 4,
                        fontWeight: 700,
                      }}>DAILY DOUBLE</span>
                    )}
                    {isSel && (
                      <span style={{
                        fontSize: 9, letterSpacing: '0.18em', color: J.gold,
                      }}>EDITING ▸</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: J.ink, lineHeight: 1.35,
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  }}>{clue}</div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          borderLeft: `1px solid ${J.line}`,
          padding: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: 16,
          background: J.bg2,
          overflow: 'auto',
        }}>
          <div>
            <div style={{
              fontSize: 10, color: J.dim, letterSpacing: '0.22em', marginBottom: 6,
            }}>EDITING</div>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
            }}>
              <span style={{
                fontFamily: display, fontSize: 22, letterSpacing: '0.04em',
              }}>SCIENCE FRICTION</span>
              <span style={{
                fontFamily: display, fontSize: 22, color: J.gold,
              }}>$600</span>
            </div>
            <div style={{
              display: 'flex', gap: 6, marginTop: 8,
            }}>
              <Tab active>CLUE</Tab>
              <Tab>MEDIA</Tab>
              <Tab>HOST NOTES</Tab>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: J.dim, letterSpacing: '0.22em', marginBottom: 6,
            }}>CLUE (SHOWN TO PLAYERS)</div>
            <div style={{
              background: J.bg, border: `1.5px solid ${J.gold}`, borderRadius: 10,
              padding: '12px 14px',
              fontFamily: display, fontSize: 18, lineHeight: 1.25,
              letterSpacing: '0.01em',
              minHeight: 110,
              position: 'relative',
            }}>
              This noble gas is what gives neon signs their classic red-orange glow.
              <span style={{
                width: 2, height: 22, background: J.gold, display: 'inline-block',
                verticalAlign: 'middle', marginLeft: 2,
                animation: 'jp-caret 1s steps(2) infinite',
              }}/>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: J.dim, letterSpacing: '0.22em', marginBottom: 6,
            }}>ANSWER (HOST ONLY)</div>
            <div style={{
              background: J.bg, border: `1px solid ${J.line2}`, borderRadius: 10,
              padding: '12px 14px',
              fontFamily: display, fontSize: 18, color: J.mint,
            }}>WHAT IS NEON?</div>
            <div style={{ fontSize: 11, color: J.dim, marginTop: 6 }}>
              Aliases (host can accept): <span style={{ color: J.ink }}>neon, Ne</span>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: J.dim, letterSpacing: '0.22em', marginBottom: 8,
            }}>OPTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row label="Daily Double" right={<Toggle on={false}/>}/>
              <Row label="Time limit" right={
                <span style={{ fontFamily: display, fontSize: 14, color: J.ink }}>
                  20<span style={{ color: J.dim }}>s</span>
                </span>
              }/>
              <Row label="Category fit" right={
                <span style={{ fontSize: 11, color: J.mint }}>● strong</span>
              }/>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
            <button style={{
              ...btnBase, flex: 1, background: 'transparent', color: J.red,
              border: `1px solid ${J.red}55`, padding: '10px 0',
              fontSize: 11, letterSpacing: '0.18em', fontFamily: display,
            }}>DELETE CLUE</button>
            <button style={{
              ...btnBase, flex: 2, background: J.gold, color: '#0E0B22',
              padding: '10px 0', fontSize: 12, letterSpacing: '0.18em',
              fontFamily: display, fontWeight: 700,
            }}>NEXT CLUE →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({ children, active }) {
  return (
    <button style={{
      ...btnBase, padding: '6px 12px', borderRadius: 6,
      background: active ? J.bg : 'transparent',
      color: active ? J.gold : J.dim,
      border: `1px solid ${active ? J.line2 : 'transparent'}`,
      fontFamily: display, fontSize: 11, letterSpacing: '0.14em',
    }}>{children}</button>
  );
}

function Row({ label, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px', background: J.bg, borderRadius: 8,
      border: `1px solid ${J.line}`,
    }}>
      <span style={{ fontSize: 13, color: J.ink }}>{label}</span>
      {right}
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 36, height: 20, borderRadius: 999,
      background: on ? J.gold : '#2B2256',
      position: 'relative',
      transition: 'background .2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 999, background: '#fff',
        transition: 'left .2s',
      }}/>
    </div>
  );
}

Object.assign(window.JP, { Homepage, BoardEditor });
