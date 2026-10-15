function renderCatalogue() {
  for (const lab of labs) {
    const done = lab.keys.filter(type => reports.some(r => r.type === type)).length;
    const count = document.querySelector('[data-room-count="' + lab.id + '"]');
    const bar = document.querySelector('[data-room-bar="' + lab.id + '"]');
    count.textContent = done + ' / ' + lab.keys.length + ' 해결' + (done === lab.keys.length ? ' ✓' : '');
    bar.style.width = done / lab.keys.length * 100 + '%';
    const link = document.querySelector('[data-launch="' + lab.id + '"]');
    link.querySelector('span').textContent = done === lab.keys.length ? '실습 다시 열기' : '실습 환경 열기';
  }
}
renderCatalogue();
