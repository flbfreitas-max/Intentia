/**
 * Guarda da Trilha Capital de Carreira (Dias 1–21).
 *
 * Faz duas coisas antes de a página aparecer:
 *
 * 1. PORTÃO — o conteúdo pago exige a compra, validada NO SERVIDOR do app
 *    (mesma conta do Retrato):
 *      a. sem chave → vai ao pedágio (app /portao-trilha), que autentica e
 *         volta com a chave no fragmento da URL (nunca passa por servidor);
 *      b. com chave → valida em /api/acesso-trilha; ok → libera e guarda uma
 *         concessão de 12h neste navegador (para não validar a cada página);
 *      c. chave vencida/sem compra → volta ao pedágio (com sessão viva no app,
 *         a renovação é instantânea e invisível).
 *    Queda de rede NÃO tranca quem está no meio de uma missão: na dúvida, exibe.
 *
 * 2. SINCRONIA — o que a pessoa escreve nas missões continua indo primeiro
 *    para o localStorage (é o que responde na hora e funciona sem rede), mas
 *    deixa de morar só lá: cada gravação é espelhada em /api/trilha-dados, e
 *    ao abrir a Trilha em outro aparelho o conteúdo desce de volta antes de a
 *    página se desenhar. O navegador é cache; o cofre é o banco. Sem isto,
 *    trocar de computador ou limpar o histórico apagava semanas de trabalho.
 *
 *    Conflito entre aparelhos resolve por data: a gravação mais recente vence.
 *    Nada de mesclar campo a campo — para texto de uma pessoa só, escrito em
 *    momentos diferentes, mesclar inventaria versões que ninguém escreveu.
 */
(function () {
  var APP = 'https://app.intentiahub.com';
  var DURACAO_MS = 12 * 60 * 60 * 1000; // revalida no servidor a cada 12h
  var CHAVE_ACESSO = 'intentia-trilha-chave';
  var CHAVE_OK = 'intentia-trilha-ok';
  var TEMPOS = 'intentia-sync-tempos';   // quando cada chave foi sincronizada
  var ESPERA_MAX = 2200;                 // rede lenta não segura a página além disto
  var agora = Date.now();

  document.documentElement.style.visibility = 'hidden';
  setTimeout(function () { document.documentElement.style.visibility = ''; }, 6000); // rede lenta não deixa a página invisível para sempre

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function escrever(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function mostrar() { document.documentElement.style.visibility = ''; }
  function pedagio() {
    location.replace(APP + '/portao-trilha?voltar=' + encodeURIComponent(location.href.split('#')[0]));
  }

  // ------------------------------------------------------------ sincronia

  // Chaves que são percurso (vão para o banco). Ficam de fora a credencial, a
  // concessão local e o próprio registro de datas: sessão não se espalha entre
  // aparelhos, e o relógio da sincronia é local por definição.
  var FORA = [CHAVE_ACESSO, CHAVE_OK, TEMPOS];
  function ePercurso(k) {
    return typeof k === 'string' && k.indexOf('intentia-') === 0 && FORA.indexOf(k) < 0;
  }

  function tempos() { try { return JSON.parse(ler(TEMPOS) || '{}'); } catch (e) { return {}; } }
  function gravarTempos(t) { try { escrever(TEMPOS, JSON.stringify(t)); } catch (e) {} }

  var sujas = {};        // chaves alteradas desde o último envio
  var aplicando = false; // enquanto o servidor escreve aqui, não marcar como suja
  var envioAgendado;

  // Intercepta as gravações. Fica instalado desde já: qualquer escrita que
  // aconteça enquanto a sincronia inicial roda também é capturada.
  try {
    var setOriginal = localStorage.setItem;
    localStorage.setItem = function (k, v) {
      var r = setOriginal.apply(this, arguments);
      if (!aplicando && ePercurso(k)) { sujas[k] = true; agendarEnvio(); }
      return r;
    };
  } catch (e) {}

  function agendarEnvio() {
    clearTimeout(envioAgendado);
    envioAgendado = setTimeout(enviar, 1500);
  }

  function enviar(comKeepalive) {
    var chave = ler(CHAVE_ACESSO);
    var lista = Object.keys(sujas);
    if (!chave || !lista.length) return;

    var itens = [];
    var t = tempos();
    var quando = new Date().toISOString();
    lista.forEach(function (k) {
      var v = ler(k);
      if (v === null) return;      // apagada no navegador: não empurra remoção
      itens.push({ chave: k, conteudo: v });
      t[k] = quando;
    });
    if (!itens.length) { sujas = {}; return; }

    sujas = {};
    gravarTempos(t);

    try {
      fetch(APP + '/api/trilha-dados', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: itens }),
        keepalive: !!comKeepalive,
      }).catch(function () {
        // Falhou: devolve as chaves à fila para a próxima tentativa. O que a
        // pessoa escreveu continua no localStorage — nada se perde agora.
        itens.forEach(function (i) { sujas[i.chave] = true; });
      });
    } catch (e) {
      itens.forEach(function (i) { sujas[i.chave] = true; });
    }
  }

  // Fechar a aba não pode ser janela de perda: keepalive deixa o envio sair
  // mesmo com a página indo embora.
  addEventListener('pagehide', function () { clearTimeout(envioAgendado); enviar(true); });
  addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { clearTimeout(envioAgendado); enviar(true); }
  });

  // Qual missão esta página guarda (o padrão é o mesmo nas 21): 'Dia 7' →
  // 'intentia-missao-dia7-rascunho'. Só serve para reencher o formulário
  // quando o conteúdo desce de outro aparelho depois de a página já ter
  // restaurado o que tinha aqui.
  function chaveDaPagina() {
    var m = decodeURIComponent(location.pathname).match(/\/Dia\s*(\d+)\//i);
    return m ? 'intentia-missao-dia' + m[1] + '-rascunho' : null;
  }

  function esc(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');
  }

  // Mesma leitura que a página faz do próprio rascunho — repetida aqui porque
  // aquela roda uma vez só, no load, e o conteúdo do servidor pode chegar depois.
  function reencher(bruto) {
    var d;
    try { d = JSON.parse(bruto); } catch (e) { return; }
    if (!d) return;
    var campos = Array.prototype.slice.call(document.querySelectorAll('input,textarea,select'));
    function chave(el, i) { return el.id || el.name || ('idx-' + i); }
    if (d.campos) {
      campos.forEach(function (el, i) {
        var k = chave(el, i);
        if (!(k in d.campos)) return;
        var v = d.campos[k];
        if (el.type === 'checkbox' || el.type === 'radio') {
          var w = !!v;
          if (el.checked !== w) { el.checked = w; el.dispatchEvent(new Event('change', { bubbles: true })); }
        } else if (el.value !== v) {
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
    if (d.chips && d.chips.length) {
      d.chips.forEach(function (ch) {
        try {
          var chip = document.querySelector('[data-sensacao="' + esc(ch.g) + '"] .sensacao-chip[data-val="' + esc(ch.v) + '"]');
          if (chip && !chip.classList.contains('selected')) chip.click();
        } catch (e) {}
      });
    }
  }

  function aplicar(itens) {
    var t = tempos();
    var daPagina = chaveDaPagina();
    var recebeuDaPagina = null;

    aplicando = true;
    (itens || []).forEach(function (it) {
      if (!it || !ePercurso(it.chave) || typeof it.conteudo !== 'string') return;
      var meu = t[it.chave];
      // Datas em ISO comparam bem como texto. Sem registro local, o servidor
      // vence: é o caso do aparelho novo, que é o motivo de tudo isto existir.
      if (meu && it.atualizado_em <= meu) return;
      escrever(it.chave, it.conteudo);
      t[it.chave] = it.atualizado_em;
      if (daPagina && it.chave === daPagina) recebeuDaPagina = it.conteudo;
    });
    aplicando = false;
    gravarTempos(t);

    // A página restaura o rascunho no load; se o conteúdo chegou depois disso,
    // reencher na mão evita a pessoa ver o formulário vazio com o texto dela
    // guardado logo abaixo.
    if (recebeuDaPagina) {
      if (document.readyState === 'complete') reencher(recebeuDaPagina);
      else addEventListener('load', function () { setTimeout(function () { reencher(recebeuDaPagina); }, 120); });
    }

    // O que existe aqui e o servidor não conhece sobe na sequência: é o caso
    // de quem já usava a Trilha antes desta sincronia existir.
    try {
      var conhecidas = {};
      (itens || []).forEach(function (it) { if (it && it.chave) conhecidas[it.chave] = true; });
      Object.keys(localStorage).forEach(function (k) {
        if (ePercurso(k) && !conhecidas[k]) sujas[k] = true;
      });
      if (Object.keys(sujas).length) agendarEnvio();
    } catch (e) {}
  }

  function sincronizar(pronto) {
    var chave = ler(CHAVE_ACESSO);
    if (!chave) return pronto();

    var terminou = false;
    function fim() { if (!terminou) { terminou = true; pronto(); } }
    setTimeout(fim, ESPERA_MAX);

    fetch(APP + '/api/trilha-dados', { headers: { Authorization: 'Bearer ' + chave } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.itens) aplicar(d.itens); fim(); })
      .catch(fim);
  }

  function liberar() { sincronizar(mostrar); }

  // ---------------------------------------------------------------- portão

  // 1. chegou do pedágio com a chave no fragmento? guarda e limpa a URL
  var m = location.hash && location.hash.match(/chave=([^&]+)/);
  if (m) {
    escrever(CHAVE_ACESSO, decodeURIComponent(m[1]));
    try { localStorage.removeItem(CHAVE_OK); } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // 2. concessão recente ainda vale? libera sem revalidar a compra
  var validade = parseInt(ler(CHAVE_OK) || '0', 10) || 0;
  if (validade && agora < validade) { liberar(); return; }

  var chaveAtual = ler(CHAVE_ACESSO);
  if (!chaveAtual) { pedagio(); return; }

  // 3. valida a chave no servidor do app
  fetch(APP + '/api/acesso-trilha', { headers: { Authorization: 'Bearer ' + chaveAtual } })
    .then(function (r) {
      if (r.status === 401) return { renovar: true };
      return r.ok ? r.json() : null;
    })
    .then(function (d) {
      if (d && d.trilha) {
        escrever(CHAVE_OK, String(agora + DURACAO_MS));
        liberar();
      } else if (d && d.renovar) {
        pedagio(); // chave venceu — o pedágio renova na hora se a sessão do app estiver viva
      } else if (d) {
        pedagio(); // sem compra — o pedágio mostra a oferta
      } else {
        mostrar(); // servidor indisponível: na dúvida, não tranca quem está no meio do caminho
      }
    })
    .catch(mostrar);
})();
