const labs = [
  {
    "id": "memo",
    "name": "Memo 보관함",
    "subtitle": "개인 메모 서비스의 숨은 경계를 찾아보세요.",
    "level": "입문 → 보통",
    "keys": [
      "config",
      "idor",
      "role"
    ],
    "tags": "정보 노출 · 접근 제어",
    "icon": "▤",
    "reward": "350,000"
  },
  {
    "id": "requests",
    "name": "Northstar Cloud",
    "subtitle": "프로필, 파일, 크레딧을 관리하는 클라우드 서비스입니다.",
    "level": "심화",
    "keys": [
      "assignment",
      "traversal",
      "negativeTransfer"
    ],
    "tags": "입력 검증 · 비즈니스 로직",
    "icon": "{ }",
    "reward": "900,000"
  },
  {
    "id": "auth",
    "name": "Memo Identity",
    "subtitle": "계정 로그인과 복구 기능을 제공하는 인증 서비스입니다.",
    "level": "심화",
    "keys": [
      "loginSql",
      "loginReset"
    ],
    "tags": "인증 · 계정 복구",
    "icon": "⌘",
    "reward": "700,000"
  }
];
const activeLab = labs.find(lab => lab.id === document.body.dataset.lab) || null;
const activeTypes = activeLab ? activeLab.keys : labs.flatMap(lab => lab.keys);
