# Intentia · Trilha Capital de Carreira

Plataforma da trilha **Capital de Carreira** — Dia 0 (travessia) + **21 dias em
3 blocos** (Direção · Amplificação · Rotina), com marcos nas Etapas 7, 14 e 21.
Cada dia reúne um áudio, um conteúdo curto e uma missão de 15–20 minutos, além de
material, playbook, Academia (resumos comentados) e roteiro de IA.

A trilha é a continuação da **Trilha Retrato de Carreira** (produto de entrada, app
próprio com Supabase): a pessoa chega com o Retrato pronto e o traz para a
trilha na **ponte do Dia 0** ("Traga o seu Retrato": manchete, prioridade e
valores → chave `intentia-dia0`, lida pelas Etapas 5 e 21).

> Histórico: até 26/07/2026 a trilha tinha 28 dias; o antigo Bloco 1 "Onde
> estou" (Dias 1–7) foi substituído pela Trilha Retrato de Carreira e os demais dias
> foram renumerados (8–28 → 1–21).

## Site estático

É um site 100% estático (HTML/CSS/JS, sem backend). O progresso é salvo
localmente no navegador (`localStorage`/`sessionStorage`). Ponto de entrada:
[`index.html`](index.html).

- **Jornada (capa):** `index.html` — hero, progresso, selos e a grade dos 22 dias por bloco.
- **Mapa da trilha:** `mapa-trilha.html` — status interno de produção.
- **Dias:** pasta `Dia N/` (N = 0–21) com `index`, `audio`, `material`, `missao`,
  `playbook`, `academia`, `roteiro-ia` e os resumos da Academia.
- **Roteiros de gravação:** `Roteiros para gravação/` — texto limpo de narração
  (`dia-00.txt` … `dia-21.txt`) para produção dos áudios definitivos.

## Navegação

Toda página traz uma barra fixa Intentia (jornada · hub do dia · menu
"Neste dia" · dia anterior/próximo). Atalhos de teclado: `←` dia anterior, `→`
próximo dia (desativados enquanto se digita nos campos).

## Publicar (GitHub Pages)

O arquivo `.nojekyll` desativa o processamento Jekyll — os arquivos são servidos
como estão. Basta ativar o GitHub Pages na branch `main`, pasta raiz (`/`).

## Áudios

Os `Dia N/audio.mp3` atuais são **placeholders** de voz sintética. Para finalizar,
gravar a voz definitiva a partir dos roteiros em `Roteiros para gravação/` e
substituir cada `audio.mp3` (mesmo nome, nenhuma outra mudança necessária).
Prioridade de regravação: dias **00, 01 e 21** (roteiros reescritos na
reestruturação de 26/07/2026).
