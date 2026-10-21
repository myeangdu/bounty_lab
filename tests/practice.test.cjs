const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function boot(page='memo',storage={},search='',session={}) {
  const html=fs.readFileSync('dist/'+page+'.html','utf8');
  const elements=[],ids=new Map(),listeners={},windowListeners={};let now=0,interval;
  function element(tag='div',attrs={}) {const e={tag,attrs,style:{},dataset:{},hidden:'hidden' in attrs,open:false,value:attrs.value||'',textContent:'',children:[],focus(){},click(){},scrollIntoView(){this.scrolled=true},showModal(){this.open=true},close(){this.open=false},className:attrs.class||'',classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v},matches(s){return s===this.tag},addEventListener(t,f){this[t]=f},querySelector(){return this.children[0]||(this.children[0]=element('span'))}};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))e.dataset[k.slice(5).replace(/-([a-z])/g,(_,a)=>a.toUpperCase())]=v;return e;}
  for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';const e=element(m[1],attrs);elements.push(e);if(attrs.id){assert(!ids.has(attrs.id),'duplicate id: '+attrs.id);ids.set(attrs.id,e);}}
  const matches=(e,s)=>{s=s.trim();if(s.startsWith('.'))return e.className.split(' ').includes(s.slice(1));const a=s.match(/^\[([^=\]^]+)(\^?=)?"?([^"\]]*)"?\]$/);if(a)return a[1] in e.attrs&&(!a[2]||(a[2]==='^='?e.attrs[a[1]].startsWith(a[3]):e.attrs[a[1]]===a[3]));return e.tag===s};
  const query=s=>elements.filter(e=>s.split(',').some(q=>matches(e,q)));
  const document={body:elements.find(e=>e.tag==='body'),hidden:false,getElementById:id=>ids.get(id)||null,querySelectorAll:query,querySelector:s=>query(s)[0]||null,createElement:element,addEventListener(t,f){listeners[t]=f}};
  if(ids.has('advanced-preset'))ids.get('advanced-preset').value='assignment';
  const location={href:'https://example.test/'+page+'.html'+search,search};
  const c=vm.createContext({structuredClone,URL,URLSearchParams,Blob,setTimeout(){},location,history:{pushState(_a,_b,url){location.href=String(url);location.search=new URL(url).search}},sessionStorage:{getItem:k=>session[k]??null,setItem(k,v){session[k]=v}},document,window:{addEventListener(t,f){windowListeners[t]=f},open(){return null}},localStorage:{getItem:k=>storage[k]??null,setItem(k,v){storage[k]=v}},performance:{now:()=>now},setInterval(fn){interval=fn}});
  for(const m of html.matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+m[1].split('?')[0],'utf8'),c,{filename:m[1]});
  return{html,get:id=>ids.get(id),query,document,listeners,windowListeners,storage,read:s=>vm.runInContext(s,c),advance(ms){now+=ms},tick(){interval()},mode(value){ids.get('practice-mode').value=value;ids.get('practice-mode').onchange()}};
}
test('catalogue and three rooms initialize using only their own actual DOM and scripts',()=>{
 const home=boot('index');assert.equal(home.query('[data-launch]').length,3);assert(!home.get('request-form'));assert(!home.get('advanced-form'));assert(!home.get('sql-login'));assert(home.get('report-form'));
 for(const[name,own,other]of [['memo','request-form','advanced-form'],['requests','advanced-form','sql-login'],['auth','sql-login','request-form']]){const a=boot(name);assert(a.get(own));assert(!a.get(other));assert(!a.get('report-form'));assert.equal(a.read('activeLab.id'),name);const launch=home.query('[data-launch="'+name+'"]')[0];assert.equal(launch.attrs.href.split('?')[0],name+'.html');assert.equal(launch.attrs.target,'_blank');assert.equal(launch.attrs.rel,'noopener');assert.equal(launch.onclick,undefined);}
});
test('all hint families are blocked in challenge mode and counted once in learning mode',()=>{
 const memo=boot('memo');memo.get('hint-config').hidden=true;memo.query('[data-hint]')[0].onclick();assert.equal(memo.read('practice.hints.length'),1);memo.mode('challenge');assert(memo.get('hint-config').hidden);assert(memo.query('[data-hint]')[0].hidden);assert.equal(memo.read("practiceHint('idor:1')"),false);memo.mode('learning');memo.read("practiceHint('config:1')");assert.equal(memo.read('practice.hints.length'),1);
 const api=boot('requests');api.mode('challenge');api.query('[data-advanced]')[0].onclick();assert.equal(api.get('advanced-hint-assignment').textContent,'');api.mode('learning');api.query('[data-advanced]')[0].onclick();assert.equal(api.read('practice.hints.length'),1);
 const auth=boot('auth');const hint=auth.query('[data-practice-hint]')[0];hint.open=true;hint.toggle();assert.equal(auth.read('practice.hints.length'),1);auth.mode('challenge');assert(hint.hidden);assert.equal(hint.open,false);
});
test('room timers and hint records persist independently and pause in the background',()=>{
 const storage={},a=boot('memo',storage),b=boot('auth',storage);a.get('practice-toggle').onclick();a.advance(65000);a.tick();a.read("practiceHint('config:1')");a.mode('challenge');a.document.hidden=true;a.listeners.visibilitychange();a.advance(90000);a.read('tickPractice()');assert.equal(a.read('practice.elapsedMs'),65000);
 b.get('practice-toggle').onclick();b.advance(12000);b.tick();const restored=boot('memo',storage);assert.equal(restored.get('practice-time').textContent,'01:05');assert.equal(restored.read('practiceRunning'),false);assert.equal(restored.read('practice.mode'),'challenge');assert.equal(restored.read('practice.hints.length'),1);assert.equal(boot('auth',storage).read('practice.elapsedMs'),12000);
});
test('main-page reporting saves room statistics and syncs completion back to services',()=>{
 const storage={},room=boot('memo',storage),home=boot('index',storage);
 room.get('practice-toggle').onclick();room.advance(10000);room.read("practiceHint('config:1')");room.get('report-link').onclick();
 assert.equal(room.read("submitReport('config',challenges.config.flag,'abcdefghijk').ok"),false);
 assert.equal(home.read("submitReport('config',challenges.config.flag,'abcdefghijk').ok"),true);
 assert.equal(home.read('reports[0].practice.elapsedMs'),10000);assert.equal(home.read('reports[0].practice.hints'),1);
 assert.equal(home.read("submitReport('config',challenges.config.flag,'abcdefghijk').ok"),false);
 assert.equal(home.read("submitReport('idor','wrong','abcdefghijk').ok"),false);
 home.read("['idor','role','loginSql'].forEach(t=>submitReport(t,challenges[t].flag,'abcdefghijk'))");
 room.windowListeners.storage({key:'bounty-lab-report-v2:role'});assert.equal(room.get('room-progress').textContent,'3 / 3 해결');assert(room.get('practice-toggle').disabled);
 const routed=boot('index',storage,'?report=auth');assert.equal(routed.get('report-panel').hidden,false);assert.equal(routed.get('report-type').value,'loginReset');
});
test('main reporting handles invalid saved practice and legacy data',()=>{
 const storage={'bounty-lab-v1':JSON.stringify([{type:'config',date:'x'},{type:'toString',date:'x'}]),'bounty-lab-practice-v2:memo':'broken'};
 const home=boot('index',storage);assert.equal(home.read('reports.length'),1);assert.equal(home.read("submitReport('idor',challenges.idor.flag,'abcdefghijk').ok"),true);assert.equal(home.read('reports[1].practice'),null);
 storage['bounty-lab-v1']='broken';assert.equal(boot('index',storage).read('reports.length'),1);
});
test('all eight mission paths still produce the expected flags in their rooms',()=>{
 const memo=boot('memo');memo.get('request-path').value='/api/notes/1003';memo.read('lookup()');assert(memo.get('note-result').textContent.includes('FLAG{check_the_owner}'));memo.get('session-body').value='{"role":"admin"}';memo.get('session-form').onsubmit({preventDefault(){}});assert(memo.get('session-result').textContent.includes('FLAG{never_trust_the_client}'));memo.get('request-path').value='/debug/config';memo.read('lookup()');assert(memo.get('note-result').textContent.includes('FLAG{debug_left_open}'));
 const api=boot('requests');assert.equal(api.read(`simulateRequest('PATCH','/api/profile','{"displayName":"x","plan":"pro"}').flag`),'FLAG{allowlist_every_field}');assert.equal(api.read(`simulateRequest('GET','/api/files?path=%2e%2e%2fprivate%2fbackup.json','{}').content.flag`),'FLAG{normalize_before_validate}');assert.equal(api.read(`simulateRequest('POST','/api/credits/transfer','{"recipient":"seoyeon","amount":-50}').flag`),'FLAG{validate_positive_amount}');
 const auth=boot('auth');assert.equal(auth.read(`legacyLogin("admin' -- ",'x').ok`),true);assert.equal(auth.read(`(()=>{const t=issueTicket();recoverAccount('admin',t,'testpass123');return accountLogin('admin','testpass123').ok})()`),true);
});
test('normal memo CRUD, search, read-only foreign note and direct URLs work',()=>{
 const session={},a=boot('memo',{},'',session);assert.equal(a.get('note-list').children.length,2);assert.equal(a.get('lab-tools').open,false);
 a.get('new-note').onclick();a.get('editor-title').value='새 프로젝트';a.get('editor-body').value='회의 기록';a.get('save-note').onsubmit({preventDefault(){}});assert.equal(a.get('note-list').children.length,3);
 a.get('search-notes').value='새 프로젝트';a.get('search-notes').oninput();assert.equal(a.get('note-list').children.length,1);assert.equal(boot('memo',{},'',session).get('note-list').children.length,3);
 const foreign=boot('memo',{},'?note=1003');assert.equal(foreign.get('editor').hidden,false);assert.equal(foreign.get('editor-title').readOnly,true);assert(foreign.get('editor-body').value.includes('FLAG{check_the_owner}'));assert.equal(foreign.get('save-note-button').hidden,true);
 const admin=boot('memo',{},'?page=admin');assert.equal(admin.get('admin-data').textContent,'');const debug=boot('memo',{},'?page=debug');assert.equal(debug.get('debug-data').textContent,'');
});
test('memo flags require typed request path and submitted session JSON',()=>{
 const memo=boot('memo');
 assert(!memo.html.includes('id="config-check"'));
 assert(!memo.html.includes('id="role"'));
 assert(memo.html.includes('id="hint-config"'));
 assert.match(memo.html, /<div class="sidebar-bottom">[^]*?<code>\/debug\/config<\/code>/);
 assert(!memo.html.includes('practice-corner-hint'));
 assert.equal(memo.get('session-body').value,'{\n  "role": "user"\n}');
 memo.get('session-form').onsubmit({preventDefault(){}});
 assert(memo.get('session-result').textContent.includes('"role": "user"'));
 assert(!memo.get('session-result').textContent.includes('FLAG{'));
 memo.get('request-path').value='/api/notes/1001';memo.read('lookup()');assert(!memo.get('note-result').textContent.includes('FLAG{debug_left_open}'));
 memo.get('request-path').value='/debug/config/';memo.read('lookup()');assert(!memo.get('note-result').textContent.includes('FLAG{'));
 memo.get('request-path').value='/debug/config';memo.get('request-form').onsubmit({preventDefault(){}});assert(memo.get('note-result').textContent.includes('FLAG{debug_left_open}'));
 assert.equal(memo.get('note-result').scrolled,true);
 memo.get('session-body').value='{"role":"admin"}';memo.read('openMemoAdmin(false)');assert(!memo.get('admin-data').textContent.includes('FLAG{'));
 memo.get('session-form').onsubmit({preventDefault(){}});assert(memo.get('admin-data').textContent.includes('FLAG{never_trust_the_client}'));
 assert.equal(memo.get('session-result').scrolled,true);
 memo.get('session-body').value='{bad';memo.get('session-form').onsubmit({preventDefault(){}});assert(memo.get('session-result').textContent.includes('400 Bad Request'));
});
test('account forms update service state and the request console reflects changes',()=>{
 const a=boot('requests');a.get('profile-name').value='새 이름';a.get('profile-save').onsubmit({preventDefault(){}});assert.equal(a.get('account-sidebar-name').textContent,'새 이름');assert.equal(a.get('plan-title').textContent,'Free');a.get('export-data').onclick();assert(!a.get('export-result').textContent.includes('FLAG{'));
 a.read(`serviceRequest('PATCH','/api/profile',{displayName:'새 이름',plan:'pro'})`);assert.equal(a.get('plan-title').textContent,'Pro');a.get('export-data').onclick();assert(a.get('export-result').textContent.includes('FLAG{allowlist_every_field}'));
 assert.equal(a.get('account-credits').textContent,100);a.get('transfer-form').onsubmit({preventDefault(){}});assert.equal(a.get('account-credits').textContent,75);assert(!a.get('transfer-feedback').textContent.includes('FLAG{'));
 assert.equal(a.read(`simulateRequest('POST','/api/credits/transfer','{"recipient":"seoyeon","amount":1000}').status`),409);
 assert.equal(a.read(`simulateRequest('POST','/api/credits/transfer','{"recipient":"seoyeon","amount":"-50"}').status`),422);
 a.get('advanced-preset').value='negativeTransfer';a.get('advanced-preset').onchange();a.get('advanced-body').value='{"recipient":"seoyeon","amount":-50}';a.get('advanced-form').onsubmit({preventDefault(){}});assert.equal(a.get('account-credits').textContent,125);assert(a.get('advanced-response').textContent.includes('FLAG{validate_positive_amount}'));
 a.get('advanced-reset').onclick();assert.equal(a.get('account-credits').textContent,100);assert.equal(a.get('plan-title').textContent,'Free');
 const file=boot('requests',{},'?file=%2e%2e%2fprivate%2fbackup.json');assert(file.get('file-preview').textContent.includes('FLAG{normalize_before_validate}'));
});
test('ordinary account login, recovery and administrator console are distinct',()=>{
 const a=boot('auth');a.get('reset-user').value='jimin';a.get('reset-pass').value='memo1234';a.get('reset-login').onsubmit({preventDefault(){}});assert.equal(a.get('signed-in').hidden,false);assert.equal(a.get('signed-secret').hidden,true);a.get('logout').onclick();assert.equal(a.get('auth-account-view').hidden,false);
 assert.equal(a.read(`(()=>{const t=issueTicket();recoverAccount('jimin',t,'newpass123');return accountLogin('jimin','newpass123').ok})()`),true);assert.equal(a.read("accountLogin('jimin','memo1234').ok"),false);
 a.get('choose-legacy').onclick();a.get('sql-user').value="admin' -- ";a.get('sql-pass').value='x';a.get('sql-login').onsubmit({preventDefault(){}});assert.equal(a.get('signed-secret').hidden,false);assert(a.get('signed-secret').textContent.includes('FLAG{parameterize_the_login}'));
 a.get('auth-reset').onclick();assert.equal(a.get('signed-in').hidden,true);assert.equal(a.get('signed-secret').textContent,'');
});
test('legacy login shows the SQL built from each input and keeps it visible after login',()=>{
 const a=boot('auth');a.get('choose-legacy').onclick();assert.equal(a.get('sql-query-panel').hidden,false);
 a.get('sql-user').value='jimin';a.get('sql-user').oninput();a.get('sql-pass').value='memo1234';a.get('sql-pass').oninput();
 assert.equal(a.get('sql-query').textContent,"SELECT id, username, role\nFROM users\nWHERE username = 'jimin' AND password = 'memo1234';");
 a.get('sql-user').value="admin' -- ";a.get('sql-user').oninput();a.get('sql-pass').value='x';a.get('sql-pass').oninput();
 assert(a.get('sql-query').textContent.includes("username = 'admin' -- ' AND password = 'x'"));
 a.get('sql-login').onsubmit({preventDefault(){}});assert.equal(a.get('sql-query-panel').hidden,false);assert.equal(a.get('signed-in').hidden,false);
 a.get('logout').onclick();assert(a.get('sql-query').textContent.includes("username = 'admin' -- ' AND password = ''"));
 a.get('choose-account').onclick();assert.equal(a.get('sql-query-panel').hidden,true);
});
