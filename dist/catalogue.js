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

function openReportRoute() {
  if (location.hash === '#report' || new URLSearchParams(location.search).has('report')) {
    tab('report');
    const id = new URLSearchParams(location.search).get('report');
    const lab = labs.find(lab => lab.id === id);
    if (lab) $('report-type').value = lab.keys.find(type => !reports.some(r => r.type === type)) || lab.keys[0];
  }
}
window.addEventListener('hashchange', openReportRoute);
openReportRoute();
