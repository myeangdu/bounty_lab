const presets={assignment:{method:'PATCH',path:'/api/profile',body:{displayName:'지민'}},traversal:{method:'GET',path:'/api/files?path=welcome.txt',body:{}},negativeTransfer:{method:'POST',path:'/api/credits/transfer',body:{recipient:'seoyeon',amount:25}}};
let labState;
function resetLab(){labState={profile:{displayName:'지민',plan:'free'},credits:100};}
resetLab();
function simulateRequest(method,path,raw){
let body;try{body=JSON.parse(raw||'{}');if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}catch{return{status:400,error:'본문에는 JSON 객체를 입력해 주세요.'};}
if(path==='/api/profile'&&method==='PATCH'){
if(typeof body.displayName!=='string'||!body.displayName.trim())return{status:422,error:'displayName 문자열이 필요합니다.'};
labState.profile.displayName=body.displayName;
if(Object.hasOwn(body,'plan'))labState.profile.plan=body.plan;
return{status:200,profile:labState.profile,...(labState.profile.plan==='pro'?{flag:challenges.assignment.flag}:{notice:'프로필이 저장되었습니다. 내보내기는 pro 요금제에서 제공됩니다.'})};
}
if(path.startsWith('/api/files?')&&method==='GET'){
const rawPath=path.slice(path.indexOf('?')+1).split('&').find(v=>v.startsWith('path='))?.slice(5);
if(!rawPath)return{status:400,error:'path가 필요합니다.'};
if(rawPath.includes('..'))return{status:403,error:'경로 필터: 상위 디렉터리 이동은 허용되지 않습니다.'};
let decoded;try{decoded=decodeURIComponent(rawPath);}catch{return{status:400,error:'잘못된 URL 인코딩입니다.'};}
const segments=['attachments'];for(const part of decoded.split('/')){if(part==='..')segments.pop();else if(part&&part!=='.')segments.push(part);}
const resolved=segments.join('/');
if(resolved==='attachments/welcome.txt')return{status:200,file:'welcome.txt',content:'첨부 파일은 /attachments/에 저장됩니다. 마이그레이션 메모: 이전 백업은 /private/backup.json 으로 이동했습니다.'};
if(resolved==='private/backup.json')return{status:200,file:resolved,content:{owner:'internal',flag:challenges.traversal.flag}};
return{status:404,error:'파일을 찾을 수 없습니다.',resolved};
}
if(path==='/api/credits/transfer'&&method==='POST'){
if(body.recipient!=='seoyeon'||!Number.isSafeInteger(body.amount))return{status:422,error:'유효한 recipient와 정수 amount가 필요합니다.'};
if(body.amount>labState.credits)return{status:409,error:'보유 크레딧이 부족합니다.',credits:labState.credits};
labState.credits-=body.amount;
return{status:200,recipient:body.recipient,amount:body.amount,credits:labState.credits,...(body.amount<0?{flag:challenges.negativeTransfer.flag,notice:'이체 처리 후 크레딧이 증가했습니다.'}:{notice:'크레딧 이체가 완료되었습니다.'})};
}
return{status:404,error:'경로 또는 메서드를 확인해 주세요.'};
}
function loadPreset(){const p=presets[$('advanced-preset').value];$('advanced-method').value=p.method;$('advanced-path').value=p.path;$('advanced-body').value=JSON.stringify(p.body,null,2);$('advanced-response').textContent='요청을 선택했습니다.';}
$('advanced-preset').onchange=loadPreset;
$('advanced-form').onsubmit=e=>{e.preventDefault();const result=simulateRequest($('advanced-method').value,$('advanced-path').value.trim(),$('advanced-body').value);$('advanced-response').textContent=JSON.stringify(result,null,2);};
$('advanced-reset').onclick=()=>{resetLab();loadPreset();$('advanced-response').textContent='실습 세션을 초기화했습니다. 제보 내역과 가상 보상은 유지됩니다.'};
const advancedHints={assignment:['이름 변경 응답에 어떤 속성이 함께 내려오나요?','서버가 허용하지 않은 필드까지 저장하는지 확인해 보세요.','프로필 요청에 "plan": "pro" 속성을 추가해 보세요.'],traversal:['welcome.txt 응답에서 백업 파일의 위치를 확인해 보세요.','../ 경로가 막힌다면 URL 디코딩 전후의 검사 순서를 생각해 보세요.','path=%2e%2e%2fprivate%2fbackup.json 으로 요청해 보세요.'],negativeTransfer:['정상 이체 요청의 amount와 잔액 변화를 비교해 보세요.','서버가 잔액 부족만 확인하고 금액이 양수인지는 확인하지 않는다면?','POST /api/credits/transfer 본문의 amount를 -50으로 바꿔 보내세요.']};
document.querySelectorAll('[data-advanced]').forEach(button=>{let level=0;button.onclick=()=>{const id=button.dataset.advanced;if(!practiceHint(id+':'+(level+1)))return;const target=$('advanced-hint-'+id);target.hidden=false;target.textContent=advancedHints[id][level];level=Math.min(level+1,2);button.textContent=level===2?'마지막 힌트 보기':'힌트 '+(level+1)+' / 3';};});
loadPreset();update();
