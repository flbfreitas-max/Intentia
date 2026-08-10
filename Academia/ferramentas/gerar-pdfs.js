// Imprime os resumo-*.html em PDF com o Chrome headless.
// Usa uma copia temporaria sem o guarda-trilha.js (o guarda esconde a pagina e
// redireciona para o portao quando nao ha compra validada no navegador).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Trilha Nova Estrutura';
const TMP = __dirname;
const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

// Sem argumentos, imprime os alvos do alvos.json — os 15 estudos gerados a
// partir do markdown. Com argumentos `dia:slug`, imprime so o que foi pedido:
// serve para as leituras que NAO nascem do gerador (as de fonte externa, feitas
// a mao) e para as que mudam de dia e precisam do PDF refeito na casca nova.
//
//   node gerar-pdfs.js
//   node gerar-pdfs.js 18:resumo-o-poder-da-autorreflexao-bailey-rehman-2022
const pedidos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const alvos = pedidos.length
  ? pedidos.map(a => {
      const i = a.indexOf(':');
      if (i < 1) throw new Error(`alvo invalido (esperava dia:slug): ${a}`);
      return { dia: Number(a.slice(0, i)), slug: a.slice(i + 1).replace(/\.html$/, '') };
    })
  : JSON.parse(fs.readFileSync(path.join(TMP, 'alvos.json'), 'utf8')); // [{dia, slug}]

function paginasDoPdf(p) {
  const b = fs.readFileSync(p);
  return (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}

for (const { dia, slug } of alvos) {
  const pasta = path.join(RAIZ, 'Dia ' + dia);
  const origem = path.join(pasta, slug + '.html');
  const temp = path.join(TMP, slug + '.html');
  // fora da copia de impressao: o guarda (esconde/redireciona) e a barra de
  // navegacao (ocupa 46px no fluxo e empurraria o miolo para uma 4a pagina)
  fs.writeFileSync(temp,
    fs.readFileSync(origem, 'utf8')
      .replace('<script src="../guarda-trilha.js"></script>', '')
      .replace(/<!--intentia-nav:start-->[\s\S]*?<!--intentia-nav:end-->/, ''),
    'utf8');

  const destino = path.join(pasta, slug + '.pdf');
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--no-pdf-header-footer',
    '--virtual-time-budget=8000',
    '--print-to-pdf=' + destino,
    'file:///' + temp.replace(/\\/g, '/'),
  ], { stdio: 'pipe' });

  fs.unlinkSync(temp);
  console.log('Dia ' + dia, slug + '.pdf', '-', paginasDoPdf(destino), 'pag');
}
