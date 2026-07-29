/**
 * Analytics das landings (PostHog) — mesma régua do app.
 *
 * Este repositório é publicado pelo GitHub Pages, que não tem etapa de build
 * e portanto não tem variáveis de ambiente. Para não commitar chave nenhuma
 * aqui, a configuração é buscada do app, onde ela é gerada no build:
 *
 *     https://app.intentiahub.com/assets/js/analytics-config.js
 *
 * Assim existe uma fonte só da verdade. Se esse arquivo não carregar (app
 * fora do ar, bloqueador de anúncios), nada acontece — a landing continua
 * funcionando normalmente.
 *
 * O comportamento é idêntico ao do app: nada sem "Aceitar", autocapture
 * desligado, sem gravação de sessão, e a mesma decisão vale para os dois
 * domínios (cookie compartilhado entre intentiahub.com e app.intentiahub.com).
 */
(function (global) {
  'use strict';

  var FONTE = 'https://app.intentiahub.com/assets/js/analytics-config.js';
  var CHAVE_CONSENT = 'intentia-analytics-consentimento';
  var PRIVACIDADE = 'https://intentiahub.com/privacidade.html';
  var cfg = null, carregado = false;

  function local(acao, valor) {
    try {
      if (acao === 'ler') return localStorage.getItem(CHAVE_CONSENT);
      if (acao === 'gravar') return localStorage.setItem(CHAVE_CONSENT, valor);
    } catch (e) { return null; }
  }

  var depurando = location.hostname === 'localhost' || location.search.indexOf('debug=analytics') > -1;
  function diga() {
    if (!depurando) return;
    var a = Array.prototype.slice.call(arguments);
    a.unshift('%c[Intentia analytics]', 'color:#7C6AC5;font-weight:700');
    console.log.apply(console, a);
  }

  function recusaDoNavegador() {
    try {
      if (global.navigator && global.navigator.globalPrivacyControl === true) return true;
      var dnt = global.navigator && (global.navigator.doNotTrack || global.doNotTrack);
      return dnt === '1' || dnt === 'yes';
    } catch (e) { return false; }
  }

  function iniciarPostHog() {
    if (carregado || !cfg || !cfg.ativo) return;
    carregado = true;
    var s = document.createElement('script');
    s.src = cfg.host + '/static/array.js';
    s.async = true;
    s.onerror = function () { diga('PostHog não carregou'); };
    s.onload = function () {
      if (!global.posthog || !global.posthog.init) return;
      global.posthog.init(cfg.chave, {
        api_host: cfg.host,
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: true,
        // mesma régua do app: cliques sem efeito e tempo de carregamento sim,
        // com o texto mascarado; autocapture geral e gravação de sessão não
        capture_dead_clicks: true,
        capture_performance: true,
        disable_surveys: true,
        advanced_disable_feature_flags: true,
        person_profiles: 'identified_only',
        cross_subdomain_cookie: true,
        persistence: 'localStorage+cookie',
        mask_all_text: true,
        mask_all_element_attributes: true,
        loaded: function (ph) {
          ph.register({ ambiente: cfg.ambiente || 'producao', superficie: 'landing' });
          if (depurando) { ph.debug(true); diga('ativo na landing ·', location.pathname); }
        },
      });
    };
    document.head.appendChild(s);
  }

  function definir(resposta) {
    var v = resposta === 'sim' ? 'sim' : 'nao';
    local('gravar', v + '|' + new Date().toISOString().slice(0, 10));
    diga('consentimento:', v);
    if (v === 'sim') iniciarPostHog();
  }

  function mostrarAviso() {
    if (document.getElementById('intentia-consent')) return;
    var css = document.createElement('style');
    css.textContent = [
      '#intentia-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;max-width:560px;margin:0 auto;',
      'background:#F5F7F3;color:#20332F;border:1px solid #DAE6E1;border-radius:16px;padding:18px 20px;',
      'box-shadow:0 18px 44px rgba(20,51,47,.28);font-family:"Hanken Grotesk",-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.5}',
      '#intentia-consent p{margin:0 0 14px;color:#57706A}',
      '#intentia-consent b{color:#275750}#intentia-consent a{color:#C04A22;font-weight:700}',
      '#intentia-consent .linha{display:flex;gap:10px;flex-wrap:wrap}',
      '#intentia-consent button{flex:1;min-width:140px;font-family:inherit;font-weight:700;font-size:14px;padding:11px 16px;border-radius:24px;cursor:pointer;border:1.5px solid #DAE6E1;background:#fff;color:#275750}',
      '#intentia-consent button.sim{background:#FF6842;border-color:#FF6842;color:#fff}',
      '@media print{#intentia-consent{display:none!important}}',
    ].join('');
    document.head.appendChild(css);

    var c = document.createElement('div');
    c.id = 'intentia-consent';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-label', 'Preferência de medição de uso');
    c.innerHTML =
      '<p><b>Cookies e medição de uso.</b> Alguns cookies são necessários para a plataforma funcionar — ' +
      'são eles que mantêm você conectada e guardam o que você escreve. Esses sempre existem.</p>' +
      '<p>Com a sua permissão, usamos também cookies de medição: eles registram quais páginas são abertas ' +
      'e por onde você chegou, para descobrirmos onde a plataforma trava. <b>Nunca registram o que você ' +
      'escreve na plataforma</b>. <a href="' + PRIVACIDADE + '" target="_blank" rel="noopener">Como tratamos os dados</a></p>' +
      '<div class="linha"><button type="button" class="sim" data-resp="sim">Aceitar</button>' +
      '<button type="button" data-resp="nao">Só os essenciais</button></div>';
    document.body.appendChild(c);
    c.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-resp]');
      if (!b) return;
      definir(b.getAttribute('data-resp'));
      c.remove();
    });
  }

  function decidir() {
    if (!cfg || !cfg.ativo) { diga('sem configuração — inativo'); return; }
    if (recusaDoNavegador()) { diga('navegador pede para não rastrear'); return; }
    var resp = (local('ler') || '').split('|')[0];
    if (resp === 'sim') return iniciarPostHog();
    if (resp === 'nao') return diga('recusado antes');
    mostrarAviso();
  }

  // busca a configuração no app e só então decide
  var s = document.createElement('script');
  s.src = FONTE;
  s.async = true;
  s.onload = function () { cfg = global.INTENTIA_ANALYTICS || null; decidir(); };
  s.onerror = function () { diga('não consegui ler a configuração do app'); };
  document.head.appendChild(s);
})(window);
