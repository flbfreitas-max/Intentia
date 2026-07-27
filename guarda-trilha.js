/**
 * Guarda da Trilha Capital de Carreira (Dias 1–21).
 *
 * O conteúdo pago exige a compra, validada NO SERVIDOR do app (mesma conta do
 * Retrato). Fluxo:
 *   1. sem chave → vai ao pedágio (app /portao-trilha), que autentica e volta
 *      com a chave no fragmento da URL (nunca passa por servidor);
 *   2. com chave → valida em /api/acesso-trilha; ok → libera e guarda uma
 *      concessão de 12h neste navegador (para não validar a cada página);
 *   3. chave vencida/sem compra → volta ao pedágio (com sessão viva no app,
 *      a renovação é instantânea e invisível).
 *
 * Queda de rede NÃO tranca quem está no meio de uma missão: na dúvida, exibe.
 */
(function () {
  var APP = 'https://app-seven-henna-11gcmp4vfx.vercel.app';
  var DURACAO_MS = 12 * 60 * 60 * 1000; // revalida no servidor a cada 12h
  var agora = Date.now();

  document.documentElement.style.visibility = 'hidden';
  setTimeout(function () { document.documentElement.style.visibility = ''; }, 6000); // rede lenta não deixa a página invisível para sempre

  function liberar() { document.documentElement.style.visibility = ''; }
  function pedagio() {
    location.replace(APP + '/portao-trilha?voltar=' + encodeURIComponent(location.href.split('#')[0]));
  }

  // 1. chegou do pedágio com a chave no fragmento? guarda e limpa a URL
  var m = location.hash && location.hash.match(/chave=([^&]+)/);
  if (m) {
    try {
      localStorage.setItem('intentia-trilha-chave', decodeURIComponent(m[1]));
      localStorage.removeItem('intentia-trilha-ok');
    } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // 2. concessão recente ainda vale? libera sem falar com o servidor
  var validade = 0;
  try { validade = parseInt(localStorage.getItem('intentia-trilha-ok') || '0', 10) || 0; } catch (e) {}
  if (validade && agora < validade) { liberar(); return; }

  var chave = null;
  try { chave = localStorage.getItem('intentia-trilha-chave'); } catch (e) {}
  if (!chave) { pedagio(); return; }

  // 3. valida a chave no servidor do app
  fetch(APP + '/api/acesso-trilha', { headers: { Authorization: 'Bearer ' + chave } })
    .then(function (r) {
      if (r.status === 401) return { renovar: true };
      return r.ok ? r.json() : null;
    })
    .then(function (d) {
      if (d && d.trilha) {
        try { localStorage.setItem('intentia-trilha-ok', String(agora + DURACAO_MS)); } catch (e) {}
        liberar();
      } else if (d && d.renovar) {
        pedagio(); // chave venceu — o pedágio renova na hora se a sessão do app estiver viva
      } else if (d) {
        pedagio(); // sem compra — o pedágio mostra a oferta
      } else {
        liberar(); // servidor indisponível: na dúvida, não tranca quem está no meio do caminho
      }
    })
    .catch(liberar);
})();
