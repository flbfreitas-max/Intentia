// Publica estudos da Academia na Trilha Retrato de Carreira.
//
// Os resumos gerados em `Dia N/` sao feitos para a Trilha Capital: carregam a
// barra de navegacao da Trilha (bloco intentia-nav, verde, com links dos dias),
// um bloco de estilo mobile e o `guarda-trilha.js`. Copiar cru para o acervo do
// Retrato colocaria a navegacao do produto errado dentro do leitor — e o leitor
// (`app-next/app/academia/ler/page.tsx`) injeta apenas o PRIMEIRO <style> do
// arquivo, entao um arquivo com quatro blocos de estilo renderiza torto.
//
// Este script produz um arquivo com a mesma forma dos 22 irmaos que ja moram em
// `api/_leituras/retrato/`: um <style>, sem barra, sem mobile, sem script.
//
//   node publicar-no-retrato.js            confere e mostra o que faria
//   node publicar-no-retrato.js --gravar   grava os arquivos e o acervo
//
// A fonte continua sendo o markdown: rode `gerar-resumos.js` antes, para que os
// `Dia N/*.html` estejam atualizados.

const fs = require('fs');
const path = require('path');

const RAIZ = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Trilha Nova Estrutura';
const PLATAFORMA = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Intentia_Mapa_Estrategico';
const DESTINO = path.join(PLATAFORMA, 'app-next', 'api', '_leituras', 'retrato');
const ACERVO = path.join(PLATAFORMA, 'app-next', 'lib', 'acervo-leituras.json');

// Quais estudos vao para o Retrato, e em que prateleira.
// O criterio e o territorio do Retrato — inventariar o que ja existe — e nao o
// percurso da Capital. Cada um destes aparece nos DOIS produtos de proposito:
// quem faz o Retrato e segue para a Trilha reencontra o texto no dia em que ele
// vira ferramenta.
const ESCOLHIDOS = [
  { dia: 5,
    slug: 'resumo-a-conta-que-so-fecha-no-fim-christensen-2012',
    titulo: 'A conta que só fecha no fim',
    grupo: 'Valores · o Retrato' },
  { dia: 1,
    slug: 'resumo-conte-o-que-voce-tem-siang-2024',
    titulo: 'Antes de escolher, conte o que você tem',
    grupo: 'A chegada' },
  { dia: 7,
    slug: 'resumo-ser-respeitado-nao-e-ser-escolhido-ettenson-knowles-2008',
    titulo: 'Ser respeitado não é ser escolhido',
    grupo: 'Reputação e identidade' },
  { dia: 8,
    slug: 'resumo-a-excelencia-que-ninguem-viu-manita-2026',
    titulo: 'A excelência que ninguém viu',
    grupo: 'Resultados e provas' },
];

/** Tira da pagina tudo o que pertence a Trilha, deixando a forma do Retrato. */
function limpar(html) {
  let h = html;
  const bloco = (nome) => {
    const re = new RegExp(`<!--intentia-${nome}:start-->[\\s\\S]*?<!--intentia-${nome}:end-->`, 'g');
    const antes = h.length;
    h = h.replace(re, '');
    return antes - h.length;
  };
  const corte = { nav: bloco('nav'), mobile: bloco('mobile') };
  const scriptsAntes = (h.match(/<script[\s\S]*?<\/script>/gi) || []).length;
  h = h.replace(/<script[\s\S]*?<\/script>/gi, '');
  // sobra um bloco de estilo de sobrescrita de texto, que vinha depois do nav;
  // o leitor so injeta o primeiro <style>, entao os extras nunca chegariam a
  // tela — melhor nao carregar peso morto no arquivo.
  const estilos = h.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  if (estilos.length > 1) {
    for (const e of estilos.slice(1)) h = h.replace(e, '');
  }
  return { html: h, corte, scripts: scriptsAntes, estilos: estilos.length };
}

const gravar = process.argv.includes('--gravar');
const acervo = JSON.parse(fs.readFileSync(ACERVO, 'utf8'));
const grupos = acervo['leituras-do-retrato'].grupos;

let erros = 0;
for (const e of ESCOLHIDOS) {
  const origem = path.join(RAIZ, 'Dia ' + e.dia, e.slug + '.html');
  const origemPdf = path.join(RAIZ, 'Dia ' + e.dia, e.slug + '.pdf');
  if (!fs.existsSync(origem)) { console.log('FALTA a origem:', origem); erros++; continue; }

  const r = limpar(fs.readFileSync(origem, 'utf8'));
  const sobra = (r.html.match(/<style/gi) || []).length;
  const marcadores = (r.html.match(/<!--intentia-/g) || []).length;
  if (sobra !== 1 || marcadores !== 0) {
    console.log(`FORMA ERRADA em ${e.slug}: ${sobra} <style>, ${marcadores} marcadores`);
    erros++; continue;
  }

  const grupo = grupos.find(g => g.rotulo === e.grupo);
  if (!grupo) { console.log('grupo inexistente:', e.grupo); erros++; continue; }
  const doc = 'retrato/' + e.slug + '.html';
  const jaTem = grupo.itens.some(i => i.doc === doc);

  console.log(`${e.slug}`);
  console.log(`   nav -${r.corte.nav}B · mobile -${r.corte.mobile}B · ${r.scripts} script(s) fora · ${r.estilos} -> 1 estilo`);
  console.log(`   -> ${e.grupo}${jaTem ? '  (ja listado)' : ''}`);

  if (gravar) {
    fs.writeFileSync(path.join(DESTINO, e.slug + '.html'), r.html);
    if (fs.existsSync(origemPdf)) fs.copyFileSync(origemPdf, path.join(DESTINO, e.slug + '.pdf'));
    if (!jaTem) grupo.itens.push({ titulo: e.titulo, doc });
  }
}

if (erros) { console.log(`\n${erros} problema(s) — nada gravado.`); process.exit(1); }
if (gravar) {
  fs.writeFileSync(ACERVO, JSON.stringify(acervo, null, 2) + '\n');
  console.log('\ngravados os 4 arquivos e o acervo-leituras.json');
} else {
  console.log('\n(ensaio — rode com --gravar para valer)');
}
