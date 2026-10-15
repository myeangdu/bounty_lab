// Product screens call the same simulated service logic as the request console.
$('open-lab-tools').onclick = () => $('lab-tools').showModal();
$('close-lab-tools').onclick = () => $('lab-tools').close();
function productMessage(text) { if($('product-message')) $('product-message').textContent=text; }
function routeMemo(params) {
  const url=new URL(location.href);url.search='';
  for(const[key,value]of Object.entries(params))url.searchParams.set(key,value);
  history.pushState(null,'',url); 
}
function openMemo(id, changeUrl=true) {
  const note=Object.hasOwn(memoNotes,id)?memoNotes[id]:null;
  if(changeUrl)routeMemo({note:id});
  $('memo-admin').hidden=true;$('memo-debug').hidden=true;
  if(!note){$('editor').hidden=true;productMessage('이 메모를 찾을 수 없습니다.');return;}
  $('editor').hidden=false;$('editor').dataset.note=id;
  $('editor-title').value=note.title;$('editor-body').value=note.body;
  $('editor-owner').textContent=note.owner+' · 개인 메모';
  $('editor-meta').textContent=note.date+' · 메모 #'+id;
  const readonly=note.owner!=='지민';$('editor-title').readOnly=readonly;$('editor-body').readOnly=readonly;$('save-note-button').hidden=readonly;
  $('request-path').value='/api/notes/'+id;productMessage('');
}
function renderMemoList() {
  const query=$('search-notes').value.trim().toLowerCase();
  const mine=Object.entries(memoNotes).filter(([,note])=>note.owner==='지민');
  const filtered=mine.filter(([,note])=>(note.title+' '+note.body).toLowerCase().includes(query));
  $('my-note-count').textContent=mine.length;
  $('search-empty').hidden=filtered.length>0;
  $('note-list').replaceChildren(...filtered.map(([id,note])=>{
    const card=document.createElement('button');card.className='product-note';card.type='button';
    const tag=document.createElement('span');tag.className='note-category';tag.textContent='PERSONAL';
    const title=document.createElement('h2');title.textContent=note.title;
    const preview=document.createElement('p');preview.textContent=note.body.slice(0,110);
    const bottom=document.createElement('small');bottom.textContent=note.date+' · 지민';
    card.append(tag,title,preview,bottom);card.onclick=()=>openMemo(id);return card;
  }));
}
function openMemoAdmin(changeUrl=true) {
  if(changeUrl)routeMemo({page:'admin'});
  $('editor').hidden=true;$('memo-debug').hidden=true;$('memo-admin').hidden=false;
  const admin=memoSessionRole==='admin';
  $('admin-status').textContent=admin?'워크스페이스의 관리자입니다.':'이 페이지에 접근할 권한이 없습니다. 워크스페이스 관리자에게 문의하세요.';
  $('admin-data').textContent=admin?'활성 멤버 12명 · 상태 정상\n감사 로그 인증키\n'+challenges.role.flag:'';
}
function readMemoRoute(){const params=new URLSearchParams(location.search);if(params.has('note'))openMemo(params.get('note'),false);else if(params.get('page')==='admin')openMemoAdmin(false);else{$('editor').hidden=true;$('memo-admin').hidden=true;$('memo-debug').hidden=true;}}
if(activeLab.id==='memo') {
  $('search-notes').oninput=renderMemoList;
  $('new-note').onclick=()=>{let id=String(Math.max(1003,...Object.keys(memoNotes).map(Number))+1);memoNotes[id]={owner:'지민',title:'제목 없는 메모',body:'',date:new Date().toLocaleDateString('ko-KR')};renderMemoList();openMemo(id);$('editor-title').focus();};
  $('save-note').onsubmit=e=>{e.preventDefault();const note=memoNotes[$('editor').dataset.note];if(!note||note.owner!=='지민')return;note.title=$('editor-title').value.trim();note.body=$('editor-body').value;if(!note.title)return;note.date=new Date().toLocaleDateString('ko-KR');renderMemoList();try{sessionStorage.setItem('memo-service-notes',JSON.stringify(memoNotes));productMessage('메모를 저장했습니다.');}catch{productMessage('이 화면에 저장했습니다. 새로고침하면 변경 사항이 사라질 수 있습니다.');}};
  $('close-note').onclick=()=>{$('editor').hidden=true;routeMemo({});};
  window.addEventListener('popstate',readMemoRoute);renderMemoList();readMemoRoute();
}
function refreshAccount() {
  $('account-sidebar-name').textContent=labState.profile.displayName;
  $('profile-name').value=labState.profile.displayName;
  $('plan-title').textContent=labState.profile.plan==='pro'?'Pro':'Free';
  $('account-plan-badge').textContent=labState.profile.plan==='pro'?'PRO MEMBER':'FREE MEMBER';
  $('account-credits').textContent=labState.credits;
}
function serviceRequest(method,path,body) {
  const raw=typeof body==='string'?body:JSON.stringify(body);
  const result=simulateRequest(method,path,raw);
  $('advanced-method').value=method;$('advanced-path').value=path;$('advanced-body').value=raw;
  $('advanced-response').textContent=JSON.stringify(result,null,2);refreshAccount();return result;
}
function showFile(result,download=false) {
  $('file-preview').hidden=false;
  const content=typeof result.content==='string'?result.content:JSON.stringify(result.content,null,2);
  $('file-preview').textContent=result.status===200?content:result.error;
  if(result.status===200&&download){const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=result.file.split('/').pop();link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
if(activeLab.id==='requests') {
  $('profile-save').onsubmit=e=>{e.preventDefault();const r=serviceRequest('PATCH','/api/profile',{displayName:$('profile-name').value});$('profile-feedback').textContent=r.status===200?'프로필을 저장했습니다.':r.error;};
  $('export-data').onclick=()=>{$('export-result').textContent=labState.profile.plan==='pro'?'내보내기 인증키: '+challenges.assignment.flag:'전체 내보내기는 Pro 요금제에서 사용할 수 있습니다.';};
  $('download-welcome').onclick=()=>showFile(serviceRequest('GET','/api/files?path=welcome.txt',{}),true);
  $('coupon-form').onsubmit=e=>{e.preventDefault();const r=serviceRequest('POST','/api/coupons/redeem',{code:$('coupon-code').value.trim(),requestId:'welcome-001'});$('coupon-feedback').textContent=r.status===200?r.notice+(r.flag?'\n거래 참조: '+r.flag:''):r.error;};
  $('advanced-form').onsubmit=e=>{e.preventDefault();const r=serviceRequest($('advanced-method').value,$('advanced-path').value.trim(),$('advanced-body').value);if(r.file)showFile(r);};
  const originalReset=$('advanced-reset').onclick;$('advanced-reset').onclick=()=>{originalReset();refreshAccount();for(const id of ['profile-feedback','export-result','coupon-feedback','file-preview'])$(id).textContent='';$('file-preview').hidden=true;};
  refreshAccount();const file=location.search.match(/(?:\?|&)file=([^&]*)/);if(file)showFile(serviceRequest('GET','/api/files?path='+file[1],{}));
}
let authView='account';
function switchAuth(view) {
  authView=view;$('auth-account-view').hidden=view!=='account';$('auth-legacy-view').hidden=view!=='legacy';$('signed-in').hidden=true;
  $('choose-account').classList.toggle('selected',view==='account');$('choose-legacy').classList.toggle('selected',view==='legacy');
}
function renderAuthSession(result,kind) {
  const output=$(kind==='legacy'?'sql-result':'reset-result');output.textContent=result.ok?'':result.message;
  if(!result.ok)return;
  $('auth-account-view').hidden=true;$('auth-legacy-view').hidden=true;$('signed-in').hidden=false;
  const admin=result.user==='admin';$('signed-avatar').textContent=admin?'A':'J';$('signed-title').textContent=admin?'관리자 콘솔':'지민님, 환영합니다.';
  $('signed-description').textContent=admin?'워크스페이스의 멤버 및 시스템 설정을 관리합니다.':'내 워크스페이스가 준비되었습니다. 오늘의 기록을 시작하세요.';
  $('signed-role').textContent=admin?'admin · Administrator':'jimin · Member';$('signed-secret').hidden=!admin;
  $('signed-secret').textContent=admin?'관리자 전용 감사 키\n'+(kind==='legacy'?challenges.loginSql.flag:challenges.loginReset.flag):'';
}
if(activeLab.id==='auth') {
  $('choose-account').onclick=()=>switchAuth('account');$('choose-legacy').onclick=()=>switchAuth('legacy');
  $('sql-login').onsubmit=e=>{e.preventDefault();renderAuthSession(legacyLogin($('sql-user').value.trim(),$('sql-pass').value),'legacy');};
  $('reset-login').onsubmit=e=>{e.preventDefault();renderAuthSession(accountLogin($('reset-user').value.trim(),$('reset-pass').value),'account');};
  $('logout').onclick=()=>{for(const id of ['sql-pass','reset-pass','sql-result','reset-result','signed-secret']){if('value' in $(id))$(id).value='';$(id).textContent='';}switchAuth(authView);};
  const reset=$('auth-reset').onclick;$('auth-reset').onclick=()=>{reset();$('signed-secret').textContent='';switchAuth('account');};
}

$('report-link').onclick = () => { tickPractice(); practiceRunning = false; savePractice(); renderPractice(); };
