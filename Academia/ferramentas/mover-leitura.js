// Move uma leitura de uma pasta de dia para outra, trocando a casca.
//
// Por que nao e um `mv`: cada resumo carrega a casca do SEU dia — o rotulo
// "Etapa N", os links prev/next `../Dia N-1` e `../Dia N+1`, a barra de
// navegacao com o dia marcado, a chave `intentia-diaN`. Um arquivo movido cru
// mostraria a navegacao do dia de origem dentro do dia de destino.
//
// Por que nao e substituicao de texto: o plano da renumeracao 28->21 mapeou as
// armadilhas de trocar "Etapa N" por regex — `<h2>Etapa N ·` dentro do
// roteiro-ia sao passos da missao, "Bloco 1" no material do tracker e a semana
// 1, "Etapa N de 7 nesta semana" e relativo e continua valido. Nao vale repetir
// esse risco por duas leituras.
//
// O caminho seguro e o mesmo que `gerar-resumos.js` ja usa: pegar a casca de um
// resumo que JA MORA no dia de destino e injetar nela o conteudo do resumo que
// esta mudando de dia. A casca vem correta de graca.
//
//   node mover-leitura.js                 ensaio
//   node mover-leitura.js --gravar        move de verdade

const fs = require('fs');
const path = require('path');

const RAIZ = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Trilha Nova Estrutura';

// As duas leituras de autorreflexao saem do Dia 19 (Rede de suporte) e vao para
// o Dia 18, cuja missao e "Sua revisao semanal — 15 min, 3 perguntas". Uma
// revisao semanal com tres perguntas fixas E reflexao estruturada.
const MUDANCAS = [
  { de: 19, para: 18, arquivo: 'resumo-o-poder-da-autorreflexao-bailey-rehman-2022.html',
    molde: 'resumo-como-a-resiliencia-funciona-coutu-2002.html' },
  { de: 19, para: 18, arquivo: 'resumo-reserve-tempo-para-refletir-porter-2017.html',
    molde: 'resumo-como-a-resiliencia-funciona-coutu-2002.html' },
];

const RODAPE = /<div class="rodape">[\s\S]*$/;

/** Separa um resumo em casca (prefixo + topo) e o conteudo de cada folha. */
function abrir(html, quem) {
  const iFolha = html.indexOf('<div class="folha">');
  if (iFolha < 0) throw new Error(`${quem}: sem <div class="folha">`);
  const prefixo = html.slice(0, iFolha);
  const mTopo = html.slice(iFolha).match(/<div class="topo">[\s\S]*?<\/div><\/div>/);
  if (!mTopo) throw new Error(`${quem}: sem <div class="topo">`);
  const topo = mTopo[0];

  const folhas = [];
  const re = /<div class="folha"><div class="miolo">([\s\S]*?)<\/div><\/div>(?=\s*(?:<div class="folha">|<\/body>|$))/g;
  let m;
  while ((m = re.exec(html))) {
    let dentro = m[1];
    const i = dentro.indexOf('<div class="topo">');
    if (i >= 0) {
      const t = dentro.slice(i).match(/<div class="topo">[\s\S]*?<\/div><\/div>/);
      if (t) dentro = dentro.slice(0, i) + dentro.slice(i + t[0].length);
    }
    dentro = dentro.replace(RODAPE, '');
    folhas.push(dentro.trim());
  }
  if (!folhas.length) throw new Error(`${quem}: nenhuma folha reconhecida`);
  return { prefixo, topo, folhas };
}

function montar(casca, folhas, titulo) {
  const folha = (conteudo, n, total) =>
    `<div class="folha"><div class="miolo">\n${casca.topo}\n${conteudo}\n`
    + `<div class="rodape"><span class="assin">Do reagir ao conduzir.</span>`
    + `<span>Academia Intentia · página ${n} de ${total}</span></div>\n</div></div>`;
  return casca.prefixo.replace(/<title>[\s\S]*?<\/title>/, `<title>${titulo}</title>`)
    + folhas.map((c, i) => folha(c, i + 1, folhas.length)).join('\n')
    + '\n</body>\n</html>\n';
}

const gravar = process.argv.includes('--gravar');
let erros = 0;

for (const m of MUDANCAS) {
  const origem = path.join(RAIZ, 'Dia ' + m.de, m.arquivo);
  const moldeP = path.join(RAIZ, 'Dia ' + m.para, m.molde);
  const destino = path.join(RAIZ, 'Dia ' + m.para, m.arquivo);

  if (!fs.existsSync(origem)) { console.log('FALTA a origem:', origem); erros++; continue; }
  if (!fs.existsSync(moldeP)) { console.log('FALTA o molde:', moldeP); erros++; continue; }

  const src = abrir(fs.readFileSync(origem, 'utf8'), m.arquivo);
  const casca = abrir(fs.readFileSync(moldeP, 'utf8'), m.molde);

  const tit = (fs.readFileSync(origem, 'utf8').match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
  const html = montar(casca, src.folhas, tit);

  // Conferencias.
  //
  // NAO basta procurar "Etapa {de}" no resultado: cada leitura menciona a etapa
  // anterior, a propria e a seguinte, porque a barra tem prev/next. O molde do
  // Dia 18 cita "Etapa 19" de direito — e o dia seguinte. O invariante correto
  // e que a casca do resultado seja a casca do molde, sem excecao.
  const erradas = [];
  const etapas = (h) => [...new Set((h.match(/Etapa \d+/g) || []))].sort().join(',');
  const iOut = html.indexOf('<div class="folha">');
  const prefixoSaida = html.slice(0, iOut);
  const prefixoMolde = casca.prefixo.replace(/<title>[\s\S]*?<\/title>/,
    (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0]);
  if (prefixoSaida !== prefixoMolde) erradas.push('a casca nao e a do molde');
  if (etapas(prefixoSaida) !== etapas(casca.prefixo)) erradas.push('as etapas da barra mudaram');

  // e o conteudo tem de ser o da origem, inteiro
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const h1src = (fs.readFileSync(origem, 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]
    .replace(/<[^>]+>/g, '').trim();
  if (!h1) erradas.push('perdeu o h1');
  else if (h1 !== h1src) erradas.push(`h1 mudou: ${h1src.slice(0, 30)} -> ${h1.slice(0, 30)}`);
  if (src.folhas.length !== (html.match(/<div class="folha">/g) || []).length) {
    erradas.push('numero de folhas mudou');
  }
  const conta = (h, re) => (h.match(re) || []).length;
  const h2src = src.folhas.reduce((n, f) => n + conta(f, /<h2/g), 0);
  const h2out = conta(html.slice(iOut), /<h2/g);
  if (h2src !== h2out) erradas.push(`secoes mudaram: ${h2src} -> ${h2out}`);

  console.log(`${m.arquivo}`);
  console.log(`   Dia ${m.de} -> Dia ${m.para} · ${src.folhas.length} folha(s) · h1: ${h1.slice(0, 52)}`);
  if (erradas.length) { console.log('   PROBLEMA: ' + erradas.join('; ')); erros++; continue; }
  console.log('   casca do Dia ' + m.para + ' ok, sem rastro do Dia ' + m.de);

  if (gravar) {
    fs.writeFileSync(destino, html, 'utf8');
    fs.unlinkSync(origem);
    const pdf = origem.replace(/\.html$/, '.pdf');
    if (fs.existsSync(pdf)) fs.unlinkSync(pdf);  // o PDF sera regerado no dia novo
    console.log('   gravado e removido da origem (PDF sai; regerar)');
  }
}

if (erros) { console.log(`\n${erros} problema(s)${gravar ? '' : ' — nada seria gravado'}.`); process.exit(1); }
console.log(gravar ? '\nmovidas.' : '\n(ensaio — rode com --gravar)');
