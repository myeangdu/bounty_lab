const challenges={config:{title:'민감한 설정 정보 노출',flag:'FLAG{debug_left_open}',reward:50000,lesson:'개발용 설정은 운영 환경에서 비활성화하고, 비밀 값은 서버에서만 관리해야 합니다.'},idor:{title:'다른 사용자의 메모 열람',flag:'FLAG{check_the_owner}',reward:100000,lesson:'메모를 조회할 때마다 서버에서 현재 사용자와 메모 소유자가 같은지 확인해야 합니다.'},role:{title:'관리자 권한 검증 누락',flag:'FLAG{never_trust_the_client}',reward:200000,lesson:'브라우저가 보낸 역할을 신뢰하지 말고 서버의 인증된 세션에서 권한을 확인해야 합니다.'}};
Object.assign(challenges,{
assignment:{title:'프로필 속성 대량 할당',flag:'FLAG{allowlist_every_field}',reward:250000,lesson:'수정 가능한 필드만 허용 목록으로 받아야 하며, 요금제와 권한은 별도로 검증해야 합니다.'},
traversal:{title:'인코딩된 파일 경로 우회',flag:'FLAG{normalize_before_validate}',reward:300000,lesson:'경로를 디코딩하고 정규화한 뒤 허용된 디렉터리 안에 있는지 검증해야 합니다.'},
replay:{title:'일회용 쿠폰 재전송',flag:'FLAG{once_means_once}',reward:350000,lesson:'쿠폰 사용 여부를 서버에서 원자적으로 기록하고, 같은 요청의 중복 처리를 막아야 합니다.'}
});
Object.assign(challenges,{
loginSql:{title:'관리자 로그인 · SQL 조건 우회',flag:'FLAG{parameterize_the_login}',reward:300000,lesson:'로그인 쿼리에 입력을 이어 붙이지 말고 매개변수화된 쿼리를 사용해야 합니다.'},
loginReset:{title:'관리자 로그인 · 재설정 대상 검증',flag:'FLAG{bind_reset_to_the_user}',reward:400000,lesson:'재설정 티켓은 발급받은 계정에 묶고, 서버에서 대상과 만료·사용 여부를 검증해야 합니다.'}
});
function isChallengeType(type) {
  return typeof type === 'string' && Object.hasOwn(challenges, type);
}
const $ = id => document.getElementById(id);
const money = value => value.toLocaleString('ko-KR');
const reportPrefix = 'bounty-lab-report-v2:';
let reports = [];
function validReport(record) {
  return record && isChallengeType(record.type) && typeof record.date === 'string';
}
function loadReports() {
  const byType = new Map();
  try {
    const legacy = JSON.parse(localStorage.getItem('bounty-lab-v1') || '[]');
    if (Array.isArray(legacy)) legacy.filter(validReport).forEach(r => byType.set(r.type, r));
  } catch {}
  {
    for (const type of Object.keys(challenges)) {
      try {
        const record = JSON.parse(localStorage.getItem(reportPrefix + type));
        if (validReport(record) && record.type === type) byType.set(type, record);
      } catch {}
    }
  }
  // Keep this window's successful reports if storage is unavailable.
  reports.filter(validReport).forEach(r => { if (!byType.has(r.type)) byType.set(r.type, r); });
  reports = [...byType.values()];
}
function setText(id, text) { if ($(id)) $(id).textContent = text; }
function update() {
  setText('balance', money(reports.reduce((sum, r) => sum + challenges[r.type].reward, 0)));
  setText('count', reports.length);
  if ($('progress')) $('progress').style.width = reports.length / Object.keys(challenges).length * 100 + '%';
  setText('progress-message', reports.length === 8 ? '모든 실습을 완료했어요!' : reports.length ? '좋은 발견이에요. 다음 실습에 도전해 보세요.' : '첫 번째 실습 환경을 열어보세요.');
  const visibleReports = reports.filter(r => activeTypes.includes(r.type));
  setText('history-count', visibleReports.length);
  setText('room-progress', visibleReports.length + ' / ' + activeTypes.length + ' 해결');
  document.querySelectorAll('[data-done]').forEach(el => {
    el.textContent = reports.some(r => r.type === el.dataset.done) ? '제보 완료 ✓' : '';
  });
  const history = $('history');
  if (history) {
    const entries = visibleReports.slice().reverse().map(r => {
      const item = document.createElement('div'); item.className = 'history-entry';
      const label = document.createElement('span'); label.className = 'approved'; label.textContent = '승인 완료';
      const title = document.createElement('strong'); title.textContent = challenges[r.type].title;
      const detail = document.createElement('div'); detail.className = 'between';
      const date = document.createElement('small'); date.textContent = r.date;
      const reward = document.createElement('span'); reward.textContent = '+ ₩' + money(challenges[r.type].reward);
      detail.append(date, reward); item.append(label, title, detail);
      const p = r.practice;
      if (p && ['learning', 'challenge'].includes(p.mode) && Number.isSafeInteger(p.elapsedMs) && p.elapsedMs >= 0 && Number.isSafeInteger(p.hints) && p.hints >= 0) {
        const stats = document.createElement('small');
        stats.textContent = (p.mode === 'challenge' ? '도전' : '학습') + ' 모드 · ' + (p.lab ? '이 실습 ' : '누적 ') + Math.floor(p.elapsedMs / 60000) + '분 ' + Math.floor(p.elapsedMs / 1000) % 60 + '초 · 힌트 ' + p.hints + '개';
        item.append(stats);
      }
      return item;
    });
    if (!entries.length) {
      const empty = document.createElement('p'); empty.className = 'empty-history';
      empty.textContent = activeLab ? '이 실습에서 발견한 플래그를 제보하면 여기에 기록됩니다.' : '발견한 플래그를 제출하면 여기에 기록됩니다.';
      entries.push(empty);
    }
    history.replaceChildren(...entries);
  }
  if (typeof renderCatalogue === 'function') renderCatalogue();
}
function tab(name) {
  if ($('lab-tools') && !$('lab-tools').open) $('lab-tools').showModal();
  for (const value of ['service', 'report']) {
    if (!$(value + '-panel')) continue;
    $(value + '-panel').hidden = value !== name;
    $(value + '-tab').classList.toggle('active', value === name);
    $(value + '-tab').setAttribute('aria-selected', String(value === name));
  }
}
$('service-tab').onclick = () => tab('service');
if ($('report-tab')) $('report-tab').onclick = () => tab('report');
function showResult(id, text, found = false) {
  $(id).textContent = text; $(id).classList.toggle('found', found);
}
function submitReport(type, flag, steps) {
  if (activeLab || !isChallengeType(type)) return {ok: false, message: '메인 페이지에서 취약점 유형을 선택해 주세요.'};
  if (typeof flag !== 'string' || flag.trim() !== challenges[type].flag) return {ok: false, message: '플래그와 취약점 유형이 일치하지 않아요.'};
  if (typeof steps !== 'string' || steps.trim().length < 10) return {ok: false, message: '재현 과정을 10자 이상 적어주세요.'};
  loadReports();
  if (reports.some(r => r.type === type)) return {ok: false, message: '이미 보상을 받은 취약점입니다.'};
  const record = {type, date: new Date().toLocaleDateString('ko-KR'), practice: reportPracticeSnapshot(type)};
  reports.push(record);
  let saved = true;
  try { localStorage.setItem(reportPrefix + type, JSON.stringify(record)); } catch { saved = false; }
  update();
  return {ok: true, message: '제보 승인! ₩' + money(challenges[type].reward) + ' 지급. ' + challenges[type].lesson + (saved ? '' : ' 저장할 수 없어 다른 창에 반영되지 않으며 새로고침 시 기록이 사라질 수 있습니다.')};
}
if ($('report-form')) $('report-form').onsubmit = e => {
  e.preventDefault();
  const result = submitReport($('report-type').value, $('flag').value, $('steps').value);
  $('report-feedback').textContent = result.message;
  $('report-feedback').style.color = result.ok ? '#5c7738' : '#b14c43';
  if (result.ok) { $('flag').value = ''; $('steps').value = ''; }
};
$('guide-open').onclick = () => $('guide').showModal();
$('guide-close').onclick = () => $('guide').close();
$('guide-start').onclick = () => $('guide').close();
$('guide').onclick = e => {
  if (e.target !== $('guide')) return;
  const box = $('guide').getBoundingClientRect();
  if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) $('guide').close();
};
function syncReports() {
  loadReports(); update();
  if (typeof finishPractice === 'function') finishPractice();
}
window.addEventListener('storage', e => {
  if (e.key === null || e.key === 'bounty-lab-v1' || e.key.startsWith(reportPrefix)) syncReports();
});
window.addEventListener('focus', syncReports);
loadReports(); update();
if (!activeLab && document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'submit_vulnerability_report', title: '취약점 제보 제출',
      description: '현재 실습에서 발견한 플래그와 재현 과정을 제출합니다.',
      inputSchema: {type: 'object', properties: {type: {type: 'string', enum: activeTypes}, flag: {type: 'string'}, steps: {type: 'string', minLength: 10}}, required: ['type', 'flag', 'steps'], additionalProperties: false},
      annotations: {readOnlyHint: false},
      execute(input) { const result = submitReport(input?.type, input?.flag, input?.steps); tab('report'); $('report-feedback').textContent = result.message; return result; }
    })).catch(() => {});
  } catch {}
}

function reportPracticeSnapshot(type) {
  const lab = labs.find(lab => lab.keys.includes(type));
  try {
    const saved = JSON.parse(localStorage.getItem('bounty-lab-practice-v2:' + lab.id));
    if (saved && ['learning','challenge'].includes(saved.mode) && Number.isSafeInteger(saved.elapsedMs) && saved.elapsedMs >= 0 && Array.isArray(saved.hints)) {
      const keys = lab.keys.flatMap(t => Array.from({length:['config','idor','role'].includes(t)?1:3}, (_,i)=>t+':'+(i+1)));
      return {lab:lab.id,mode:saved.mode,elapsedMs:saved.elapsedMs,hints:new Set(saved.hints.filter(k=>keys.includes(k))).size};
    }
  } catch {}
  return null;
}
