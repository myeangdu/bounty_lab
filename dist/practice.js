const practiceKey = 'bounty-lab-practice-v2:' + activeLab.id;
const hintKeys = activeTypes.flatMap(type =>
  Array.from({length: ['config', 'idor', 'role'].includes(type) ? 1 : 3}, (_, i) => type + ':' + (i + 1)));
let practice = {mode: 'learning', elapsedMs: 0, hints: []};
try {
  const saved = JSON.parse(localStorage.getItem(practiceKey));
  if (saved && ['learning', 'challenge'].includes(saved.mode) &&
      Number.isSafeInteger(saved.elapsedMs) && saved.elapsedMs >= 0 && Array.isArray(saved.hints)) {
    practice = {mode: saved.mode, elapsedMs: saved.elapsedMs,
      hints: [...new Set(saved.hints.filter(key => hintKeys.includes(key)))]};
  }
} catch {}
let practiceRunning = false;
let practiceLastTick = performance.now();
function savePractice() {
  try {
    localStorage.setItem(practiceKey, JSON.stringify(practice));
    $('practice-storage').hidden = true;
  } catch {
    $('practice-storage').hidden = false;
    $('practice-storage').textContent = '기록을 저장할 수 없습니다. 새로고침하면 이번 시간과 힌트 기록이 사라질 수 있습니다.';
  }
}
function tickPractice() {
  const now = performance.now();
  if (practiceRunning) practice.elapsedMs += Math.max(0, Math.floor(now - practiceLastTick));
  practiceLastTick = now;
}
function renderPractice() {
  const seconds = Math.floor(practice.elapsedMs / 1000);
  $('practice-time').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  $('practice-hints').textContent = practice.hints.length;
  const complete = activeTypes.every(type => reports.some(r => r.type === type));
  $('practice-toggle').disabled = complete;
  $('practice-toggle').textContent = complete ? '실습 완료' : practiceRunning ? '일시정지' : practice.elapsedMs ? '이어서 시작' : '실습 시작';
}
function applyPracticeMode() {
  const challenge = practice.mode === 'challenge';
  $('practice-mode').value = practice.mode;
  $('mode-description').textContent = challenge ? '힌트 없이 취약점을 찾아보세요. 이전에 사용한 힌트는 기록에 남습니다.' : '단계별 힌트를 보며 취약점을 이해해 보세요.';
  document.querySelectorAll('[data-hint], [data-advanced], [data-practice-hint]').forEach(el => {
    el.hidden = challenge;
    if (el.matches('details')) el.open = false;
  });
  document.querySelectorAll('.hint-content, [id^="advanced-hint-"]').forEach(el => { el.hidden = true; });
  document.querySelectorAll('[data-hint]').forEach(el => { el.textContent = '힌트 보기 +'; });
}
function practiceHint(key) {
  if (practice.mode === 'challenge') return false;
  if (hintKeys.includes(key) && !practice.hints.includes(key)) {
    practice.hints.push(key);
    savePractice();
    renderPractice();
  }
  return true;
}
function practiceSnapshot() {
  tickPractice();
  savePractice();
  return {lab: activeLab.id, mode: practice.mode, elapsedMs: practice.elapsedMs, hints: practice.hints.length};
}
function finishPractice() {
  if (activeTypes.every(type => reports.some(r => r.type === type))) practiceRunning = false;
  renderPractice();
}
$('practice-mode').onchange = () => {
  practice.mode = $('practice-mode').value;
  tickPractice();
  applyPracticeMode();
  savePractice();
  renderPractice();
};
$('practice-toggle').onclick = () => {
  tickPractice();
  practiceRunning = !practiceRunning;
  savePractice();
  renderPractice();
};
document.querySelectorAll('[data-practice-hint]').forEach(el => {
  el.addEventListener('toggle', () => {
    if (el.open && !practiceHint(el.dataset.practiceHint)) el.open = false;
  });
});
document.addEventListener('visibilitychange', () => {
  tickPractice();
  if (document.hidden) practiceRunning = false;
  savePractice();
  renderPractice();
});
window.addEventListener('pagehide', () => { tickPractice(); savePractice(); });
setInterval(() => {
  if (!practiceRunning) return;
  tickPractice();
  savePractice();
  renderPractice();
}, 1000);
applyPracticeMode();
renderPractice();
