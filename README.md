# Intentia · Trilha Capital de Carreira

Plataforma da trilha **Capital de Carreira** — Dia 0 + 28 dias, organizados em 4 semanas.
Cada dia reúne um áudio, um conteúdo curto e uma missão de 15–20 minutos, além de
material, playbook, Academia (resumos comentados) e roteiro de IA.

## Site estático

É um site 100% estático (HTML/CSS/JS, sem backend). O progresso do aluno é salvo
localmente no navegador (`localStorage`). Ponto de entrada: [`index.html`](index.html).

- **Capa:** `index.html` — hero, progresso e a grade dos 29 dias por semana.
- **Jornada:** `jornada.html` — roadmap interativo.
- **Mapa da trilha:** `mapa-trilha.html` — status interno de produção.
- **Dias:** pasta `Dia N/` com `index`, `audio`, `material`, `missao`, `playbook`,
  `academia`, `roteiro-ia` e os resumos da Academia.
- **Roteiros de gravação:** `Roteiros para gravação/` — texto limpo de narração
  (`dia-00.txt` … `dia-28.txt`) para produção dos áudios definitivos.

## Navegação

Toda página traz uma barra fixa Intentia (capa · jornada · hub do dia · menu
"Neste dia" · dia anterior/próximo). Atalhos de teclado: `←` dia anterior, `→`
próximo dia (desativados enquanto se digita nos campos).

## Publicar (GitHub Pages)

O arquivo `.nojekyll` desativa o processamento Jekyll — os arquivos são servidos
como estão. Basta ativar o GitHub Pages na branch `main`, pasta raiz (`/`).

## Áudios

Os `Dia N/audio.mp3` atuais são **placeholders** de voz sintética. Para finalizar,
gravar a voz definitiva a partir dos roteiros em `Roteiros para gravação/` e
substituir cada `audio.mp3` (mesmo nome, nenhuma outra mudança necessária).
