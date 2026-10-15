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

document.querySelectorAll('[data-launch]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const room = window.open(link.href, 'bounty-lab-' + link.dataset.launch, 'popup,width=1280,height=900,resizable=yes,scrollbars=yes');
    if (room) {
      room.opener = null;
      room.focus();
      event.preventDefault();
    }
  });
});
