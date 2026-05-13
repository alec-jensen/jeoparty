// jp-dashboard.jsx — Host Dashboard (1440 × 960)
// "Showrunner Studio" — library on the left, board spotlight + grid in the middle,
// launch panel on the right. The whole thing is geared around picking a board
// and starting a game (cast to TV, pick mode, pick round, go).

const { J, display, ui, CATEGORIES, btnBase } = window.JP;

// ---- Sample board library ---------------------------------------------------

const BOARDS = [
  {
    id: 'party-mix-3',
    title: 'PARTY MIX VOL. 3',
    tags: ['POP', 'MOVIES', 'SCIENCE'],
    rounds: 2, clues: 60,
    lastPlayed: '2 days ago',
    plays: 4,
    accent: J.gold,
    cats: ['BUTTERY\nCINEMA', 'STATE OF\nTHE UNION', 'SCIENCE\nFRICTION', 'POP\nTARTS', 'WORD UP'],
    status: 'ready',
    featured: true,
  },
  {
    id: 'office',
    title: 'OFFICE TRIVIA',
    tags: ['WORK', 'INSIDE JOKES'],
    rounds: 1, clues: 30,
    lastPlayed: 'last week',
    plays: 1,
    accent: J.magenta,
    cats: ['SLACK\nLORE', 'STAND-UPS', 'CONF ROOMS', 'COFFEE', 'OUTAGES'],
    status: 'draft',
  },
  {
    id: 'reference',
    title: 'WHO MADE THIS REFERENCE',
    tags: ['MOVIES', 'TV', 'MUSIC'],
    rounds: 2, clues: 60,
    lastPlayed: '3 weeks ago',
    plays: 3,
    accent: J.mint,
    cats: ['THE OFFICE', 'SIMPSONS', 'TARANTINO', 'DRAKE LYRICS', 'SEINFELD'],
    status: 'ready',
  },
  {
    id: 'movie-anim',
    title: 'MOVIE NIGHT — ANIMATED',
    tags: ['MOVIES', 'KIDS'],
    rounds: 2, clues: 50,
    lastPlayed: 'Apr 2',
    plays: 2,
    accent: J.violet,
    cats: ['PIXAR', 'GHIBLI', 'DISNEY 90s', 'DREAMWORKS', 'STOP-MOTION'],
    status: 'ready',
  },
  {
    id: 'science',
    title: 'NERD SNIPE',
    tags: ['SCIENCE', 'MATH'],
    rounds: 2, clues: 60,
    lastPlayed: 'never',
    plays: 0,
    accent: '#5BA9FF',
    cats: ['PHYSICS', 'BIOLOGY', 'CHEMISTRY', 'MATH', 'CS'],
    status: 'draft',
  },
  {
    id: 'food',
    title: 'EAT THE MENU',
    tags: ['FOOD', 'CULTURE'],
    rounds: 1, clues: 30,
    lastPlayed: 'Mar 14',
    plays: 5,
    accent: '#FF8A3D',
    cats: ['SUSHI', 'TACOS', 'WINE', 'CHEESE', 'STREET FOOD'],
    status: 'ready',
  },
];

// ============================================================================
// HOST DASHBOARD
// ============================================================================
function HostDashboard() {
  return (
    <div style={{
      width: 1440, height: 960,
      background: J.bg, color: J.ink, fontFamily: ui,
      display: 'grid',
      gridTemplateRows: '60px 1fr',
      overflow: 'hidden',
    }}>
      <TopBar/>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 400px',
        minHeight: 0,
      }}>
        <Sidebar/>
        <Library/>
        <LaunchRail/>
      </div>
    </div>
  );
}

// ---- Top bar ---------------------------------------------------------------

function TopBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: `1px solid ${J.line}`,
      background: J.bg2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontFamily: display, fontSize: 24, color: J.gold,
          letterSpacing: '0.02em', lineHeight: 1,
        }}>JEOPARTY</span>
        <span style={{
          fontSize: 10, color: J.dim, letterSpacing: '0.24em',
          padding: '3px 8px', borderRadius: 4, background: J.bg,
        }}>HOST DASHBOARD</span>
      </div>

      <div style={{
        flex: 1, maxWidth: 460, margin: '0 32px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: J.bg, border: `1px solid ${J.line2}`,
        borderRadius: 8, padding: '8px 14px',
      }}>
        <span style={{ color: J.dim2, fontSize: 14 }}>⌕</span>
        <input
          defaultValue=""
          placeholder="Search 6 boards, tags, categories…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: J.ink, fontFamily: ui, fontSize: 13,
          }}/>
        <span style={{
          fontSize: 10, color: J.dim2, letterSpacing: '0.14em',
          border: `1px solid ${J.line}`, padding: '2px 6px', borderRadius: 4,
        }}>⌘K</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          ...btnBase, background: 'transparent', color: J.ink,
          border: `1px solid ${J.line2}`, padding: '8px 14px',
          fontSize: 11, letterSpacing: '0.16em', fontFamily: display,
        }}>+ NEW BOARD</button>
        <button style={{
          ...btnBase, background: 'transparent', color: J.dim,
          border: `1px solid ${J.line}`, padding: '8px 10px',
          fontSize: 12, borderRadius: 8,
        }}>?</button>
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: J.violet,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0E0B22', fontFamily: display, fontSize: 14, fontWeight: 700,
        }}>SK</div>
      </div>
    </div>
  );
}

// ---- Sidebar ---------------------------------------------------------------

function Sidebar() {
  const nav = [
    { label: 'All boards', count: 6, active: true, glyph: '▦' },
    { label: 'Drafts',     count: 2, glyph: '✎' },
    { label: 'Ready',      count: 4, glyph: '◆' },
    { label: 'Played',     count: 5, glyph: '▷' },
    { label: 'Archived',   count: 1, glyph: '⬚' },
  ];
  const tags = [
    { label: 'MOVIES',    n: 3 },
    { label: 'SCIENCE',   n: 2 },
    { label: 'POP',       n: 2 },
    { label: 'WORK',      n: 1 },
    { label: 'FOOD',      n: 1 },
    { label: 'KIDS',      n: 1 },
  ];
  return (
    <div style={{
      borderRight: `1px solid ${J.line}`,
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', gap: 22,
      overflow: 'auto',
      background: J.bg,
    }}>
      <div>
        <SectionHeader>LIBRARY</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          {nav.map(n => (
            <NavRow key={n.label} {...n}/>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader>TAGS</SectionHeader>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10,
        }}>
          {tags.map(t => (
            <span key={t.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 9px', borderRadius: 999,
              background: J.bg2, border: `1px solid ${J.line}`,
              fontSize: 10, color: J.dim, letterSpacing: '0.14em',
              fontFamily: display,
            }}>
              {t.label}
              <span style={{ color: J.dim2 }}>{t.n}</span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader>RECENT ROOMS</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          <RoomRow code="4Q7P" subtitle="Party Mix · 6 players" live/>
          <RoomRow code="K2M9" subtitle="Office Trivia · ended"/>
          <RoomRow code="B8XT" subtitle="Movie Night · ended"/>
        </div>
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '12px 12px',
        borderRadius: 10, background: J.bg2,
        border: `1px dashed ${J.line2}`,
        fontSize: 11, color: J.dim, lineHeight: 1.5,
      }}>
        <span style={{
          fontFamily: display, color: J.ink, letterSpacing: '0.12em',
          fontSize: 11, display: 'block', marginBottom: 4,
        }}>SELF-HOSTED</span>
        Running on <span style={{ color: J.mint }}>localhost:7300</span>.
        Players join from anything on your LAN.
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 10, color: J.dim2, letterSpacing: '0.24em',
      fontFamily: display,
    }}>{children}</div>
  );
}

function NavRow({ label, count, active, glyph }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 8,
      background: active ? J.bg2 : 'transparent',
      border: `1px solid ${active ? J.line2 : 'transparent'}`,
      cursor: 'pointer',
    }}>
      <span style={{
        width: 16, color: active ? J.gold : J.dim2, fontSize: 13, textAlign: 'center',
      }}>{glyph}</span>
      <span style={{
        flex: 1, fontSize: 13, color: active ? J.ink : J.dim,
        letterSpacing: '0.02em',
      }}>{label}</span>
      <span style={{
        fontSize: 10, color: active ? J.gold : J.dim2,
        fontFamily: display, letterSpacing: '0.08em',
      }}>{count}</span>
    </div>
  );
}

function RoomRow({ code, subtitle, live }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px', borderRadius: 8,
      background: live ? J.bg3 : 'transparent',
      border: live ? `1px solid ${J.mint}55` : `1px solid ${J.line}`,
    }}>
      <span style={{
        fontFamily: display, fontSize: 13, color: live ? J.mint : J.dim,
        letterSpacing: '0.16em',
      }}>{code}</span>
      <span style={{
        flex: 1, fontSize: 10, color: J.dim2, letterSpacing: '0.04em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{subtitle}</span>
      {live && (
        <span style={{
          width: 6, height: 6, borderRadius: 999, background: J.mint,
          boxShadow: `0 0 8px ${J.mint}`,
          animation: 'jp-pulse 1.2s ease-in-out infinite',
        }}/>
      )}
    </div>
  );
}

// ---- Library (main column) -------------------------------------------------

function Library() {
  return (
    <div style={{
      padding: '20px 24px 24px',
      overflow: 'auto',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 style={{
            fontFamily: display, fontSize: 36, letterSpacing: '0.02em',
            margin: 0, color: J.ink, lineHeight: 1,
          }}>YOUR BOARDS</h1>
          <span style={{
            fontSize: 12, color: J.dim, letterSpacing: '0.04em',
          }}>6 boards · 280 clues · last played 2 days ago</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SortBtn active>RECENT</SortBtn>
          <SortBtn>NAME</SortBtn>
          <SortBtn>MOST PLAYED</SortBtn>
          <span style={{
            width: 1, background: J.line, margin: '4px 4px',
          }}/>
          <ViewBtn active glyph="▦"/>
          <ViewBtn glyph="≡"/>
        </div>
      </div>

      {/* Spotlight (selected) */}
      <Spotlight board={BOARDS[0]}/>

      {/* Grid of the rest */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
      }}>
        {BOARDS.slice(1).map(b => (
          <BoardTile key={b.id} board={b}/>
        ))}
      </div>
    </div>
  );
}

function SortBtn({ children, active }) {
  return (
    <button style={{
      ...btnBase, padding: '6px 10px',
      background: active ? J.bg2 : 'transparent',
      color: active ? J.gold : J.dim,
      border: `1px solid ${active ? J.line2 : 'transparent'}`,
      fontSize: 10, letterSpacing: '0.16em', fontFamily: display,
    }}>{children}</button>
  );
}

function ViewBtn({ glyph, active }) {
  return (
    <button style={{
      ...btnBase, width: 30, height: 30, padding: 0,
      background: active ? J.bg2 : 'transparent',
      color: active ? J.gold : J.dim,
      border: `1px solid ${active ? J.line2 : J.line}`,
      fontSize: 14,
    }}>{glyph}</button>
  );
}

function Spotlight({ board }) {
  return (
    <div style={{
      background: `linear-gradient(140deg, ${J.bg3} 0%, ${J.bg2} 60%, ${J.bg} 100%)`,
      borderRadius: 16,
      border: `1.5px solid ${board.accent}`,
      boxShadow: `0 0 40px ${board.accent}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
      padding: 22,
      display: 'grid', gridTemplateColumns: '320px 1fr auto', gap: 24,
      alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative diagonals */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(135deg, ${board.accent}08 0px, ${board.accent}08 1px, transparent 1px, transparent 14px)`,
        pointerEvents: 'none',
      }}/>

      {/* Mini board preview, bigger */}
      <div style={{
        background: J.bg, padding: 10, borderRadius: 10,
        border: `1px solid ${J.line2}`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3,
        }}>
          {board.cats.map((c, i) => (
            <div key={i} style={{
              background: `linear-gradient(180deg, ${J.violet} 0%, #5A3FE0 100%)`,
              color: '#fff', borderRadius: 2,
              fontFamily: display, fontSize: 8, letterSpacing: '0.04em',
              padding: '6px 2px', textAlign: 'center', whiteSpace: 'pre-line',
              lineHeight: 1, minHeight: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{c.replace('\n', ' ')}</div>
          ))}
          {Array.from({ length: 25 }).map((_, i) => {
            const v = (Math.floor(i / 5) + 1) * 200;
            return (
              <div key={i} style={{
                background: J.bg4, borderRadius: 2,
                aspectRatio: '1.4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: display, fontSize: 10, color: board.accent,
                letterSpacing: '0.04em',
              }}>${v}</div>
            );
          })}
        </div>
      </div>

      {/* Middle content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 10, color: board.accent, letterSpacing: '0.24em',
          fontFamily: display, marginBottom: 6,
        }}>● SELECTED BOARD</div>
        <div style={{
          fontFamily: display, fontSize: 44, letterSpacing: '0.02em',
          lineHeight: 1, color: J.ink, marginBottom: 8,
        }}>{board.title}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          fontSize: 12, color: J.dim, letterSpacing: '0.04em',
        }}>
          <Stat label="ROUNDS" value={board.rounds}/>
          <Sep/>
          <Stat label="CLUES" value={board.clues}/>
          <Sep/>
          <Stat label="PLAYS" value={board.plays}/>
          <Sep/>
          <Stat label="EST. TIME" value="45m"/>
          <Sep/>
          <Stat label="LAST" value={board.lastPlayed}/>
        </div>
        <div style={{
          display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap',
        }}>
          {board.tags.map(t => (
            <span key={t} style={{
              padding: '4px 9px', borderRadius: 999,
              background: J.bg, border: `1px solid ${J.line2}`,
              fontSize: 10, color: J.dim, letterSpacing: '0.16em',
              fontFamily: display,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch',
        position: 'relative', zIndex: 1, minWidth: 180,
      }}>
        <button style={{
          ...btnBase, background: 'transparent', color: J.ink,
          border: `1px solid ${J.line2}`, padding: '10px 14px',
          fontSize: 11, letterSpacing: '0.16em', fontFamily: display,
        }}>OPEN IN EDITOR</button>
        <button style={{
          ...btnBase, background: 'transparent', color: J.dim,
          border: `1px solid ${J.line}`, padding: '10px 14px',
          fontSize: 11, letterSpacing: '0.16em', fontFamily: display,
        }}>DUPLICATE</button>
        <button style={{
          ...btnBase, background: 'transparent', color: J.dim,
          border: `1px solid ${J.line}`, padding: '10px 14px',
          fontSize: 11, letterSpacing: '0.16em', fontFamily: display,
        }}>EXPORT .JSON</button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontSize: 10, color: J.dim2, letterSpacing: '0.22em',
        fontFamily: display,
      }}>{label}</span>
      <span style={{
        fontFamily: display, fontSize: 16, color: J.ink, letterSpacing: '0.04em',
      }}>{value}</span>
    </span>
  );
}

function Sep() {
  return <span style={{ width: 3, height: 3, borderRadius: 999, background: J.dim2 }}/>;
}

// ---- Smaller board tiles ---------------------------------------------------

function BoardTile({ board }) {
  return (
    <div style={{
      background: J.bg2,
      border: `1px solid ${J.line}`,
      borderRadius: 12,
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}>
      {/* Preview */}
      <div style={{
        background: J.bg, padding: 6, borderRadius: 6,
        border: `1px solid ${J.line}`,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2,
        }}>
          {board.cats.map((c, i) => (
            <div key={i} style={{
              background: J.violet, height: 14, borderRadius: 1,
              opacity: 0.9,
            }}/>
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{
              background: J.bg4, aspectRatio: '1.5', borderRadius: 1,
              opacity: i % 7 === 0 ? 0.35 : 1,
            }}/>
          ))}
        </div>
      </div>

      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: board.accent,
          }}/>
          {board.status === 'draft' && (
            <span style={{
              fontSize: 9, color: J.dim, letterSpacing: '0.22em',
              fontFamily: display,
            }}>DRAFT</span>
          )}
          {board.status === 'ready' && (
            <span style={{
              fontSize: 9, color: board.accent, letterSpacing: '0.22em',
              fontFamily: display,
            }}>READY</span>
          )}
        </div>
        <div style={{
          fontFamily: display, fontSize: 18, letterSpacing: '0.03em',
          lineHeight: 1.1, color: J.ink,
        }}>{board.title}</div>
        <div style={{
          fontSize: 11, color: J.dim, marginTop: 6, letterSpacing: '0.04em',
        }}>
          {board.rounds} round{board.rounds > 1 ? 's' : ''} · {board.clues} clues
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: `1px dashed ${J.line}`,
      }}>
        <span style={{
          fontSize: 10, color: J.dim2, letterSpacing: '0.04em',
        }}>played {board.plays}× · {board.lastPlayed}</span>
        <button style={{
          ...btnBase, background: 'transparent', color: board.accent,
          border: `1px solid ${board.accent}55`,
          padding: '5px 10px', fontSize: 10, letterSpacing: '0.18em',
          fontFamily: display,
        }}>SELECT</button>
      </div>
    </div>
  );
}

// ---- Launch rail (right column) --------------------------------------------

function LaunchRail() {
  const sel = BOARDS[0];
  return (
    <div style={{
      borderLeft: `1px solid ${J.line}`,
      background: J.bg2,
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 18,
      overflow: 'auto',
    }}>
      <div>
        <div style={{
          fontSize: 10, color: J.dim2, letterSpacing: '0.24em',
          fontFamily: display, marginBottom: 4,
        }}>START A GAME</div>
        <div style={{
          fontFamily: display, fontSize: 28, letterSpacing: '0.02em',
          lineHeight: 1, color: J.ink,
        }}>{sel.title}</div>
      </div>

      {/* Cast status */}
      <div style={{
        background: J.bg, borderRadius: 12,
        border: `1px solid ${J.line2}`,
        padding: 14,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 10, color: J.dim, letterSpacing: '0.22em',
            fontFamily: display,
          }}>BIG SCREEN</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: J.mint, letterSpacing: '0.18em',
            fontFamily: display,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: J.mint,
              boxShadow: `0 0 8px ${J.mint}`,
            }}/>
            CONNECTED
          </span>
        </div>
        {/* fake TV preview */}
        <div style={{
          aspectRatio: '16 / 9', background: J.bg4,
          borderRadius: 8, border: `1px solid ${J.line}`,
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2,
          padding: 6, overflow: 'hidden',
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              background: i < 5
                ? `linear-gradient(180deg, ${J.violet}, #5A3FE0)`
                : J.bg2,
              borderRadius: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, color: i < 5 ? '#fff' : J.gold, fontFamily: display,
              letterSpacing: '0.02em',
            }}>
              {i < 5 ? '' : `$${(Math.floor((i - 5) / 5) + 1) * 200}`}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10,
        }}>
          <span style={{ fontSize: 12, color: J.ink }}>
            <span style={{ color: J.dim }}>casting to </span>
            <span style={{ fontFamily: display, letterSpacing: '0.06em' }}>LIVING ROOM TV</span>
          </span>
          <button style={{
            ...btnBase, background: 'transparent', color: J.dim,
            border: `1px solid ${J.line}`, padding: '4px 8px',
            fontSize: 10, letterSpacing: '0.14em', fontFamily: display,
          }}>CHANGE</button>
        </div>
      </div>

      {/* Mode toggle */}
      <Field label="MODE">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          <ModeOption active glyph="◯" label="SOLO" sub="every player for themself"/>
          <ModeOption glyph="◇" label="TEAMS" sub="3 teams · combined scores"/>
        </div>
      </Field>

      {/* Round picker */}
      <Field label="STARTING ROUND">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        }}>
          <RoundChip active>ROUND 1</RoundChip>
          <RoundChip>ROUND 2</RoundChip>
          <RoundChip>FINAL</RoundChip>
        </div>
      </Field>

      {/* Options */}
      <Field label="OPTIONS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <OptRow label="Daily Doubles" right={<TagPill text="2 · ON" mint/>}/>
          <OptRow label="Per-clue timer" right={<TagPill text="20s"/>}/>
          <OptRow label="Sound effects" right={<TagPill text="ON" mint/>}/>
          <OptRow label="Shuffle categories" right={<TagPill text="OFF" muted/>}/>
        </div>
      </Field>

      {/* Big start */}
      <div style={{
        marginTop: 'auto',
        background: `linear-gradient(160deg, ${J.violet} 0%, #4830C9 100%)`,
        borderRadius: 14, padding: '16px 18px',
        boxShadow: '0 18px 40px rgba(124,92,255,0.30), inset 0 -6px 0 rgba(0,0,0,0.22)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.22em', fontFamily: display,
            }}>NEW ROOM CODE</div>
            <div style={{
              display: 'flex', gap: 4, marginTop: 6,
            }}>
              {['8', 'F', 'R', '2'].map(c => (
                <span key={c} style={{
                  width: 26, height: 32, borderRadius: 5,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: display, fontSize: 20, color: '#fff',
                  letterSpacing: '0.04em',
                }}>{c}</span>
              ))}
            </div>
          </div>
          <button style={{
            ...btnBase, background: 'rgba(255,255,255,0.12)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.22)',
            padding: '6px 10px', fontSize: 10, letterSpacing: '0.16em',
            fontFamily: display, borderRadius: 6,
          }}>↻</button>
        </div>
        <button style={{
          ...btnBase, width: '100%', background: J.gold, color: '#0E0B22',
          fontFamily: display, fontSize: 20, letterSpacing: '0.10em',
          padding: '14px 0', borderRadius: 10,
          boxShadow: '0 6px 0 rgba(0,0,0,0.28)',
        }}>▶ START GAME</button>
        <div style={{
          marginTop: 8, textAlign: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.14em',
          fontFamily: display,
        }}>HOST FROM PHONE · PLAYERS JOIN AT JEOPARTY.LAN/8FR2</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: J.dim2, letterSpacing: '0.24em',
        fontFamily: display, marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  );
}

function ModeOption({ active, glyph, label, sub }) {
  return (
    <div style={{
      padding: '12px 12px',
      borderRadius: 10,
      background: active ? J.bg3 : J.bg,
      border: `1.5px solid ${active ? J.gold : J.line}`,
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontSize: 16, color: active ? J.gold : J.dim,
        }}>{glyph}</span>
        <span style={{
          fontFamily: display, fontSize: 14, letterSpacing: '0.08em',
          color: active ? J.gold : J.ink,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 10, color: J.dim, letterSpacing: '0.04em', lineHeight: 1.35,
      }}>{sub}</div>
    </div>
  );
}

function RoundChip({ children, active }) {
  return (
    <button style={{
      ...btnBase, padding: '10px 0',
      background: active ? J.bg3 : J.bg,
      color: active ? J.gold : J.dim,
      border: `1px solid ${active ? J.gold : J.line}`,
      fontFamily: display, fontSize: 11, letterSpacing: '0.14em',
    }}>{children}</button>
  );
}

function OptRow({ label, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: J.bg, borderRadius: 8,
      border: `1px solid ${J.line}`,
    }}>
      <span style={{ fontSize: 12, color: J.ink }}>{label}</span>
      {right}
    </div>
  );
}

function TagPill({ text, mint, muted }) {
  const color = muted ? J.dim2 : (mint ? J.mint : J.gold);
  return (
    <span style={{
      fontFamily: display, fontSize: 10, letterSpacing: '0.18em',
      padding: '3px 8px', borderRadius: 999,
      color, border: `1px solid ${color}55`,
    }}>{text}</span>
  );
}

Object.assign(window.JP, { HostDashboard });
