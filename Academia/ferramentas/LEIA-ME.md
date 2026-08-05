# Ferramentas da Academia

Geram os `resumo-*.html` e `.pdf` das pastas dos dias a partir de um único arquivo-fonte:
`Academia/estudos-para-o-livro.md`.

**A fonte é o markdown.** Editar o HTML de um resumo à mão faz o texto sair do lugar:
a próxima geração sobrescreve. Edite o markdown e regere.

## Para acrescentar um estudo

1. Escreva o estudo em `estudos-para-o-livro.md`, no mesmo formato dos outros —
   título `##`, linha `**Dia N · Tema**`, linha em itálico com a origem, e as seis
   seções `### 1.` a `### 6.`.
2. Em `gerar-resumos.js`, acrescente uma entrada em `CFG` com o título exato do
   estudo como chave: `slug` (nome do arquivo), `autor` (linha do card na
   `academia.html`) e `tpl` (um resumo que já exista na pasta daquele dia — ele é
   usado só como molde, para herdar cabeçalho, logo e navegação corretos do dia).
3. Acrescente `{"dia":N,"slug":"..."}` em `alvos.json`.
4. Rode, nesta ordem:

```bash
node gerar-resumos.js && node conferir-layout.js && node gerar-pdfs.js
```

5. Acrescente o card na `academia.html` do dia (à mão: copie um card existente,
   troque título, autor, chamada e os dois links) e atualize a contagem no
   selo do topo, na chamada e no rodapé.

## O que cada script faz

- **gerar-resumos.js** — lê o markdown e escreve os `resumo-*.html`, distribuindo
  as seções em três folhas A4: seções 1 e 2 na primeira, 3 na segunda, 4 a 6 na terceira.
- **conferir-layout.js** — mede a altura real de cada folha. Tem de dar `1123 / 1123 / 1123`.
  Se acusar `ESTOURO` na página 1, o texto das seções 1 e 2 é longo demais e precisa
  ser encurtado **no markdown** — senão o PDF sai com 4 páginas e a última fica quebrada.
- **gerar-pdfs.js** — imprime em PDF pelo Chrome. Usa uma cópia temporária sem o
  `guarda-trilha.js` (que esconde a página e manda para o portão) e sem a barra de
  navegação (que ocupa 46px no fluxo e empurraria o miolo para uma quarta página).

Precisam de Node e do Chrome instalado no caminho padrão do Windows.
