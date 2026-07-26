# Plano · Reestruturação da Trilha Capital de Carreira — 28 → 21 dias

**Data:** 26/07/2026 · **Status:** aguardando aprovação (nada foi alterado ainda)

**Contexto:** o Retrato de Carreira (produto de entrada, 3 dias, no app com Supabase) passou a cumprir o papel do Bloco 1 "Onde estou" (Dias 0–7) da Trilha. A Trilha perde esses dias e passa a começar na "Direção", com 21 dias em 3 blocos.

---

## 0. O que o inventário revelou (por que este plano é seguro)

- **Zero dependência de dados**: nenhum arquivo dos Dias 8–28 lê as chaves `intentia-dia0..7` gravadas pelo Bloco 1. A remoção não quebra nenhuma missão.
- **Progresso é automático**: o número do dia é derivado do NOME da chave por regex (`intentia-dia(\d+)`). Renumerando as chaves, o progresso funciona sem tocar na lógica.
- **Navegação é uniforme**: todos os ~210 pares de links prev/next seguem o mesmo padrão `../Dia N/index.html`, em linha idêntica nos 10 arquivos de cada pasta — substituição mecânica confiável.
- **Sem links absolutos**: tudo relativo; CNAME/.nojekyll/publicar.bat não mudam.
- **Raiz desacoplada**: `quiz.html`, `mapeamento.html`, `Mapeamento/` (produto Mapeamento) não tocam a Trilha.

## 1. Decisões de arquitetura (precisam do seu OK)

### D1 — Manter o Dia 0, reescrito ✅ recomendado
O `Dia 0/personagens.html` é a única fonte dos personagens (Camila/Rafael/Juliana) e é linkado por 19 dias (`../Dia 0/personagens.html`). Mantendo a pasta `Dia 0/` com conteúdo novo, **nenhum desses links quebra**. O novo Dia 0 vira: "Você chega com o seu Retrato pronto — aqui ele vira direção" (combinados, personagens, método, e a **ponte de dados** abaixo).

### D2 — Ponte de dados Retrato → Trilha: manual agora, integração depois ✅ recomendado
A Trilha é estática (GitHub Pages, localStorage); o Retrato vive no app (Supabase, com login). Três dias da Trilha dependem de artefatos que agora nascem no Retrato:
- **manchete** (ex-Etapa 1) → usada no ex-Dia 28 (comparação lado a lado)
- **valores** (ex-Etapa 7) → citados no ex-Dia 12 (roteiro-IA)
- **retrato consolidado/prioridade** → narrativa dos ex-Dias 8 e 26

**Curto prazo (este plano):** o novo Dia 0 ganha um mini-formulário "Traga do seu Retrato" (3 campos: manchete revisada · prioridade/síntese · valores) que grava `sessionStorage['intentia-dia0']`. Os dias que dependem desses artefatos passam a ler essa chave, com fallback gracioso ("abra o seu Retrato para rever"). Custa 2 minutos para a pessoa e zero integração.
**Médio prazo (fora deste plano):** migrar a Trilha para o app (mesmo login/Supabase do Retrato) — aí a ponte some.

### D3 — Usuários em curso
Se **ninguém** está percorrendo a Trilha hoje (ainda não vendida), renumeramos sem migração de dados. Se houver alguém, o `intentia-progresso` local antigo apontaria para dias errados — precisaríamos de um shim de migração (−7). **Assumindo: sem usuários ativos.** Confirme.

### D4 — Menções ao "Retrato" nos textos
As dezenas de menções "o Intentia usa o seu Retrato como critério" **continuam verdadeiras** — o Retrato ainda existe, só que como produto de entrada. A reescrita é leve: onde dizia "na Etapa 7 / no Bloco 1 / na semana passada", passa a dizer "no seu Retrato de Carreira".

## 2. Mapa de renumeração

| Hoje | Vira | Bloco novo | Hoje | Vira | Bloco novo |
|---|---|---|---|---|---|
| Dia 0 | Dia 0 (reescrito) | Travessia | Dia 19 | Dia 12 | Bloco 2 · Amplificação |
| Dias 1–7 | **removidos** | — | Dia 20 | Dia 13 | Bloco 2 |
| Dia 8 | Dia 1 | Bloco 1 · Direção | Dia 21 | **Dia 14 · marco Plano** | Bloco 2 (fim) |
| Dia 9 | Dia 2 | Bloco 1 | Dia 22 | Dia 15 | Bloco 3 · Rotina |
| Dia 10 | Dia 3 | Bloco 1 | Dia 23 | Dia 16 | Bloco 3 |
| Dia 11 | Dia 4 | Bloco 1 | Dia 24 | Dia 17 | Bloco 3 |
| Dia 12 | Dia 5 | Bloco 1 | Dia 25 | Dia 18 | Bloco 3 |
| Dia 13 | Dia 6 | Bloco 1 | Dia 26 | Dia 19 | Bloco 3 |
| Dia 14 | **Dia 7 · marco Direção** | Bloco 1 (fim) | Dia 27 | Dia 20 | Bloco 3 |
| Dia 15 | Dia 8 | Bloco 2 · Amplificação | Dia 28 | **Dia 21 · marco Fechamento** | Bloco 3 (fim) |
| Dias 16–18 | Dias 9–11 | Bloco 2 | | | |

- Blocos: "Bloco 2/3/4 de 4" → "Bloco 1/2/3 de 3". Marcos: 14/21/28 → 7/14/21 (o marco "Retrato · Etapa 7" sai — o Retrato agora é o pré-requisito, não um marco interno).
- Rótulo "Etapa N de 7 nesta semana" continua válido (é relativo ao bloco); muda só "Etapa N na trilha".
- Chaves: `intentia-dia8..28` → `intentia-dia1..21` (+ `intentia-missao-diaN-rascunho`).
- Encadeamentos internos preservados na nova numeração: dia1(ex-8) → lido por 2,3,5,6,7 · **dia7(ex-14) → lido por 15+ arquivos (chave mais crítica)** · dia15(ex-22) → 16,17,21 · dia20(ex-27) → 21. Campos `escolhaFrase` (dia7) e `novaDirecao` (dia20) não mudam de nome.

## 3. Fases de execução

**F0 · Segurança** — branch `reestruturacao-21-dias` no git; nada direto na main.

**F1 · Remoção** — apagar pastas `Dia 1/` … `Dia 7/` e `Roteiros para gravação/dia-01..07.txt`; `dia-00.txt` será reescrito junto com o novo Dia 0.

**F2 · Renomeação** — `Dia 8/`→`Dia 1/` … `Dia 28/`→`Dia 21/` (ordem crescente; os destinos ficam livres após F1). Roteiros `dia-08..28.txt` → `dia-01..21.txt`.

**F3 · Substituição mecânica (script, com lista de armadilhas)** — em todos os .html das 22 pastas:
- links `../Dia N/…` → novo número (inclui os pares prev/next, os links de conteúdo `../Dia 8/missao.html` etc. e mantém `../Dia 0/personagens.html` intocado);
- rótulos: `Etapa N` do dia (title, eyebrow, breadcrumb `cur`, `title=` dos pills, "Etapa N na trilha", `Ep. NN`), `Bloco 2/3/4 de 4` → `Bloco 1/2/3 de 3`;
- chaves `intentia-diaN` / `intentia-missao-diaN-rascunho` → novo número.
- **Armadilhas mapeadas (NÃO tocar):** `<h2>Etapa N ·` dentro de `roteiro-ia.html` (passos internos da missão); `"Bloco 1"`/`"bloco 1"` em `Dia 15/19/20/22 material.html` e `Dia 22/missao.html` (é a semana 1 do tracker de hábito); `<!-- BLOCO 1 · ÁUDIO -->` (seção da página); "retrato" minúsculo (substantivo comum); "Etapa N de 7 nesta semana" (relativo, válido).

**F4 · Reescritas manuais (a parte de conteúdo)** — pontos exatos do inventário:

| Dia (novo nº) | Arquivo | O que reescrever |
|---|---|---|
| **Dia 0** | todos | Reescrever por completo: boas-vindas de quem vem do Retrato + combinados + personagens (mantidos) + **ponte de dados** (formulário manchete/prioridade/valores → `intentia-dia0`) + roteiro do novo áudio 00 |
| **Dia 1** (ex-8) | index.html | 4 trechos: "o mapa dos ativos (bloco 1) vira direção" → "o seu Retrato vira direção"; "que você já mapeou no bloco 1"; lista dos 6 artefatos ("Foto Inicial, Trajetória…") → as peças do Retrato de Carreira (manchete, linha do tempo, seis ativos, valores, síntese) |
| | audio.html | 3 blocos de narração ("Ontem você fechou a primeira semana…" → "Você chega com o seu Retrato pronto…") + regravar áudio |
| | roteiro-ia.html | 5 trechos: "Contrato da Etapa 0" (manter, o Dia 0 novo mantém o contrato), "descreveu na Etapa 1" → "no Retrato", "Linha do Tempo" → "linha do tempo do Retrato", "valores marcados na Etapa 7" → "valores do Retrato", "conteúdo sensível da Etapa 2" → "da linha do tempo do Retrato" |
| **Dia 2** (ex-9) | roteiro-ia + resumo-rinne | "Contrato da Etapa 0" (ok, mantém); "usa os seus valores e o seu Retrato" (ok, só revisar) |
| **Dia 3** (ex-10) | resumo-yen (2×) | "usa o Retrato como critério" — revisar contexto, mantém |
| **Dia 4** (ex-11) | resumo-hammond | "acrescenta ao Retrato uma régua" — revisar, mantém |
| **Dia 5** (ex-12) | roteiro-ia.html | 5 trechos, incl. a seção "Cruzamento com a Etapa 7" → "Cruzamento com os valores do seu Retrato" (ler `intentia-dia0` da ponte); "placar da Etapa 10" → "da Etapa 3" |
| | resumo-craig-snook | "destilada do seu Retrato" — ok |
| **Dia 6** (ex-13) | resumo-strack | "no Retrato e na Declaração" — revisar |
| **Dia 7** (ex-14) | resumos (2) | 4 menções "o ponto de partida é o Retrato" — revisar, mantém |
| **Dia 8** (ex-15) | resumo-hewlett | 1 menção — ok |
| **Dias 9–11, 13, 17** | — | limpos (só mecânica da F3) |
| **Dia 12** (ex-19), 14 (ex-21) | index (ex-21) | recap "Etapas 15/16/17/18" → "Etapas 8/9/10/11" (entra na F3 se o padrão for pego; conferir manualmente) |
| **Dia 16** (ex-23) | resumos (2) | "conecta este dia ao Retrato" — ok |
| **Dia 18** (ex-25) | index L407 | conferir "(a proteção da reputação (Etapa …))" |
| **Dia 19** (ex-26) | roteiro-ia + resumos | "mencionou uma ex-chefe na Etapa 2" → "na linha do tempo do seu Retrato"; ~9 menções "revisitar o Retrato" — manter, ajustando que o Retrato é o produto de entrada |
| **Dia 21** (ex-28) | roteiro-ia.html | 6 trechos da comparação de manchete: "manchete da Etapa 1" → "manchete do seu Retrato" (ler da ponte `intentia-dia0`, fallback: pedir que abra o Retrato) |
| | audio.html + index | "Quatro semanas atrás… Etapa 1" → "Três semanas atrás… e antes disso, o seu Retrato"; regravar áudio |
| | material.html | "Bloco A · 28 dias" → "Trilha · 21 dias"; "uma foto inicial, uma direção…" → "um retrato, uma direção escolhida e um plano virado rotina" |

**F5 · Arquivos da raiz**
- `index.html` (Jornada): reescrever arrays `DIAS[]` (22 entradas), `BLOCOS[]` (4: Travessia + 3 blocos), `MARCOS[]` (7/14/21); **remover a feature "Peças do Retrato"** (seção + loop das Etapas 1–6); ajustar `sim-range max=21`, limites `n<=28`→`21`, loop `i<=28`→`21`; textos "28 dias · 4 blocos" → "21 dias · 3 blocos"; nova frase de entrada citando o Retrato como pré-requisito.
- `mapa-trilha.html`: reescrever a tabela à mão (22 linhas, 4 separadores) e o changelog; remover referência morta a `jornada.html`.
- `landing.html`: 6 menções "28 dias"/blocos → 21/3 (texto de marketing; sem acoplamento estrutural).
- `README.md` e `orientacoes-desenvolvimento-plataforma-intentia.md`: atualizar estrutura, encadeamento (`escolhaFrase`/`novaDirecao` com novos números), regra de desbloqueio, e registrar a ponte Retrato→Trilha.

**F6 · Verificação (script)**
- checador de links: varrer todos os href relativos e confirmar que o alvo existe;
- grep de sobras: `Dia 2[2-8]`, `Etapa 2[2-8]` (fora dos FPs), `../Dia [1-7]/`, `28 dias`, `Bloco 4`, `intentia-dia2[2-8]`;
- teste manual: concluir Dia 0→1 no navegador e ver desbloqueio/progresso na Jornada; simulador (`sim-range`) de ponta a ponta.

**F7 · Publicação** — commit na branch, sua revisão visual, merge e `publicar.bat` (GitHub Pages).

## 4. Esforço estimado

| Fase | Natureza | Tamanho |
|---|---|---|
| F1–F2 | mecânica | minutos |
| F3 | script + conferência | ~230 links, ~110 rótulos, ~60 chaves — 1 sessão |
| F4 | escrita (o miolo) | Dia 0 novo + Dia 1 + Dia 5 + Dia 19 + Dia 21 pesados; resto leve — a maior fase |
| F5 | JS + tabela + textos | 1 sessão |
| F6–F7 | verificação | rápida |

Áudios: os dos ex-Dias 8 e 28 (novos 1 e 21) precisam de **regravação** (narração cita a semana 1); o do Dia 0 é novo. Os demais 19 áudios permanecem válidos. Roteiros novos entram na F4.

## 5. Fora do escopo deste plano (próximos capítulos)
- Migrar a Trilha para o app (Supabase/login) e aposentar a ponte manual.
- Página de venda da Trilha + fluxo de pagamento (Mercado Pago) + `landingDaTrilha` no config do Retrato.
- Normalizar URLs para `/dia/1/` (recomendação antiga das orientações; opcional, dobraria o trabalho de links agora).
