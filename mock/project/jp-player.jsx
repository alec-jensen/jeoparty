// jp-player.jsx — Player phone screens. Individuals + team variants.
// Three states each: Join → Buzzer (ready) → Buzzed (you're up).

const { J, display, ui, TEAMS, dollars,
        btnBase, Label, PhoneShell } = window.JP;

// ============================================================
// PLAYER · INDIVIDUAL · JOIN
// ============================================================
function PlayerJoin() {
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '60px 28px 32px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 0%, ${J.bg3} 0%, ${J.bg} 70%)`,
      }}>
        <div style={{
          fontFamily: display, fontSize: 56, color: J.gold,
          letterSpacing: '0.02em', lineHeight: 1, textAlign: 'center',
        }}>JEOPARTY</div>
        <div style={{
          fontSize: 12, color: J.dim, letterSpacing: '0.22em',
          textAlign: 'center', marginTop: 6,
        }}>PARTY · TRIVIA · CHAOS</div>

        <div style={{ marginTop: 56 }} data-comment-anchor="e209f18f26-div-527-9">
          <Label>ROOM CODE</Label>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {['4', 'Q', '7', 'P'].map((c, i) => (
              <div key={i} style={{
                flex: 1, aspectRatio: '0.85',
                background: J.bg2,
                border: `2px solid ${J.gold}`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: display, fontSize: 56,
                color: J.ink,
              }}>{c}</div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <Label>YOUR NAME</Label>
          <div style={{
            marginTop: 12,
            background: J.bg2, border: `2px solid ${J.line}`,
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, background: J.magenta,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#0E0B22', fontWeight: 800,
            }}>✦</span>
            <span style={{
              fontFamily: display, fontSize: 26, letterSpacing: '0.04em',
              color: J.ink, flex: 1,
            }}>PRIYA</span>
            <span style={{
              width: 8, height: 22, background: J.gold,
              animation: 'jp-caret 1s steps(2) infinite',
            }}/>
          </div>
          <div style={{ fontSize: 11, color: J.dim, marginTop: 8, letterSpacing: '0.04em' }}>
            Tap your avatar to change color.
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <button style={{
          ...btnBase,
          background: J.gold, color: '#0E0B22',
          fontFamily: display, fontSize: 28, letterSpacing: '0.08em',
          padding: '22px 0',
          borderRadius: 999,
          boxShadow: `0 14px 0 #B88A1F, 0 22px 40px rgba(255,200,61,0.3)`,
        }}>JOIN GAME →</button>
        <div style={{
          marginTop: 18, textAlign: 'center',
          fontSize: 13, color: J.dim, letterSpacing: '0.04em',
        }}>
          Hosting tonight?{' '}
          <a href="#" style={{
            color: J.gold, textDecoration: 'underline',
            textUnderlineOffset: 3, fontWeight: 600,
          }}>Join as host →</a>
        </div>
      </div>
    </PhoneShell>
  );
}

// ============================================================
// PLAYER · INDIVIDUAL · BUZZER (ready)
// ============================================================
function PlayerBuzzer() {
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '52px 24px 28px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 100%, #2C0E1F 0%, ${J.bg} 60%)`,
      }}>
        <PlayerHeader rankLabel="RANK 1 / 6" scoreLabel="YOUR SCORE" scoreValue="$5,400"/>

        {/* Clue context */}
        <div style={{
          marginTop: 28, padding: '12px 16px',
          background: J.bg2, borderRadius: 12, border: `1px solid ${J.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: display, fontSize: 14, letterSpacing: '0.04em' }}>
            SCIENCE FRICTION
          </div>
          <div style={{ fontFamily: display, fontSize: 18, color: J.gold }}>$600</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div style={{ fontSize: 11, color: J.dim, letterSpacing: '0.3em' }}>
            BUZZ WHEN YOU KNOW IT
          </div>
          <div style={{
            marginTop: 8, fontFamily: display, fontSize: 22, color: J.ink, letterSpacing: '0.02em',
          }}>Listen to the clue…</div>
        </div>

        <BigBuzzer color={J.magenta}/>

        <ConnectedFooter dot={J.mint} text="Connected · 6 players in game" code="4Q7P"/>
      </div>
    </PhoneShell>
  );
}

// ============================================================
// PLAYER · INDIVIDUAL · BUZZED (you're up)
// ============================================================
function PlayerBuzzed() {
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '52px 24px 28px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 50%, ${J.magenta}40 0%, ${J.bg} 65%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <PlayerHeader rankLabel="RANK 1 / 6" scoreLabel="YOUR SCORE" scoreValue="$5,400"/>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }} data-comment-anchor="d4f58c508e-div-739-9">
          <div style={{
            fontFamily: display, fontSize: 116, color: J.gold,
            letterSpacing: '0.06em',
            textShadow: `0 0 40px ${J.gold}55`,
            transform: 'rotate(-2deg)',
            lineHeight: 0.9, textAlign: 'center',
          }}>YOU'RE<br/>UP!</div>
          <div style={{
            fontFamily: display, fontSize: 22, color: J.ink,
            letterSpacing: '0.02em',
            textAlign: 'center', maxWidth: 280, textWrap: 'balance',
            lineHeight: 1.2,
          }}>Say your answer out loud to the host.</div>
        </div>

        <ConnectedFooter
          dot={J.magenta} dotPulse
          text="Host is judging…"
        />
      </div>
    </PhoneShell>
  );
}

// ============================================================
// PLAYER · TEAM · JOIN
// ============================================================
function PlayerJoinTeam() {
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '56px 24px 24px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 0%, ${J.bg3} 0%, ${J.bg} 70%)`,
      }}>
        <div style={{
          fontFamily: display, fontSize: 48, color: J.gold,
          letterSpacing: '0.02em', lineHeight: 1, textAlign: 'center',
        }}>JEOPARTY</div>
        <div style={{
          fontSize: 12, color: J.dim, letterSpacing: '0.22em',
          textAlign: 'center', marginTop: 6,
        }}>TEAM MODE</div>

        <div style={{ marginTop: 28 }}>
          <Label>ROOM CODE</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {['4', 'Q', '7', 'P'].map((c, i) => (
              <div key={i} style={{
                flex: 1, aspectRatio: '0.85',
                background: J.bg2, border: `2px solid ${J.gold}`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: display, fontSize: 40,
                color: J.ink,
              }}>{c}</div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Label>YOUR NAME</Label>
          <div style={{
            marginTop: 10,
            background: J.bg2, border: `2px solid ${J.line}`,
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 7, background: J.magenta,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#0E0B22', fontWeight: 800,
            }}>✦</span>
            <span style={{
              fontFamily: display, fontSize: 22, letterSpacing: '0.04em',
              color: J.ink, flex: 1,
            }}>PRIYA</span>
            <span style={{
              width: 6, height: 18, background: J.gold,
              animation: 'jp-caret 1s steps(2) infinite',
            }}/>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Label>PICK YOUR TEAM</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {TEAMS.map(t => {
              const selected = t.name === 'ENCYCLOPEDIA';
              return (
                <div key={t.name} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: selected ? J.bg2 : '#120D2E',
                  border: `2px solid ${selected ? t.color : J.line}`,
                  boxShadow: selected ? `0 0 20px ${t.color}40` : 'none',
                }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 10, background: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#0E0B22', fontWeight: 800,
                  }}>{t.glyph}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: display, fontSize: 20, letterSpacing: '0.04em',
                      lineHeight: 1, color: J.ink,
                    }}>{t.name}</div>
                    <div style={{
                      fontSize: 11, color: J.dim, marginTop: 4, letterSpacing: '0.06em',
                    }}>
                      {t.members.length} {t.members.length === 1 ? 'PLAYER' : 'PLAYERS'} ·
                      {' '}{t.members.map(m => m.name.toLowerCase()).join(', ')}
                    </div>
                  </div>
                  <span style={{
                    width: 18, height: 18, borderRadius: 999,
                    border: `2px solid ${selected ? t.color : J.line2}`,
                    background: selected ? t.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#0E0B22', fontWeight: 800,
                  }}>{selected ? '✓' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <button style={{
          ...btnBase,
          background: J.gold, color: '#0E0B22',
          fontFamily: display, fontSize: 24, letterSpacing: '0.08em',
          padding: '18px 0',
          borderRadius: 999,
          boxShadow: `0 12px 0 #B88A1F, 0 18px 36px rgba(255,200,61,0.3)`,
        }}>JOIN TEAM ENCYCLOPEDIA →</button>
        <div style={{
          marginTop: 14, textAlign: 'center',
          fontSize: 12, color: J.dim,
        }}>
          Hosting tonight?{' '}
          <a href="#" style={{
            color: J.gold, textDecoration: 'underline',
            textUnderlineOffset: 3, fontWeight: 600,
          }}>Join as host →</a>
        </div>
      </div>
    </PhoneShell>
  );
}

// ============================================================
// PLAYER · TEAM · BUZZER (ready)
// ============================================================
function PlayerBuzzerTeam() {
  const team = TEAMS.find(t => t.name === 'ENCYCLOPEDIA');
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '52px 24px 28px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 100%, ${team.color}25 0%, ${J.bg} 60%)`,
      }}>
        <PlayerHeader
          rankLabel={`TEAM ${team.name}`}
          rankAccent={team.color}
          scoreLabel="TEAM SCORE"
          scoreValue={dollars(team.score)}
          mePill="You: $5,400"
        />

        <div style={{
          marginTop: 24, padding: '12px 16px',
          background: J.bg2, borderRadius: 12, border: `1px solid ${J.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: display, fontSize: 14, letterSpacing: '0.04em' }}>
            SCIENCE FRICTION
          </div>
          <div style={{ fontFamily: display, fontSize: 18, color: J.gold }}>$600</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div style={{ fontSize: 11, color: J.dim, letterSpacing: '0.3em' }}>
            FIRST BUZZ FOR YOUR TEAM
          </div>
          <div style={{
            marginTop: 8, fontFamily: display, fontSize: 22, color: J.ink,
            letterSpacing: '0.02em',
          }}>Listen to the clue…</div>
        </div>

        <BigBuzzer color={team.color}/>

        {/* Teammate status */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 10,
        }}>
          {team.members.map(m => (
            <div key={m.name} style={{
              flex: 1, padding: '8px 10px',
              background: J.bg2, borderRadius: 10,
              border: `1px solid ${J.line}`,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#0E0B22', fontWeight: 700,
              }}>{m.avatar}</span>
              <span style={{
                fontFamily: display, fontSize: 13, letterSpacing: '0.04em',
                color: m.name === 'PRIYA' ? J.ink : J.dim,
              }}>{m.name}{m.name === 'PRIYA' && ' · YOU'}</span>
            </div>
          ))}
        </div>

        <ConnectedFooter dot={team.color} text={`Team ${team.name} · 2 connected`} code="4Q7P"/>
      </div>
    </PhoneShell>
  );
}

// ============================================================
// PLAYER · TEAM · BUZZED (your team's up)
// ============================================================
function PlayerBuzzedTeam() {
  const team = TEAMS.find(t => t.name === 'ENCYCLOPEDIA');
  return (
    <PhoneShell>
      <div style={{
        flex: 1, padding: '52px 24px 28px',
        display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 50% 50%, ${team.color}45 0%, ${J.bg} 65%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <PlayerHeader
          rankLabel={`TEAM ${team.name}`}
          rankAccent={team.color}
          scoreLabel="TEAM SCORE"
          scoreValue={dollars(team.score)}
        />

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 18,
        }}>
          <div style={{
            fontSize: 12, color: J.dim, letterSpacing: '0.28em',
          }}>YOUR TEAM IS UP</div>
          <div style={{
            fontFamily: display, fontSize: 100, color: team.color,
            letterSpacing: '0.04em',
            textShadow: `0 0 40px ${team.color}55`,
            transform: 'rotate(-2deg)',
            lineHeight: 0.9, textAlign: 'center',
          }}>YOU'RE<br/>UP!</div>
          <div style={{
            fontFamily: display, fontSize: 22, color: J.ink,
            letterSpacing: '0.02em',
            textAlign: 'center', maxWidth: 300, textWrap: 'balance',
            lineHeight: 1.2,
          }}>Huddle up — one of you says it out loud.</div>

          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: J.bg2, borderRadius: 12, border: `1px solid ${team.color}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 5, background: J.magenta,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#0E0B22', fontWeight: 700,
            }}>✦</span>
            <span style={{ fontSize: 13, color: J.ink }}>
              <strong style={{ fontFamily: display, letterSpacing: '0.04em' }}>PRIYA</strong>{' '}
              <span style={{ color: J.dim }}>was first to buzz</span>
            </span>
          </div>
        </div>

        <ConnectedFooter
          dot={team.color} dotPulse
          text="Host is judging…"
        />
      </div>
    </PhoneShell>
  );
}

// ============================================================
// SHARED PIECES
// ============================================================

function PlayerHeader({ rankLabel, rankAccent, scoreLabel, scoreValue, mePill }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8, background: J.magenta,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: '#0E0B22', fontWeight: 800,
        }}>✦</span>
        <div>
          <div style={{ fontFamily: display, fontSize: 18, letterSpacing: '0.04em' }}>PRIYA</div>
          <div style={{
            fontSize: 10, color: rankAccent || J.dim, letterSpacing: '0.18em',
          }}>{rankLabel}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: J.dim, letterSpacing: '0.18em' }}>{scoreLabel}</div>
        <div style={{
          fontFamily: display, fontSize: 28,
          color: scoreValue.startsWith('-') ? J.red : J.gold, lineHeight: 1,
        }}>{scoreValue}</div>
        {mePill && (
          <div style={{ fontSize: 10, color: J.dim, marginTop: 4, letterSpacing: '0.04em' }}>
            {mePill}
          </div>
        )}
      </div>
    </div>
  );
}

function BigBuzzer({ color }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 240 + i * 50, height: 240 + i * 50,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0.18 - i * 0.05,
          animation: `jp-ring 2.4s ease-out ${i * 0.4}s infinite`,
        }}/>
      ))}
      <button style={{
        width: 240, height: 240, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${color}cc 0%, ${color} 45%, ${darken(color)} 100%)`,
        border: 'none', cursor: 'pointer',
        boxShadow: `0 18px 0 ${darken(color, 0.55)}, 0 30px 80px ${color}73,
                    inset 0 -8px 24px rgba(0,0,0,0.25),
                    inset 0 8px 24px rgba(255,255,255,0.2)`,
        fontFamily: display, fontSize: 56, color: '#0E0B22',
        letterSpacing: '0.08em',
        textShadow: '0 2px 0 rgba(255,255,255,0.15)',
      }}>BUZZ</button>
    </div>
  );
}

// Quick darken using simple hex math — good enough for shadow bases.
function darken(hex, amt = 0.7) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  const f = v => Math.round(v * amt).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

function ConnectedFooter({ dot, dotPulse, text, code }) {
  return (
    <div style={{
      display: 'flex', gap: 8,
      background: J.bg2, borderRadius: 12,
      padding: '12px 14px', alignItems: 'center',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: dot,
        animation: dotPulse ? 'jp-pulse 1.2s ease-in-out infinite' : 'none',
      }}/>
      <span style={{ fontSize: 12, color: J.ink, letterSpacing: '0.06em' }}>{text}</span>
      {code && (
        <span style={{
          marginLeft: 'auto', fontSize: 10, color: J.dim, letterSpacing: '0.18em',
        }}>{code}</span>
      )}
    </div>
  );
}

Object.assign(window.JP, {
  PlayerJoin, PlayerBuzzer, PlayerBuzzed,
  PlayerJoinTeam, PlayerBuzzerTeam, PlayerBuzzedTeam,
});
