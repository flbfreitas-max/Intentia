/**
 * Avaliação da Trilha — a pessoa avalia o produto ao fim de um bloco.
 *
 * Direção da avaliação: quem dá nota é a PESSOA; o avaliado é a TRILHA.
 * A plataforma continua sem avaliar ninguém — os Combinados seguem de pé.
 *
 * Uso, no fim da página do dia que fecha o bloco:
 *   <section id="avaliar-trilha" data-momento="bloco-1"></section>
 *   <script src="../avaliacao-trilha.js"></script>
 *
 * A identificação vem do mesmo token que o guarda já guardou neste navegador
 * (localStorage 'intentia-trilha-chave'). Nada de pedir e-mail de novo: quem
 * chegou até aqui está logado, e o nome sai do cadastro no servidor.
 *
 * Se a rede cair ou a sessão vencer, o bloco diz isso em português e não
 * perde o que a pessoa escreveu — o texto continua na tela para reenviar.
 */
(function () {
  var APP = 'https://app-seven-henna-11gcmp4vfx.vercel.app';
  var alvo = document.getElementById('avaliar-trilha');
  if (!alvo) return;

  var momento = alvo.getAttribute('data-momento') || 'bloco-1';
  var rotulo = { 'bloco-1': 'o Bloco 1', 'bloco-2': 'o Bloco 2', 'bloco-3': 'a Trilha inteira' }[momento] || 'a Trilha';
  var chave = null;
  try { chave = localStorage.getItem('intentia-trilha-chave'); } catch (e) {}

  var estilo = document.createElement('style');
  estilo.textContent = [
    '#avaliar-trilha{margin-top:34px}',
    '.av-caixa{background:#fff;border:1px solid #DAE6E1;border-left:4px solid #F0623E;border-radius:18px;padding:26px 28px}',
    '@media(max-width:560px){.av-caixa{padding:20px 18px}}',
    '.av-etq{font-size:11.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#2E7D6F;margin-bottom:8px}',
    '.av-tit{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:20px;color:#275750;line-height:1.25;margin-bottom:6px}',
    '.av-sub{font-size:14px;line-height:1.55;color:#57706A;margin-bottom:18px}',
    '.av-notas{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}',
    '.av-nota{width:46px;height:46px;border-radius:50%;border:1.5px solid #DAE6E1;background:#F7FAF8;color:#275750;font-family:Fraunces,Georgia,serif;font-weight:700;font-size:17px;cursor:pointer;transition:all .16s}',
    '.av-nota:hover{border-color:#F0623E}',
    '.av-nota[aria-pressed="true"]{background:#F0623E;border-color:#F0623E;color:#fff}',
    '.av-legenda{font-size:12.5px;color:#8A9A94;margin:-8px 0 16px}',
    '.av-caixa textarea{width:100%;min-height:96px;border:1px solid #DAE6E1;border-radius:12px;padding:12px 14px;font-family:inherit;font-size:15px;line-height:1.55;color:#14403A;resize:vertical}',
    '.av-caixa textarea:focus{outline:2px solid #F0623E;outline-offset:1px}',
    '.av-acao{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px}',
    '.av-botao{background:#F0623E;color:#fff;border:0;border-radius:999px;padding:12px 26px;font-weight:700;font-size:15px;cursor:pointer}',
    '.av-botao[disabled]{opacity:.55;cursor:default}',
    '.av-recado{font-size:13.5px;color:#57706A}',
    '.av-recado.erro{color:#C04A22}',
  ].join('\n');
  document.head.appendChild(estilo);

  alvo.innerHTML =
    '<div class="av-caixa">' +
      '<p class="av-etq">A sua vez de avaliar</p>' +
      '<h2 class="av-tit">Como foi ' + rotulo + ' para você?</h2>' +
      '<p class="av-sub">Aqui quem dá a nota é você, e quem é avaliado é o Intentia. ' +
        'Isso não entra em lugar nenhum do seu material — serve para a gente melhorar a Trilha.</p>' +
      '<div class="av-notas" role="group" aria-label="Nota de 1 a 5"></div>' +
      '<p class="av-legenda">1 = não funcionou para mim · 5 = valeu muito a pena</p>' +
      '<label for="av-texto" class="av-sub" style="display:block;margin-bottom:8px">Quer escrever algo? (opcional)</label>' +
      '<textarea id="av-texto" maxlength="1200" placeholder="O que ajudou, o que atrapalhou, o que faltou."></textarea>' +
      '<div class="av-acao">' +
        '<button type="button" class="av-botao" id="av-salvar">Enviar avaliação</button>' +
        '<span class="av-recado" id="av-recado"></span>' +
      '</div>' +
    '</div>';

  var caixaNotas = alvo.querySelector('.av-notas');
  var texto = alvo.querySelector('#av-texto');
  var botao = alvo.querySelector('#av-salvar');
  var recado = alvo.querySelector('#av-recado');
  var nota = 0;

  function pinta() {
    Array.prototype.forEach.call(caixaNotas.children, function (b) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.n) === nota));
    });
  }
  for (var n = 1; n <= 5; n++) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'av-nota';
    b.dataset.n = String(n);
    b.textContent = String(n);
    b.setAttribute('aria-label', 'Nota ' + n + ' de 5');
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { nota = Number(this.dataset.n); pinta(); recado.textContent = ''; recado.className = 'av-recado'; });
    caixaNotas.appendChild(b);
  }

  function diz(msg, erro) {
    recado.textContent = msg;
    recado.className = 'av-recado' + (erro ? ' erro' : '');
  }

  // Já avaliou antes? traz o que escreveu, para poder revisar em vez de duplicar.
  if (chave) {
    fetch(APP + '/api/avaliacao?momento=' + encodeURIComponent(momento), {
      headers: { Authorization: 'Bearer ' + chave },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.avaliacao) {
          nota = Number(d.avaliacao.nota) || 0;
          pinta();
          texto.value = d.avaliacao.comentario || '';
          diz('Você já avaliou este bloco. Pode mudar o que quiser e enviar de novo.');
        }
      })
      .catch(function () {});
  }

  botao.addEventListener('click', function () {
    if (!nota) return diz('Escolha uma nota de 1 a 5 antes de enviar.', true);
    if (!chave) return diz('A sua sessão não está ativa aqui. Recarregue a página e tente de novo.', true);

    botao.disabled = true;
    diz('Enviando…');

    fetch(APP + '/api/avaliacao', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({ momento: momento, nota: nota, comentario: texto.value }),
    })
      .then(function (r) {
        if (r.status === 401) throw new Error('sessao');
        if (!r.ok) throw new Error('falha');
        return r.json();
      })
      .then(function () {
        botao.disabled = false;
        botao.textContent = 'Enviar de novo';
        diz('Obrigada. A sua avaliação chegou.');
      })
      .catch(function (e) {
        botao.disabled = false;
        if (e && e.message === 'sessao') {
          diz('A sua sessão expirou. Recarregue a página — o que você escreveu continua aqui.', true);
        } else {
          diz('Não consegui enviar agora. Tente de novo em instantes — o seu texto não se perdeu.', true);
        }
      });
  });
})();
