# Plataforma Intentia — Orientações de Desenvolvimento

**Trilha Capital de Carreira · Especificação para o desenvolvedor**
Versão 1.0 · 22/07/2026 · Preparado a partir do protótipo em `Trilha Nova Estrutura/`

---

## Como ler este documento

Este documento orienta a transformação do protótipo HTML existente em uma plataforma real, em produção, usando **Vercel e/ou Hostinger** (os dois cenários estão cobertos no §4). A decisão de produto já tomada é: **evoluir o protótipo atual, não reescrever do zero**. O protótipo é a referência fiel de design, conteúdo e comportamento — o trabalho do desenvolvedor é adicionar as camadas que faltam (contas de usuário, persistência em servidor, IA real, áudio final) com o mínimo de retrabalho sobre o que já existe.

Estrutura do documento:

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Estado atual do protótipo](#2-estado-atual-do-protótipo)
3. [Princípio orientador: evoluir, não reescrever](#3-princípio-orientador-evoluir-não-reescrever)
4. [Arquitetura proposta (Vercel e/ou Hostinger)](#4-arquitetura-proposta-vercel-eou-hostinger)
5. [Autenticação e contas de usuário](#5-autenticação-e-contas-de-usuário)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Migração do armazenamento local para o servidor](#7-migração-do-armazenamento-local-para-o-servidor)
8. [Integração de IA («Refinar com Intentia»)](#8-integração-de-ia-refinar-com-intentia)
9. [Regras de negócio da jornada](#9-regras-de-negócio-da-jornada)
10. [Áudio](#10-áudio)
11. [Geração de PDF](#11-geração-de-pdf)
12. [Correções conhecidas no protótipo](#12-correções-conhecidas-no-protótipo)
13. [Segurança, privacidade e LGPD](#13-segurança-privacidade-e-lgpd)
14. [Fases de desenvolvimento sugeridas](#14-fases-de-desenvolvimento-sugeridas)
15. [Critérios de aceite](#15-critérios-de-aceite)
16. [Anexo A — Inventário de chaves de storage](#anexo-a--inventário-de-chaves-de-storage)
17. [Anexo B — Anatomia de um dia](#anexo-b--anatomia-de-um-dia)

---

## 1. Visão geral do produto

A **Trilha Capital de Carreira** é um programa de desenvolvimento de carreira de **28 dias + Dia 0**, em português do Brasil, dividido em **4 semanas temáticas** com uma entrega (marco) ao fim de cada uma:

| Semana | Dias | Pergunta central | Entrega (marco) |
|---|---|---|---|
| Travessia | Dia 0 | Boas-vindas e contrato da travessia | — |
| Semana 1 | 1–7 | Onde eu realmente estou? | **Retrato + Valores** (Dia 7) |
| Semana 2 | 8–14 | Quem eu quero me tornar? | **Direção Escolhida + Marca** (Dia 14) |
| Semana 3 | 15–21 | Como eu chego lá? | **Plano de Execução v1** (Dia 21) |
| Semana 4 | 22–28 | Como isso vira rotina? | **Compromisso de 90 dias + ritual** (Dia 28) |

Cada dia oferece: um **áudio** (5–6 min em média), um **conteúdo curto**, uma **missão interativa** de 15–20 minutos que gera um **material** (entregável do aluno), um **playbook** de aprofundamento e leituras da **Academia Intentia** (resumos de artigos, em HTML e PDF).

Três **profissionais de referência** fictícios — Camila, Rafael e Juliana — acompanham o aluno em todos os dias, com casos nos playbooks e dados de demonstração nos materiais.

O tom editorial da marca é direto, em segunda pessoa, sem clichês de coaching. Frase-assinatura: *"Movimento sem intenção é agitação. Movimento com intenção é avanço."* / *"Do reagir ao conduzir."*

---

## 2. Estado atual do protótipo

O protótipo é um conjunto de **arquivos HTML estáticos, autocontidos** (CSS e JS inline em cada arquivo), sem backend, sem build e sem framework. Estado do usuário vive em `localStorage`/`sessionStorage`; a "IA" é simulada no cliente. A página interna `mapa-trilha.html` documenta o status de produção de cada arquivo (em 21/07/2026: 171/203 arquivos, ~84% pronto).

### 2.1 Estrutura de arquivos

```
Trilha Nova Estrutura/
├── index.html            ← capa: grade das 4 semanas + progresso + "Continuar do Dia N"
├── jornada.html          ← roadmap interativo (trilha serpenteante em SVG, marcos, streak)
├── mapa-trilha.html      ← painel interno de status de produção (NÃO publicar para alunos)
├── Dia 0/                ← travessia (onboarding)
│   ├── index.html, audio.html, audio.mp3
│   ├── personagens.html  ← apresenta Camila, Rafael e Juliana (só existe no Dia 0)
│   ├── playbook.html, academia.html
│   └── resumo-*.html / resumo-*.pdf
├── Dia 1/ … Dia 28/      ← anatomia canônica de cada dia:
│   ├── index.html        ← hub do dia (áudio, conteúdo, ponto de partida, missão…)
│   ├── audio.html        ← player nativo + transcrição do áudio
│   ├── audio.mp3         ← PLACEHOLDER de voz sintética (trocar — ver §10)
│   ├── missao.html       ← exercício interativo; grava o resultado do dia
│   ├── material.html     ← entregável gerado a partir da missão; exporta PDF
│   ├── playbook.html     ← aprofundamento com casos dos 3 personagens
│   ├── academia.html     ← 2–5 leituras com link para resumo HTML e PDF
│   ├── roteiro-ia.html   ← SPEC INTERNO da IA do dia (não é conteúdo de aluno)
│   └── resumo-*.html / resumo-*.pdf
└── Roteiros para gravação/
    ├── LEIA-ME.txt       ← instruções de produção de áudio
    └── dia-00.txt … dia-28.txt  ← textos limpos de narração
```

Particularidades: o **Dia 0** não tem `missao.html`, `material.html` nem `roteiro-ia.html` (intencional); o **Dia 28** é o fechamento, com navegação reduzida e recapitulação que lê dados dos dias 14 e 27.

### 2.2 Design system (preservar integralmente)

Definido como CSS custom properties, idêntico em todos os arquivos:

- **Cores:** `--verde-900:#275750`, `--verde-700:#336B62`, `--verde-500:#7CA89E`, `--verde-100:#DAE6E1`, `--areia:#EFF2EE`, `--creme:#F5F7F3`, `--coral:#FF6842`, `--coral-soft:#FFC0AB`, `--tinta:#20332F`, `--tinta-suave:#57706A`. Nas páginas de missão/IA: `--lilas:#7C6AC5` (cor da IA) e `--lilas-soft:#EDE9F7`.
- **Fontes (Google Fonts):** Fraunces (títulos, citações, números), Hanken Grotesk (corpo), JetBrains Mono (blocos de prompt/código).
- **Componentes recorrentes:** hero verde-escuro com `.eyebrow` e círculo decorativo `.arc`; destaque `.grifo` (marca-texto coral); nav fixa de passos com scroll-spy (`IntersectionObserver`); cartões `.bloco`; CTA `.cta-missao` em gradiente coral.

Qualquer refatoração visual deve reproduzir esses tokens pixel a pixel — o design está aprovado.

---

## 3. Princípio orientador: evoluir, não reescrever

Decisão de projeto: **manter os HTMLs existentes como front-end** e adicionar por cima login, persistência e IA. Implicações práticas:

1. **Não migrar para SPA/framework agora.** As páginas continuam sendo servidas como estáticos na Vercel. Evita reescrever ~200 arquivos aprovados em conteúdo e design.
2. **Toda lógica nova entra por scripts compartilhados.** Hoje cada HTML tem JS inline duplicado (ex.: o player de áudio e o "shim" de storage estão copiados em vários arquivos). Criar um diretório `/assets/js/` com módulos compartilhados (ex.: `intentia-sync.js`, `intentia-player.js`, `intentia-auth.js`) e incluí-los via `<script src>` nas páginas — alterando o mínimo possível do HTML existente.
3. **Backend por um conjunto pequeno de rotas HTTP `/api/*`** (serverless na Vercel ou app Node no Hostinger — ver §4). O front chama essas rotas com `fetch`; o contrato é o mesmo nos dois cenários.
4. **O protótipo continua funcionando offline/deslogado** como demonstração — o modo logado passa a ser o caminho principal (ver §7.3).

Um passo de build leve (por exemplo, um script Node que injeta a tag `<script>` comum nos 29 `index.html`/`missao.html`) é aceitável; um framework completo, não, nesta fase.

---

## 4. Arquitetura proposta (Vercel e/ou Hostinger)

A Fernanda pretende usar **Vercel e Hostinger**, incluindo a possibilidade de hospedar a plataforma inteira no Hostinger. Para que essa escolha não trave o projeto, a arquitetura abaixo foi desenhada em torno de um **contrato de API fixo** — o front-end estático conversa com um conjunto pequeno de rotas HTTP, e essas rotas podem ser implementadas em qualquer um dos dois cenários. O desenvolvedor implementa uma vez o "miolo" (as rotas e o banco) e a decisão de hospedagem vira um detalhe de deploy, não de código.

### 4.1 O contrato de API (igual nos dois cenários)

```
Front-end estático (os HTMLs do protótipo + /assets/js/*)
        │  fetch, com cookie de sessão
        ▼
/api/auth/*                → login por magic link, sessão, logout
/api/progresso        GET  → dias concluídos do usuário
/api/missao/[dia]  GET/PUT → payload da missão do dia
/api/rascunho/[dia] GET/PUT→ autosave da missão em andamento
/api/ia/refinar       POST → sugestão de IA para um campo
/api/ia/manchete      POST → transformação em manchete
        │
        ▼
Banco de dados (§6)  +  API do provedor de LLM
```

**Regras que valem sempre:** a chave da API do LLM existe apenas como variável de ambiente do servidor, nunca no navegador; toda rota (exceto auth) exige sessão válida; o front não sabe nem precisa saber onde o backend roda.

### 4.2 Cenário A — Vercel

- **Estáticos** servidos pela CDN da Vercel; **rotas como Serverless Functions** no diretório `/api` do mesmo projeto.
- **Banco:** um Postgres gerenciado com boa integração à Vercel — **Neon**, **Supabase**, ou o que o marketplace da Vercel oferecer. *Não tenho certeza da oferta atual de banco nativo da Vercel — verificar as opções vigentes no painel antes de decidir.* A modelagem do §6 funciona em qualquer Postgres.
- **Áudio:** os `.mp3` como estáticos; se o deploy estourar limite de tamanho, mover para **Vercel Blob** ou um bucket (Cloudflare R2/S3). Verificar limites atuais na documentação.

### 4.3 Cenário B — Hostinger (plataforma completa)

O Hostinger tem produtos de naturezas diferentes, e a escolha do plano determina o que é possível:

- **Hospedagem compartilhada (planos web comuns):** serve os estáticos sem problema, mas o backend teria de ser **PHP + MySQL** — significaria reescrever as rotas da API em PHP. Viável, porém distancia o projeto do ecossistema JS do restante do código.
- **VPS Hostinger (recomendado se a plataforma toda ficar lá):** um servidor próprio rodando uma aplicação **Node.js** (ex.: Express ou Fastify) que serve os estáticos e implementa as mesmas rotas `/api/*`, com **Postgres ou MySQL instalado no próprio VPS** ou um Postgres gerenciado externo (Neon/Supabase funcionam de qualquer hospedagem). Exige do desenvolvedor a administração do servidor: HTTPS (Let's Encrypt), processo com restart automático (pm2/systemd), atualizações e backups.
- *Ponto a verificar: os recursos exatos dos planos do Hostinger (suporte a Node.js fora do VPS, limites, painel) mudam com frequência — o desenvolvedor deve confirmar no painel/documentação do Hostinger antes de fechar a escolha do plano. Não tenho informação atualizada e verificada sobre o catálogo atual deles.*

### 4.4 Combinação recomendada

Se a intenção é usar os dois serviços, a divisão mais comum e de menor atrito é: **domínio (e e-mail, se contratado) no Hostinger + aplicação na Vercel**, com o DNS do Hostinger apontando para a Vercel — nesse arranjo ninguém administra servidor e o deploy é `git push`. Se a decisão final for hospedar a aplicação toda no Hostinger, seguir o cenário B com VPS + Node.js. **Recomendação: decidir isso com o desenvolvedor na Fase 0**, pesando quem fará a manutenção do servidor no longo prazo. O restante deste documento independe do cenário.

### 4.5 Observações comuns

- **URLs:** normalizar (`/dia/1/` em vez de `Dia 1/index.html`) — pastas com espaço e acento geram URLs frágeis; um script de renomeação + regras de rewrite (no `vercel.json` ou no servidor Node) resolve sem tocar no conteúdo.
- **Analytics básico:** Vercel Analytics, Plausible ou similar, para medir conclusão por dia e abandono (importante para o produto).

---

## 5. Autenticação e contas de usuário

Requisitos:

- Cadastro/login simples, em português, com o mínimo de fricção. **Magic link por e-mail** (link de acesso sem senha) é a recomendação: público não técnico, evita fluxo de "esqueci a senha". Login social (Google) é um complemento opcional.
- Sessão persistente por cookie httpOnly; todas as rotas `/api/*` (exceto auth) exigem sessão válida.
- As páginas de conteúdo podem permanecer publicamente acessíveis nesta fase ou serem protegidas — decisão de negócio pendente (ver §14, Fase 3). O que **obrigatoriamente** exige login é gravar/ler progresso e usar a IA.

Implementação sugerida: **Auth.js** (nome atual do NextAuth, que funciona também fora do Next) ou o **Supabase Auth** caso Supabase seja escolhido como banco — ambos têm suporte a magic link. *Confirmar na documentação atual de cada biblioteca o suporte ao runtime escolhido (serverless da Vercel ou Node no VPS); não estou 100% certa do estado presente dessas integrações.*

O magic link depende de **envio de e-mail transacional confiável**: usar um serviço dedicado (ex.: Resend, Postmark, SES) ou o SMTP do e-mail profissional do Hostinger, se contratado — testando entregabilidade (SPF/DKIM no DNS do domínio) antes do lançamento, pois e-mail de login que cai em spam bloqueia o acesso do aluno.

---

## 6. Modelo de dados

O protótipo já define, na prática, o modelo de dados — as chaves de storage e seus formatos JSON (inventário completo no Anexo A). A modelagem abaixo transpõe isso para Postgres com o mínimo de transformação, porque **os HTMLs esperam exatamente esses formatos**.

```sql
-- Usuários (se a lib de auth não criar a sua própria)
CREATE TABLE usuarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  nome        text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- Uma linha por dia concluído; o payload é o mesmo objeto
-- que hoje vai para sessionStorage['intentia-diaN']
CREATE TABLE missoes (
  usuario_id    uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  dia           smallint NOT NULL CHECK (dia BETWEEN 1 AND 28),
  -- Dia 0 não tem missão (é onboarding) — nunca gera registro aqui
  payload       jsonb NOT NULL,
  concluida_em  timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, dia)
);

-- Rascunhos (autosave da missão em andamento — ver §7.2)
CREATE TABLE rascunhos (
  usuario_id    uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  dia           smallint NOT NULL,
  payload       jsonb NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, dia)
);

-- Registro de uso de IA (custo, política de 3 gerações, auditoria)
CREATE TABLE ia_usos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  dia         smallint NOT NULL,
  campo       text NOT NULL,          -- ex.: 'manchete', 'res.onde', 'int3'
  geracao     smallint NOT NULL,      -- 1, 2 ou 3
  tokens_in   integer,
  tokens_out  integer,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
```

Derivados calculados em consulta (não armazenar redundante):

- **Progresso** = conjunto de `dia` em `missoes` do usuário → substitui `intentia-progresso`.
- **Streak (sequência)** = a partir de `concluida_em` (datas) → substitui `intentia-jornada-datas`.
- **Marcos** = dias 7, 14, 21, 28 presentes em `missoes`.

O campo `payload` fica como `jsonb` de forma deliberada: cada dia tem um formato próprio (o do Dia 1 está documentado no Anexo A; dias 14 e 27 têm os campos `escolhaFrase` e `novaDirecao`, lidos pelo Dia 28). Não vale a pena normalizar 28 esquemas diferentes — validar o essencial na API (dia válido, payload é objeto, tamanho máximo) e confiar no front para a estrutura fina.

---

## 7. Migração do armazenamento local para o servidor

Esta é a mudança estrutural mais importante e foi desenhada para ser **cirúrgica**: o protótipo já concentra toda a persistência num "shim" que intercepta `Storage.prototype.setItem/getItem` (presente em cada `missao.html`). A estratégia é substituir esse shim por um módulo único de sincronização.

### 7.1 O módulo `intentia-sync.js`

Criar um script compartilhado que:

1. **Na carga da página (usuário logado):** faz `GET /api/progresso` e `GET /api/missao/[dia]` (quando aplicável) e **pré-popula `localStorage`/`sessionStorage` com as mesmas chaves que o protótipo já usa** (`intentia-progresso`, `intentia-diaN`). Resultado: todo o JS existente das páginas — barra de progresso, desbloqueio, material, Dia 28 — continua funcionando **sem nenhuma alteração**, pois lê as chaves de sempre.
2. **Intercepta gravações** (mesma técnica do shim atual): quando uma página grava `intentia-diaN`, o módulo envia `PUT /api/missao/[dia]` com o payload, além de espelhar no `localStorage` (cache local).
3. **Fila offline:** se o `PUT` falhar (sem rede), guarda a pendência e reenvia quando possível. O `localStorage` funciona como cache de leitura e fila de escrita — nunca mais como fonte única da verdade.

Ordem de fonte da verdade: **servidor > localStorage > vazio**. Em conflito (ex.: usuário fez a missão deslogado e depois logou), oferecer importação: "Encontramos respostas salvas neste navegador. Quer salvá-las na sua conta?"

### 7.2 Autosave de verdade

O texto da missão promete "respostas salvas automaticamente", mas o protótipo só grava no clique final de concluir. Implementar autosave real: a cada mudança de campo (com debounce de alguns segundos), gravar o estado parcial em `rascunhos` via `PUT /api/rascunho/[dia]`. Ao reabrir a missão, restaurar o rascunho. Isso cumpre a promessa da interface e evita perda do trabalho de 15–20 minutos do aluno.

### 7.3 Modo demonstração

O comportamento atual (sem login, tudo em localStorage, material com dados da Camila) permanece como **modo demo/deslogado**. Duas limpezas obrigatórias antes do lançamento:

- **Remover o widget de simulação** da `jornada.html` (slider "demo" que grava `intentia-jornada-sim`) do build de produção, ou escondê-lo atrás de flag de admin.
- **Não publicar `mapa-trilha.html`** (painel interno de produção) no site de alunos — mover para fora do deploy ou proteger.

---

## 8. Integração de IA («Refinar com Intentia»)

### 8.1 O que existe hoje

Nas missões, cada campo de texto tem um botão lilás **"Refinar com Intentia"**, e o campo de manchete tem **"Transformar em manchete"**. No protótipo, ambos são **simulados**: um loader de ~900 ms e um texto montado por templates fixos em JS (`SUGESTOES_GENERICAS`, `SUGESTOES_MANCHETE`). Ações do usuário sobre a sugestão: **Usar essa · Gerar outra · Descartar**.

### 8.2 A especificação já está escrita — usar os roteiros

Cada dia (1–28) tem um arquivo **`roteiro-ia.html`**: o spec interno de como a IA real deve se comportar naquele dia. O desenvolvedor **não precisa inventar prompts** — precisa implementar o que os roteiros descrevem:

- **Seção 0 — Princípios gerais** → vira o **system prompt fixo** de toda chamada: lapidar sem reescrever; voz da casa (direta, 2ª pessoa, sem clichês de coaching); nunca julgar/rotular/comparar (contrato do Dia 0); manter 1ª pessoa no presente; expandir no máximo 1,5×–3× o texto original; lista de adjetivos vazios proibidos.
- **Seções 1–4 — prompts por campo** → cada campo (manchete, os dois campos de cada um dos 6 ativos, as 3 intenções) tem objetivo, tese, caixas de "faça/não faça" e, no caso da manchete, um system prompt literal com 3 exemplos de entrada→saída.
- **Seção 5 — política de regeneração** → ângulos rotativos por geração e **limite rígido de 3 gerações por campo**; na terceira, o botão vira "Escrever eu mesma".

### 8.3 Implementação

- **Endpoint:** `POST /api/ia/refinar` com corpo `{ dia, campo, texto, geracao, contexto }` (contexto = outros campos já preenchidos do mesmo ativo, quando o roteiro pedir). Responde `{ sugestao }`. Exigir sessão; nunca expor a chave do LLM no cliente.
- **Prompts versionados em arquivo**, não no banco: extrair dos `roteiro-ia.html` para arquivos de configuração (ex.: `/api/_prompts/dia-01.ts` ou JSON), revisáveis em código.
- **Modelo:** um modelo de linguagem de latência baixa e custo baixo é suficiente — a tarefa é lapidação de texto curto, não raciocínio complexo. A escolha concreta (Anthropic, OpenAI etc.) fica com o desenvolvedor; verificar preços e nomes de modelos vigentes na documentação oficial dos provedores, pois mudam com frequência.
- **Limites e custo:** aplicar no servidor a política de 3 gerações por campo (tabela `ia_usos`), mais um teto diário por usuário (proposta inicial: 60 chamadas/dia) contra abuso. Registrar tokens para acompanhar custo.
- **Falhas:** em timeout/erro do provedor, a interface deve degradar com elegância — mensagem curta ("Não consegui agora, tente de novo") e nunca bloquear o preenchimento manual. Os templates atuais podem servir de fallback offline.
- **Privacidade:** o texto enviado é material pessoal e sensível (ver §13). Não usar para treinar modelos; conferir os termos do provedor escolhido e desativar retenção quando disponível.

---

## 9. Regras de negócio da jornada

Comportamentos que já existem no protótipo e devem ser mantidos no modo logado (agora calculados a partir do banco):

1. **Desbloqueio sequencial:** o Dia N destrava quando a missão do Dia N−1 está concluída. Dia 0 sempre aberto. Nó bloqueado na jornada mostra aviso ("Conclua a missão do Dia N−1…").
2. **Conclusão do dia** = existência do registro `missoes(usuario, dia)`. A conclusão acontece no botão final da `missao.html`, que também leva ao `material.html`.
3. **Progresso** conta apenas os dias 1–28 (Dia 0 não entra no percentual).
4. **Marcos:** dias 7 (Retrato), 14 (Direção), 21 (Plano), 28 (Fechamento). Os selos na jornada tornam-se clicáveis quando conquistados.
5. **Peças do Retrato:** os dias 1–6 contribuem cada um com uma peça do Retrato, completado no Dia 7 (visual da jornada).
6. **Streak:** sequência de dias consecutivos com conclusão, calculada por datas de conclusão.
7. **Encadeamento de dados entre dias:** o Dia 28 lê `novaDirecao` (Dia 27) com fallback em `escolhaFrase` (Dia 14); o `material.html` de cada dia lê a missão do próprio dia. Com o módulo de sync (§7.1) isso continua funcionando sem alteração.
8. **Fallback demo do material:** hoje, sem dados, o `material.html` renderiza silenciosamente o perfil da Camila com um banner discreto. No modo logado, trocar por um portão claro: "Você ainda não concluiu a missão do Dia N" com link para a missão (manter o demo apenas no modo deslogado).

Decisão de produto em aberto (não implementar sem confirmação): liberar os dias por calendário (1 por dia corrido) além do desbloqueio sequencial. O protótipo só implementa o sequencial.

---

## 10. Áudio

- Todos os `audio.mp3` atuais são **placeholders de voz sintética** (MBROLA). A pasta `Roteiros para gravação/` contém `dia-00.txt` … `dia-28.txt` — textos limpos de narração prontos para TTS profissional (o LEIA-ME cita ElevenLabs, OpenAI TTS e Azure como opções) ou para locução humana.
- **Fluxo de troca:** gerar/gravar → exportar MP3 → substituir o `audio.mp3` do dia correspondente, mesmo nome e caminho. Os players leem o arquivo local à página; nenhuma outra mudança é necessária.
- Durações-alvo (do LEIA-ME): Dia 0 ≈ 1min30; Dia 8 ≈ 12 min; Dia 14 ≈ 6–7 min; Dia 28 ≈ 4–5 min (mais lento, com pausas); demais ≈ 5–6 min.
- **Técnico:** consolidar o player em `intentia-player.js` (hoje o mesmo bloco de ~100 linhas está copiado em `index.html` e `audio.html` de cada dia, inclusive dormente no Dia 28, que não tem player visível). Servir os MP3 com cache adequado; se o deploy estourar limite de tamanho, mover para Vercel Blob/R2 (§4).

---

## 11. Geração de PDF

- O `material.html` de cada dia gera um **PDF editorial A4 no cliente** com a biblioteca **jsPDF**, hoje carregada de CDN (versão 2.5.1). Manter a abordagem client-side (funciona bem e não custa servidor), com dois ajustes: **self-hostear o jsPDF** em `/assets/vendor/` (elimina dependência de CDN de terceiros em produção) e tratar o caso de falha de carga com mensagem clara.
- Os `resumo-*.pdf` da Academia são arquivos estáticos já prontos — apenas servi-los.

---

## 12. Correções conhecidas no protótipo

Itens objetivos encontrados na análise, para a primeira faxina do desenvolvedor:

| # | Item | Onde |
|---|---|---|
| 1 | `<title>` errado: página do Dia 1 diz "Dia 2 · Sua trajetória conta" | `Dia 1/index.html` |
| 2 | Texto "salvas automaticamente" sem autosave real (resolver com §7.2) | `missao.html` (todos os dias) |
| 3 | Material renderiza dados demo da Camila sem dado real (portão do §9.8) | `material.html` (todos os dias) |
| 4 | Script de player "dormente" incluído em páginas sem player | `Dia 28/index.html`, `audio.html` |
| 5 | Widget de simulação de progresso visível a qualquer visitante | `jornada.html` (§7.3) |
| 6 | `mapa-trilha.html` (painel interno) linkado no rodapé público | `index.html` (§7.3) |
| 7 | Pastas/URLs com espaço e acento ("Dia 1/", "gravação") | estrutura de pastas (§4) |
| 8 | Dia 28 lê os dados dos dias 14/27 direto do `sessionStorage`, sem o fallback do shim — em uma nova aba a recapitulação da direção não encontra os dados (o módulo de sync do §7.1 resolve, mas testar este caso) | `Dia 28/index.html` |
| 9 | Conteúdos pendentes segundo o próprio mapa: voz final dos 29 áudios; playbook e academia do Dia 28 em placeholder (o mapa registra o playbook enxuto do Dia 28 como intencional — confirmar com a Fernanda); playbook do Dia 27 mínimo | `mapa-trilha.html` (produção de conteúdo, não código) |

---

## 13. Segurança, privacidade e LGPD

O conteúdo que o aluno escreve nas missões é **material pessoal sensível de carreira** (frustrações com o trabalho atual, relações com chefia, planos de saída). Tratar de acordo:

- **HTTPS sempre** (padrão na Vercel); cookies de sessão `httpOnly`, `Secure`, `SameSite`.
- **Escopo por usuário em todas as consultas** — toda rota `/api/missao/*` e `/api/rascunho/*` filtra por `usuario_id` da sessão; nunca aceitar ID de usuário vindo do cliente.
- **LGPD:** base legal (execução de contrato), política de privacidade clara, e implementar desde o início **exportação** ("baixar meus dados" — os payloads JSON) e **exclusão de conta** (o `ON DELETE CASCADE` do modelo já apaga tudo). São as duas solicitações de titular mais comuns e são baratas de fazer agora, caras depois.
- **IA:** informar na interface que o texto do campo é enviado para processamento ao usar "Refinar"; não enviar nada sem clique explícito do usuário (comportamento atual já é assim — preservar); contratos/configuração do provedor de LLM sem retenção para treino (§8.3).
- **Backups automáticos do banco** habilitados no provedor escolhido.
- Observação: sou uma IA, não advogada — para o texto final da política de privacidade e adequação LGPD, vale revisão de um profissional.

---

## 14. Fases de desenvolvimento sugeridas

**Fase 0 — Saneamento e deploy (pequena)**
Decidir com a Fernanda o arranjo de hospedagem (§4.4: tudo no Hostinger vs. domínio no Hostinger + app na Vercel), normalizar URLs, extrair scripts duplicados para `/assets/js/`, corrigir itens 1, 4, 5, 6 e 7 do §12, publicar o site estático. *Resultado: o protótipo atual, no ar, limpo, com domínio próprio.*

**Fase 1 — Contas e persistência (o coração do trabalho)**
Auth por magic link (§5), banco e tabelas (§6), módulo `intentia-sync.js` + rotas `/api/progresso` e `/api/missao/[dia]` (§7.1), autosave de rascunhos (§7.2), portão do material (§9.8), exportação e exclusão de dados (§13). *Resultado: um aluno faz a trilha em qualquer dispositivo sem perder nada.*

**Fase 2 — IA real**
Rotas `/api/ia/*` com prompts extraídos dos `roteiro-ia.html`, política de 3 gerações, limites de uso, fallback offline (§8). *Resultado: os botões lilás funcionam de verdade, no padrão editorial da marca.*

**Fase 3 — Lançamento comercial (escopo a definir com a Fernanda)**
Itens ainda não especificados e que dependem de decisão de negócio: proteger o conteúdo por login/compra, checkout/assinatura, painel administrativo de alunos, e-mails transacionais e lembretes diários (o Dia 0 pede que o aluno "configure um lembrete" — hoje não existe mecanismo). Não iniciar sem alinhamento.

**Em paralelo (produção de conteúdo, sem dependência de código):** gravação/geração da voz final dos 29 áudios e revisão dos conteúdos pendentes apontados pelo mapa (item 9 do §12).

---

## 15. Critérios de aceite

A plataforma está pronta para alunos reais quando:

1. Um usuário novo consegue criar conta, fazer a missão do Dia 1 e ver seu material — e reencontrar tudo em **outro dispositivo**.
2. Fechar o navegador no meio de uma missão **não perde** o que foi digitado (rascunho restaurado).
3. O desbloqueio sequencial funciona a partir do banco: Dia N+1 só abre com o Dia N concluído; jornada, capa e marcos refletem o progresso real.
4. "Refinar com Intentia" retorna sugestão real do LLM seguindo o roteiro do dia; a 3ª regeneração encerra com "Escrever eu mesma"; falha do provedor não trava o formulário.
5. O Dia 28 mostra a direção do aluno (Dia 27, fallback Dia 14) vinda do banco.
6. O PDF do material é gerado com os dados reais do aluno, sem depender de CDN externo.
7. `mapa-trilha.html` e o widget de simulação não estão acessíveis a alunos.
8. O aluno consegue baixar seus dados e excluir sua conta pela interface.
9. Nenhuma chave de API aparece no código do navegador.

---

## Anexo A — Inventário de chaves de storage

Estado atual do protótipo — é o contrato que o módulo de sync (§7.1) deve honrar:

| Chave | Storage | Conteúdo | Quem grava | Quem lê |
|---|---|---|---|---|
| `intentia-progresso` | localStorage | Array JSON de dias concluídos, ex.: `[1,2,3]` (ordenado, sem duplicatas) | shim das `missao.html` | `index.html`, `jornada.html` |
| `intentia-dia{N}` (N=1…28) | sessionStorage, espelhado em localStorage pelo shim | Objeto da missão do dia (formato varia por dia); a existência da chave = "dia concluído" | `missao.html` do dia, no concluir | `material.html` do dia; dias posteriores; jornada/capa |
| `intentia-jornada-sim` | localStorage | Inteiro do modo demo (simula conclusão até o dia X) — **remover em produção** | widget demo da `jornada.html` | `jornada.html` |
| `intentia-jornada-datas` | localStorage | Mapa `{"dia":"YYYY-MM-DD"}` da 1ª data de conclusão observada (base do streak) | `jornada.html` | `jornada.html` |

Formato confirmado do `intentia-dia1` (referência do padrão por dia):

```json
{
  "dataConclusao": "2026-07-22T14:03:00.000Z",
  "ativos": [
    {
      "id": "res",
      "nome": "Resultados",
      "tagline": "…",
      "icone": "<path svg>",
      "onde": "texto livre",
      "cena": "texto livre",
      "sensacoes": ["dúvida", "orgulho"],
      "sensacao": "dúvida"
    }
    // 6 ativos, ordem fixa: res, rep, rel, apr, cre, inf
  ],
  "manchete": "texto livre",
  "intencoes": {
    "motivacao": "…",
    "umAno": "…",
    "maiorPergunta": "…"
  }
}
```

Campos com dependência entre dias, confirmados no código: `intentia-dia14.escolhaFrase` e `intentia-dia27.novaDirecao` (lidos pelo `Dia 28/index.html`). Os formatos dos demais dias devem ser levantados diretamente das respectivas `missao.html` — cada uma serializa seu próprio objeto.

## Anexo B — Anatomia de um dia

Blocos do `index.html` de um dia canônico (Dias 1–27): **Áudio** (player) → **O que você leva** → **Ponto de partida** → **Conteúdo** → **Bônus/Academia** → **Missão** (CTA). Rodapé "Explorar o dia completo" com **três** cartões: `material`, `playbook` e `roteiro-ia` (este último com selo interno, cor lilás — avaliar remoção do link no site de alunos, já que é documentação interna; a `academia.html` é acessada pelo bloco Bônus, não por cartão).

Fluxo do aluno: `index.html` → **Fazer a Missão** → `missao.html` → concluir → `material.html` (com PDF) → próximo dia.

Exceções: Dia 0 (sem missão interativa; tem `personagens.html`) e Dia 28 (fechamento: nav de 4 passos — Colheita, Marco, Adiante, Ritual — missão-ritual leve e recapitulação da direção).

---

*Documento gerado a partir da análise integral do protótipo em 22/07/2026. Dúvidas de produto durante o desenvolvimento: falar com Fernanda Freitas (flbfreitas@gmail.com).*
