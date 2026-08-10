// Gera os resumo-*.html da Academia a partir de Academia/estudos-para-o-livro.md,
// usando como template o resumo que ja existe na pasta de cada dia (para herdar
// o cabecalho, o logo em base64 e a navegacao correta daquele dia).
const fs = require('fs');
const path = require('path');

const RAIZ = 'C:\\Users\\flbfr\\Desktop\\Claude Cowork\\Intentia\\Trilha Nova Estrutura';
const MD = path.join(RAIZ, 'Academia', 'estudos-para-o-livro.md');

// titulo do estudo -> { slug, autor (linha do card), template (resumo existente
// da mesma pasta, usado de base para herdar cabecalho, logo e navegacao do dia)
const CFG = {
  'Antes de escolher o próximo passo, conte o que você tem':
      { slug: 'resumo-conte-o-que-voce-tem-siang-2024',
        autor: 'Sanyin Siang · MIT Sloan Management Review · 2024',
        tpl: 'resumo-eus-possiveis-transicao-ibarra-2023.html' },
  'A conta que só fecha no fim':
      { slug: 'resumo-a-conta-que-so-fecha-no-fim-christensen-2012',
        autor: 'Clayton Christensen, por Leslie Brokaw · MIT Sloan Management Review · 2012',
        tpl: 'resumo-proposito-se-constroi-coleman-2017.html' },
  'As três respostas que não se encontram':
      { slug: 'resumo-tres-respostas-que-nao-se-encontram-michaelson-2010',
        autor: 'Christopher Michaelson · MIT Sloan Management Review · 2010',
        tpl: 'resumo-proposito-se-constroi-coleman-2017.html' },
  'Ser respeitado não é ser escolhido':
      { slug: 'resumo-ser-respeitado-nao-e-ser-escolhido-ettenson-knowles-2008',
        autor: 'Richard Ettenson e Jonathan Knowles · MIT Sloan Management Review · 2008',
        tpl: 'resumo-reinventar-marca-pessoal-clark-2011.html' },
  'A excelência que ninguém viu':
      { slug: 'resumo-a-excelencia-que-ninguem-viu-manita-2026',
        autor: 'Riadh Manita, Najoua Elommal e Michel Dalmas · MIT Sloan Management Review · 2026',
        tpl: 'resumo-novas-regras-presenca-executiva-hewlett-2024.html' },
  'A voz emprestada':
      { slug: 'resumo-a-voz-emprestada-hollis-wright-2024',
        autor: 'David Hollis e Alex Wright · MIT Sloan Management Review · 2024',
        tpl: 'resumo-como-especialistas-ganham-influencia-mikes-2013.html' },
  'Uma alavanca só não move nada':
      { slug: 'resumo-uma-alavanca-so-nao-move-nada-grenny-hughes',
        autor: 'Grenny, Maxfield e Shimberg (2008) · Hughes, Wadd e Hetrick (2024) · MIT Sloan Management Review',
        tpl: 'resumo-como-lideres-usam-redes-ibarra-hunter-2007.html' },
  'Quando falta poder, e o cargo não vem':
      { slug: 'resumo-quando-falta-poder-barsoux-bouquet-2013',
        autor: 'Jean-Louis Barsoux e Cyril Bouquet, por Leslie Brokaw · MIT Sloan Management Review · 2013',
        tpl: 'resumo-arte-necessaria-persuasao-conger-1998.html' },
  'Ouvir não é uma coisa só':
      { slug: 'resumo-ouvir-nao-e-uma-coisa-so-duarte-2022',
        autor: 'Nancy Duarte · MIT Sloan Management Review · 2022',
        tpl: 'resumo-arte-necessaria-persuasao-conger-1998.html' },
  'O trem que anda aos solavancos':
      { slug: 'resumo-o-trem-que-anda-aos-solavancos-tan-2024',
        autor: 'Wendy Tan e Joo-Seng Tan · MIT Sloan Management Review · 2024',
        tpl: 'resumo-a-construcao-de-um-expert-ericsson-2007.html' },
  'O que sobra quando a máquina leva a parte fácil':
      { slug: 'resumo-o-que-sobra-quando-a-maquina-anderson-2023',
        autor: 'Shelia Anderson (Aflac) · MIT Sloan Management Review · 2023',
        tpl: 'resumo-a-construcao-de-um-expert-ericsson-2007.html' },
  'Onde você aplica o que tem':
      { slug: 'resumo-onde-voce-aplica-o-que-tem-macdonald-2019',
        autor: 'Ally MacDonald · MIT Sloan Management Review · 2019',
        tpl: 'resumo-por-que-a-execucao-da-estrategia-desmorona-sull-2015.html' },
  'A saída também é um vínculo':
      { slug: 'resumo-a-saida-tambem-e-um-vinculo-laker-2023',
        autor: 'Benjamin Laker · MIT Sloan Management Review · 2023',
        tpl: 'resumo-reserve-tempo-para-refletir-porter-2017.html' },
  'Ver a mudança antes de ela chegar':
      { slug: 'resumo-ver-a-mudanca-antes-johnson-2019',
        autor: 'Whitney Johnson e Paul Michelman · MIT Sloan Management Review · 2019',
        tpl: 'resumo-a-ciencia-das-metas-locke-latham-2002.html' },
  'A vida em três atos acabou':
      { slug: 'resumo-a-vida-em-tres-atos-acabou-gratton',
        autor: 'Lynda Gratton · MIT Sloan Management Review · 2018 e 2019',
        tpl: 'resumo-a-ciencia-das-metas-locke-latham-2002.html' },
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// negrito/italico do markdown -> html (depois de escapar)
const inline = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(“"])_(.+?)_(?=$|[\s,.;:)”"])/g, '$1<em>$2</em>');

function parseMd(txt) {
  const estudos = [];
  const blocos = txt.split(/\n---\n/).map(b => b.trim()).filter(b => b.startsWith('## '));
  for (const b of blocos) {
    const linhas = b.split('\n');
    const e = { titulo: linhas[0].replace(/^##\s+/, '').trim(), secoes: {} };
    e.h2 = {};
    let sec = null, buf = [];
    const fecha = () => { if (sec !== null) e.secoes[sec] = buf.join('\n').trim(); buf = []; };
    for (const l of linhas.slice(1)) {
      const h = l.match(/^###\s+((\d)\.\s*.+)$/);
      if (h) { fecha(); sec = Number(h[2]); e.h2[sec] = h[1].trim(); continue; }
      if (sec === null) {
        const dia = l.match(/^\*\*Dia\s+(\d+)\s+·\s+(.+?)\*\*$/);
        if (dia) { e.dia = Number(dia[1]); e.tema = dia[2]; continue; }
        const orig = l.match(/^_(.+)_$/);
        if (orig) { e.orig = orig[1]; continue; }
        continue;
      }
      buf.push(l);
    }
    fecha();
    estudos.push(e);
  }
  return estudos;
}

// converte um bloco de secao em html, separando destaque / listas / referencia
function bloco2html(txt, { comoDestaque = false } = {}) {
  const out = [];
  let ferramenta = null, itens = [], paras = [], citacao = null, referencia = null;
  for (const p of txt.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)) {
    if (p.startsWith('> ')) { citacao = p.replace(/^>\s*/, ''); continue; }
    const f = p.match(/^\*\*(Ferramenta Intentia · .+?)\*\*$/);
    if (f) { ferramenta = f[1]; continue; }
    if (/^\d+\.\s/.test(p)) {
      p.split('\n').forEach(l => { const m = l.match(/^\d+\.\s+(.*)$/); if (m) itens.push(m[1]); });
      continue;
    }
    if (p.startsWith('**Referência.**')) { referencia = p.replace(/^\*\*Referência\.\*\*\s*/, ''); continue; }
    paras.push(p);
  }
  for (const p of paras) out.push(`<p>${inline(p)}</p>`);
  if (citacao) {
    const t = citacao.replace(/^\*\*A leitura do Intentia\*\*\s*—\s*/, '');
    out.push(`<div class="destaque"><span class="rot">A leitura do Intentia</span><p>${inline(t)}</p></div>`);
  }
  if (itens.length) {
    const ol = `<ol class="num">${itens.map(i => `<li>${inline(i)}</li>`).join('')}</ol>`;
    out.push(comoDestaque && ferramenta
      ? `<div class="destaque"><span class="rot">${esc(ferramenta)}</span>${ol}</div>`
      : ol);
  }
  if (referencia) out.push(`<div class="fonte"><b>Referência completa.</b> ${inline(referencia)}</div>`);
  return out.join('');
}

const CITE = 'Este é um estudo comentado da Academia Intentia. O texto que serviu de base é usado apenas como ponto de partida para uma análise própria e não é reproduzido aqui. Para conhecer o conteúdo original por inteiro, recomendamos a leitura na fonte.';

function gerar(e) {
  const cfg = CFG[e.titulo];
  if (!cfg) throw new Error('sem config para: ' + e.titulo);
  const pastaDia = path.join(RAIZ, 'Dia ' + e.dia);
  const tplPath = path.join(pastaDia, cfg.tpl);
  const tpl = fs.readFileSync(tplPath, 'utf8');

  const iFolha = tpl.indexOf('<div class="folha">');
  const prefixo = tpl.slice(0, iFolha);
  const topo = tpl.slice(iFolha).match(/<div class="topo">[\s\S]*?<\/div><\/div>/)[0];

  const p1 = `<div class="eyebrow">Estudo comentado · 3 páginas</div>`
    + `<h1>${esc(e.titulo)}</h1>`
    + `<p class="orig"><em>${esc(e.orig)}</em></p>`
    + `<p class="cite">${CITE}</p>`
    + `<h2>${esc(e.h2[1])}</h2>${bloco2html(e.secoes[1])}`
    + `<h2>${esc(e.h2[2])}</h2>${bloco2html(e.secoes[2])}`;
  const p2 = `<h2>${esc(e.h2[3])}</h2>${bloco2html(e.secoes[3])}`;
  const p3 = `<h2>${esc(e.h2[4])}</h2>${bloco2html(e.secoes[4])}`
    + `<h2>${esc(e.h2[5])}</h2>${bloco2html(e.secoes[5], { comoDestaque: true })}`
    + `<h2>${esc(e.h2[6])}</h2>${bloco2html(e.secoes[6])}`;

  const folha = (conteudo, n) =>
    `<div class="folha"><div class="miolo">\n${topo}\n${conteudo}\n`
    + `<div class="rodape"><span class="assin">Do reagir ao conduzir.</span>`
    + `<span>Academia Intentia · página ${n} de 3</span></div>\n</div></div>`;

  const html = prefixo.replace(/<title>[\s\S]*?<\/title>/,
      `<title>${esc(e.titulo)} · Academia Intentia</title>`)
    + [p1, p2, p3].map((c, i) => folha(c, i + 1)).join('\n')
    + '\n</body>\n</html>\n';

  const destino = path.join(pastaDia, cfg.slug + '.html');
  fs.writeFileSync(destino, html, 'utf8');
  return destino;
}

// Normaliza CRLF -> LF antes de qualquer coisa. Sem isto o gerador nao le a
// propria fonte: o git desta maquina tem core.autocrlf=true, entao depois de
// qualquer checkout o markdown chega com \r\n, e todo padrao daqui para baixo
// esta ancorado em \n — o corte por /\n---\n/ devolve UM bloco (o arquivo
// inteiro, que comeca com '# ' e nao com '## ') e o gerador anuncia
// "estudos encontrados: 0" sem escrever nada e sem falhar.
const estudos = parseMd(fs.readFileSync(MD, 'utf8').replace(/\r\n/g, '\n'));
console.log('estudos encontrados:', estudos.length);
for (const e of estudos) {
  for (const s of [1, 2, 3, 4, 5, 6]) if (!e.secoes[s]) throw new Error(`Dia ${e.dia}: falta secao ${s}`);
  console.log('Dia', e.dia, '->', path.basename(gerar(e)));
}
