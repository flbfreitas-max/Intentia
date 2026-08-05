// Confere o layout: mede a altura real de cada .folha (A4 = 1122.5px a 96dpi)
// e tira um print da primeira pagina para inspecao visual.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const RAIZ = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Trilha Nova Estrutura';
const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const alvos = JSON.parse(fs.readFileSync(path.join(__dirname, 'alvos.json'), 'utf8'));

const A4 = 297 / 25.4 * 96; // 1122.5px

for (const { dia, slug } of alvos) {
  const tmp = path.join(__dirname, 'm-' + slug + '.html');
  let html = fs.readFileSync(path.join(RAIZ, 'Dia ' + dia, slug + '.html'), 'utf8')
    .replace('<script src="../guarda-trilha.js"></script>', '')
    .replace(/<!--intentia-nav:start-->[\s\S]*?<!--intentia-nav:end-->/, '');
  // mede depois das fontes carregarem e escreve o resultado no <title>
  html = html.replace('</body>', `<script>
    document.fonts.ready.then(function(){
      var h=[].map.call(document.querySelectorAll('.folha'),function(f){return Math.round(f.getBoundingClientRect().height)});
      document.title='MEDIDA:'+h.join(',');
    });
  </script></body>`);
  fs.writeFileSync(tmp, html, 'utf8');

  const out = execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=8000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const m = out.match(/MEDIDA:([\d,]+)/);
  const alturas = m ? m[1].split(',').map(Number) : [];
  const estouro = alturas.map((h, i) => h > A4 + 1 ? `p${i + 1} +${Math.round(h - A4)}px` : null).filter(Boolean);
  console.log(`Dia ${dia}`.padEnd(7), alturas.join(' / '), estouro.length ? '  ESTOURO: ' + estouro.join(', ') : '  ok');
  fs.unlinkSync(tmp);
}
