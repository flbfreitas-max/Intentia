# Atualização da landing do produto de entrada: Mapeamento → Retrato de Carreira

> **Para o Claude Code** (rodar na pasta `Trilha Nova Estrutura`, o site do intentiahub.com). Leia este documento inteiro, proponha um plano curto e espere o meu ok antes de mexer.

## Contexto

O produto de entrada foi renomeado de "Mapeamento Estratégico de Carreira" para **"Retrato de Carreira"**. A página de vendas dele — **`mapeamento.html`** — já foi **totalmente atualizada** (via Cowork) e está salva nesta pasta. **Não refaça o conteúdo dela; ela é a fonte da verdade.** O que falta é o trabalho de site: consistência entre páginas, publicação e alguns acabamentos listados abaixo.

Decisão estratégica que embasa tudo: o entregável "Retrato de Capital de Carreira" da Semana 1 do produto pago (Trilha Capital de Carreira) **deixa de existir** — a pessoa chega ao produto pago já com o Retrato feito no produto de entrada, e a Trilha começa direto na etapa seguinte. A `landing.html` (página de vendas da Trilha paga) precisará ser reformulada por causa disso, mas **isso é uma tarefa separada — não faça agora sem o meu ok.**

## 1. O que já está pronto em `mapeamento.html` (não regredir)

- Nome: "Retrato de Carreira" em todo o texto (título/SEO/OG, hero, CTAs, seções, FAQ, rodapé). Zero "mapa/mapeamento" visível.
- Metáforas reescritas: "Três dias. O seu retrato profissional.", "É um retrato" (não "um mapeamento"), "Produz: Retrato dos Ativos", "É um retrato fiel de quem você já é." (era "do seu próprio território"), ícone do card trocado de mapa-dobrado para moldura/imagem.
- Cores: paleta âmbar-dourada de apoio convertida para a família coral Intentia (`--ambar` agora = `#F0623E`); destaques de texto são **texto coral, sem marca-texto de fundo**.
- Carrossel "O documento": os 5 prints são **páginas reais do PDF atual** do Retrato (capa nova em duas faixas, linha do tempo, panorama, Resultados, fecho), embutidos como JPEG base64.

## 2. Tarefas para você (nesta pasta)

1. **Consistência entre páginas do site.** Varra `index.html`, `quiz.html`, `mapa-trilha.html` e `landing.html` por referências ao nome antigo do produto de entrada ("Mapeamento Estratégico", "mapeamento") e links para `mapeamento.html` com texto desatualizado. Sabido: `quiz.html` tinha ao menos 1 ocorrência de "Mapeamento Estratégico". Corrija apenas o **nome do produto de entrada**; não mexa no posicionamento da Trilha paga (ver contexto acima).
2. **Cartões de seção da landing.** Na seção "O documento" de `mapeamento.html`, abaixo do carrossel, os 6 cartões (`.dossie-grid .dossie-pg`) ainda descrevem a estrutura antiga do dossiê ("Panorama", "Linha da Trajetória", "Visível × Invisível", "Os Seis Ativos", "Três Prioridades", "Uma pergunta aberta"). Alinhe à estrutura real do Retrato atual: **Abertura (celebração) · A sua linha do tempo · Panorama do capital · Os seis ativos (2 páginas cada) · Fecho (a ponte para a construção)** — use os títulos/descrições do relatório real (`Intentia_Mapa_Estrategico/Intentia_Relatorio_Mapa.html`) como referência; não invente conteúdo novo.
3. **URL.** Avalie renomear `mapeamento.html` → `retrato.html` mantendo `mapeamento.html` como redirect (o site é estático/GitHub Pages — um meta refresh + canonical resolve). Se houver links externos/anúncios apontando para a URL antiga, o redirect preserva. Me proponha antes de aplicar.
4. **Peso da página.** `mapeamento.html` está com ~1,2 MB por causa dos 5 prints em base64. Se julgar que vale, extraia os prints para arquivos `.jpg` ao lado (ex.: `img/retrato-capa.jpg` …) e referencie por `src` — mantém a qualidade e melhora o carregamento móvel. Preserve os `alt` atuais.
5. **Checkout.** O link de pagamento do Retrato segue placeholder (comentário `// Link de pagamento do Retrato` no JS). Não invente URL; deixe como está até eu fornecer.
6. **Publicação.** Depois do meu ok no plano: commit + publicar como o site já é publicado hoje (GitHub Pages). Confirme visualmente hero, carrossel e FAQ após o deploy.

## 3. Aceite

- Nenhuma menção visível a "Mapeamento/Mapa Estratégico" em nenhuma página do site referindo o produto de entrada.
- Cartões de seção fiéis à estrutura real do Retrato (sem conteúdo inventado).
- Carrossel com os prints reais funcionando; página leve no celular.
- Linguagem neutra em português padrão (sem formas com "-e"); sem depoimentos/estatísticas/preços inventados.
