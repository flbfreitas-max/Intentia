/**
 * Trava local: impede que uma chave saia desta máquina.
 *
 * A varredura do GitHub Actions avisa DEPOIS que o envio chegou ao servidor —
 * nessa hora a chave já está lá e precisa ser trocada. Este script roda antes
 * do commit existir, que é a única hora em que dá para simplesmente desfazer.
 *
 * Olha só o que está em fila para o commit (staged), não o disco inteiro.
 * Sem dependências: só Node, que o projeto já exige.
 *
 * Para pular num caso legítimo:  git commit --no-verify
 */
import { execFileSync } from 'node:child_process';

const NULO = String.fromCharCode(0);

/** Padrões de chave real. Cada um é específico o bastante para não gritar à toa. */
const PADROES = [
  ['Mercado Pago (token de acesso)', /\bAPP_USR-[0-9a-zA-Z-]{20,}/],
  ['Mercado Pago (token de teste)', /\bTEST-\d{10,}-\d{6}-[0-9a-f]{20,}/],
  ['Supabase (chave secreta)', /\bsb_secret_[A-Za-z0-9_-]{15,}/],
  ['Supabase service_role (JWT)', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ['Resend (chave de API)', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/],
  ['Google / Gemini (chave de API)', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['GitHub (token)', /\bgh[pousr]_[A-Za-z0-9]{36}\b/],
  ['OpenAI / Anthropic (chave)', /\b(sk-ant-|sk-proj-|sk-)[A-Za-z0-9_-]{24,}/],
  ['Chave privada (bloco PEM)', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

/* Chaves públicas por natureza — feitas para rodar no navegador. Se um padrão
   acima casar dentro destas, é engano e a linha é liberada. */
const PUBLICAS = [/sb_publishable_/, /\bphc_[A-Za-z0-9]{20,}/];

/** Arquivos que nunca deveriam entrar, independentemente do conteúdo. */
const PROIBIDOS = /(^|\/)\.env(\..*)?$|(^|\/)\.vercel\/|\.pem$|\.p12$|(^|\/)id_rsa$/;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const arquivos = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'])
  .split('\n').map((s) => s.trim()).filter(Boolean)
  .filter((f) => !f.startsWith('.githooks/'));   // o próprio verificador cita os padrões

const achados = [];

for (const arquivo of arquivos) {
  if (PROIBIDOS.test(arquivo)) {
    achados.push({ arquivo, linha: 0, tipo: 'arquivo que não deve ser versionado', trecho: arquivo });
    continue;
  }

  let conteudo;
  try { conteudo = git(['show', ':' + arquivo]); } catch { continue; }  // removido no meio
  if (conteudo.indexOf(NULO) > -1) continue;                            // binário

  const linhas = conteudo.split('\n');
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (linha.length > 4000) continue;                 // imagem embutida, minificado
    if (linha.indexOf('data:image/') > -1) continue;   // base64 de imagem dá falso positivo
    if (PUBLICAS.some((p) => p.test(linha))) continue;

    for (const [nome, padrao] of PADROES) {
      const m = linha.match(padrao);
      if (!m) continue;
      achados.push({
        arquivo,
        linha: i + 1,
        tipo: nome,
        trecho: m[0].slice(0, 12) + '… (' + m[0].length + ' caracteres)',
      });
      break;
    }
  }
}

if (!achados.length) process.exit(0);

console.error('\n  x Commit barrado: parece haver credencial no que você está enviando.\n');
for (const a of achados) {
  console.error('    ' + a.arquivo + (a.linha ? ':' + a.linha : ''));
  console.error('      ' + a.tipo + ' -> ' + a.trecho + '\n');
}
console.error('  O que fazer:');
console.error('    1. Tire a chave do arquivo. Segredo vive nas variáveis de ambiente da Vercel.');
console.error('    2. Se a chave já foi usada em algum lugar, troque-a — considere-a exposta.');
console.error('    3. Se for engano (não é chave de verdade), envie com:  git commit --no-verify\n');
process.exit(1);
