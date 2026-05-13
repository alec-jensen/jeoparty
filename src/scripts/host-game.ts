// @ts-nocheck
import QRCode from 'qrcode';

const gameId = document.body.dataset.gameId as string;
const hostToken = document.body.dataset.hostToken as string;
const seed = JSON.parse((document.getElementById('host-seed') as HTMLScriptElement).textContent || '{}');
const board = seed.board;
const usedSet = new Set(seed.usedQuestionIds);
const players = new Map(seed.initialPlayers);
let openQuestion = null;
let finalResults: any[] = [];

const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?gameId=${encodeURIComponent(gameId)}&token=${encodeURIComponent(hostToken)}`;
const ws = new WebSocket(wsUrl);
ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'PING' })));

function renderBoard() {
  const boardEl = document.getElementById('board')!;
  boardEl.innerHTML = '';
  for (const category of board.categories) {
    const title = document.createElement('div');
    title.className = 'card';
    title.textContent = category.title;
    boardEl.appendChild(title);
    category.questions.sort((a, b) => a.value - b.value).forEach((q) => {
      const btn = document.createElement('button');
      btn.className = `question-cell ${usedSet.has(q.id) ? 'used secondary' : ''}`;
      btn.textContent = `$${q.value}${q.is_daily_double ? ' ★' : ''}`;
      btn.disabled = usedSet.has(q.id);
      btn.addEventListener('click', () => {
        ws.send(JSON.stringify({ type: 'OPEN_QUESTION', questionId: q.id }));
        openQuestion = q;
        (document.getElementById('questionText')!).textContent = q.question;
        (document.getElementById('answerText')!).textContent = q.answer;
        document.getElementById('answerText')!.classList.add('hidden');
      });
      boardEl.appendChild(btn);
    });
  }
}

function renderPlayers() {
  const list = document.getElementById('players')!;
  const select = document.getElementById('scorePlayer')! as HTMLSelectElement;
  list.innerHTML = '';
  select.innerHTML = '';
  for (const [id, player] of players) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${player.displayName}</span><strong>${player.score}</strong>`;
    const kick = document.createElement('button');
    kick.textContent = 'Kick';
    kick.className = 'secondary';
    kick.addEventListener('click', () => ws.send(JSON.stringify({ type: 'KICK_PLAYER', playerId: id })));
    li.appendChild(kick);
    list.appendChild(li);

    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = player.displayName;
    select.appendChild(opt);
  }

  const judge = document.getElementById('judgeButtons')!;
  judge.innerHTML = '';
  for (const [id, player] of players) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '.4rem';
    row.innerHTML = `<span style="min-width:110px">${player.displayName}</span>`;
    const good = document.createElement('button');
    good.textContent = 'Correct';
    good.addEventListener('click', () => ws.send(JSON.stringify({ type: 'JUDGE', playerId: id, correct: true })));
    const bad = document.createElement('button');
    bad.textContent = 'Wrong';
    bad.className = 'secondary';
    bad.addEventListener('click', () => ws.send(JSON.stringify({ type: 'JUDGE', playerId: id, correct: false })));
    row.append(good, bad);
    judge.appendChild(row);
  }
}

function renderFinalList() {
  const list = document.getElementById('finalList')!;
  list.innerHTML = '';
  for (const result of finalResults) {
    const item = document.createElement('div');
    item.className = 'card';
    item.innerHTML = `<strong>${result.displayName}</strong><div>Wager: ${result.wager}</div><div>Answer: ${result.answer}</div>`;
    const good = document.createElement('button');
    good.textContent = 'Correct';
    good.addEventListener('click', () => ws.send(JSON.stringify({ type: 'JUDGE_FINAL', playerId: result.playerId, correct: true })));
    const bad = document.createElement('button');
    bad.className = 'secondary';
    bad.textContent = 'Wrong';
    bad.addEventListener('click', () => ws.send(JSON.stringify({ type: 'JUDGE_FINAL', playerId: result.playerId, correct: false })));
    item.append(good, bad);
    list.appendChild(item);
  }
}

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'PLAYER_JOINED') {
    players.set(msg.playerId, { id: msg.playerId, displayName: msg.displayName, score: 0 });
    renderPlayers();
  }
  if (msg.type === 'PLAYER_KICKED') {
    players.delete(msg.playerId);
    renderPlayers();
  }
  if (msg.type === 'SCORE_UPDATE' || msg.type === 'BOARD_STATE') {
    (msg.scores || []).forEach((s) => {
      const p = players.get(s.playerId);
      if (p) p.score = s.score;
    });
    (msg.usedQuestions || []).forEach((id) => usedSet.add(id));
    renderPlayers();
    renderBoard();
  }
  if (msg.type === 'QUESTION_OPEN') {
    (document.getElementById('questionText')!).textContent = msg.questionText;
    if (openQuestion) (document.getElementById('answerText')!).textContent = openQuestion.answer;
  }
  if (msg.type === 'FINAL_JEOPARDY_END' && Array.isArray(msg.results)) {
    finalResults = msg.results;
    renderFinalList();
  }
});

(document.getElementById('startGame')!).addEventListener('click', () => ws.send(JSON.stringify({ type: 'GAME_START' })));
(document.getElementById('startFinal')!).addEventListener('click', () => ws.send(JSON.stringify({ type: 'START_FINAL_JEOPARDY' })));
(document.getElementById('endGame')!).addEventListener('click', () => ws.send(JSON.stringify({ type: 'END_GAME' })));
(document.getElementById('toggleAnswer')!).addEventListener('click', () => document.getElementById('answerText')!.classList.toggle('hidden'));
(document.getElementById('applyScore')!).addEventListener('click', () => {
  ws.send(
    JSON.stringify({
      type: 'ADJUST_SCORE',
      playerId: (document.getElementById('scorePlayer') as HTMLSelectElement).value,
      score: Number((document.getElementById('scoreValue') as HTMLInputElement).value)
    })
  );
});

QRCode.toCanvas(document.getElementById('qr') as HTMLCanvasElement, `${location.origin}/game/${gameId}/play`, {
  color: { dark: '#ffca3a', light: '#1f103f' },
  width: 220
});

renderPlayers();
renderBoard();
