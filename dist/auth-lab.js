let authState;function resetAuth(){authState={ticket:null,password:null,serial:0};}resetAuth();
function legacyLogin(user,password){
if(/^admin'\s*--(?:\s.*)?$/i.test(user.trim())&&password.length>0)return{ok:true,message:'200 · admin으로 로그인했습니다.\n관리자 콘솔에 오신 것을 환영합니다.\n\n'+challenges.loginSql.flag};
if(user.includes("'"))return{ok:false,message:"500 · SQL syntax error\n인증 쿼리 템플릿: SELECT * FROM users WHERE username = '<username>' AND password = '<password>'\n아이디 입력값의 따옴표와 주석 처리를 확인하세요."};
return{ok:false,message:'401 · 아이디 또는 비밀번호를 확인하세요.'};
}
function issueTicket(){authState.serial++;authState.ticket='memo-reset-'+authState.serial+'-'+Math.random().toString(36).slice(2,10);return authState.ticket;}
function recoverAccount(target,ticket,password){if(!authState.ticket||ticket!==authState.ticket)return{ok:false,message:'400 · 유효하지 않거나 이미 사용된 티켓입니다.'};if(!['jimin','admin'].includes(target))return{ok:false,message:'404 · 계정을 찾을 수 없습니다.'};if(typeof password!=='string'||password.length<8)return{ok:false,message:'400 · 새 비밀번호를 8자 이상 입력하세요.'};authState.ticket=null;if(target==='admin')authState.password=password;return{ok:true,message:'200 · '+target+'의 비밀번호가 변경되었습니다. 위 로그인 폼에서 다시 로그인하세요.'};}
function accountLogin(user,password){return user==='admin'&&authState.password!==null&&password===authState.password?{ok:true,message:'200 · admin으로 로그인했습니다.\n관리자 콘솔에 오신 것을 환영합니다.\n\n'+challenges.loginReset.flag}:{ok:false,message:'401 · 아이디 또는 비밀번호를 확인하세요.'};}
$('sql-login').onsubmit=e=>{e.preventDefault();$('sql-result').textContent=legacyLogin($('sql-user').value.trim(),$('sql-pass').value).message;};
$('issue-ticket').onclick=()=>{const ticket=issueTicket();$('ticket-mail').textContent='받는 사람: jimin@memo.test\n계정: jimin\n복구 티켓: '+ticket+'\n한 번만 사용할 수 있습니다. 새 메일을 받으면 이전 티켓은 만료됩니다.';};
$('reset-form').onsubmit=e=>{e.preventDefault();$('reset-result').textContent=recoverAccount($('reset-target').value.trim(),$('reset-ticket').value.trim(),$('reset-new').value).message;};
$('reset-login').onsubmit=e=>{e.preventDefault();$('reset-result').textContent=accountLogin($('reset-user').value.trim(),$('reset-pass').value).message;};
$('auth-reset').onclick=()=>{resetAuth();for(const id of ['sql-pass','reset-pass','reset-ticket','reset-new'])$(id).value='';$('reset-target').value='jimin';$('sql-user').value='admin';$('reset-user').value='admin';$('ticket-mail').textContent='아직 받은 메일이 없습니다.';$('sql-result').textContent='로그인 실습을 초기화했습니다.';$('reset-result').textContent='로그인 실습을 초기화했습니다. 제보 보상은 유지됩니다.';};update();
