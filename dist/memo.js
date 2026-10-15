const memoDefaults = {
  '1001': {owner:'지민',title:'이번 주 할 일',body:'월요일: 팀 미팅과 프로젝트 일정 정리\n수요일: 새 서비스 레퍼런스 모으기\n금요일: 이번 주 읽은 책 기록하기',date:'2026.10.08'},
  '1002': {owner:'지민',title:'떠오른 아이디어',body:'작은 아이디어를 놓치지 않도록.\n\n기록을 모으고, 서로 연결하고, 필요한 순간 다시 찾아볼 수 있는 서비스를 만들고 싶다.',date:'2026.10.07'},
  '1003': {owner:'서연',title:'파트너 미팅 · 내부 검토',body:'다음 분기 출시 일정은 확정 전까지 내부에서만 공유합니다.\n\n검토 문서 참조 코드\n'+challenges.idor.flag,date:'2026.10.06'}
};
let memoNotes = structuredClone(memoDefaults);
try {
  const saved=JSON.parse(sessionStorage.getItem('memo-service-notes')||'{}');
  for(const [id,note] of Object.entries(saved)) if(/^\d+$/.test(id)&&id!=='1003'&&note?.owner==='지민'&&typeof note.title==='string'&&typeof note.body==='string'&&typeof note.date==='string') memoNotes[id]=note;
} catch {}
let memoSessionRole='user';
$('session-body').value=JSON.stringify({role:memoSessionRole},null,2);
function lookup(){
  const path=$('request-path').value.trim();
  if(path==='/debug/config'){
    showResult('note-result','200 OK\n'+JSON.stringify({environment:'development',debug:true,version:'0.9.2',internal_flag:challenges.config.flag},null,2),true);
    return;
  }
  const match=/^\/api\/notes\/(\d+)$/.exec(path);
  if(!match){showResult('note-result','404 Not Found');return;}
  const id=match[1],note=Object.hasOwn(memoNotes,id)?memoNotes[id]:null;
  showResult('note-result',note?'200 OK\n'+JSON.stringify(note,null,2):'404 Not Found',id==='1003');
  if(note&&typeof openMemo==='function') openMemo(id,false);
}
$('request-form').onsubmit=e=>{e.preventDefault();lookup()};
$('session-form').onsubmit=e=>{
  e.preventDefault();
  let request;
  try{request=JSON.parse($('session-body').value);}catch{showResult('session-result','400 Bad Request · JSON 본문을 확인하세요.');return;}
  if(!request||Array.isArray(request)||typeof request!=='object'||typeof request.role!=='string'){
    showResult('session-result','400 Bad Request · role 문자열이 필요합니다.');return;
  }
  memoSessionRole=request.role;
  const admin=memoSessionRole==='admin';
  const response={workspace:'Memo',members:12,role:memoSessionRole};
  if(admin)response.auditKey=challenges.role.flag;
  showResult('session-result','200 OK\n'+JSON.stringify(response,null,2),admin);
  if(typeof openMemoAdmin==='function'&&(admin||!$('memo-admin').hidden)) openMemoAdmin(false);
};
document.querySelectorAll('[data-hint]').forEach(el=>el.onclick=()=>{const hint=$('hint-'+el.dataset.hint);if(hint.hidden&&!practiceHint(el.dataset.hint+':1'))return;hint.hidden=!hint.hidden;el.textContent=hint.hidden?'힌트 보기 +':'힌트 닫기 −'});
