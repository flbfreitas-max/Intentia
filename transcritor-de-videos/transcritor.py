# -*- coding: utf-8 -*-
"""
Transcritor de Vídeos — núcleo.

Baixa só o áudio de links do Instagram, TikTok e YouTube (via yt-dlp),
transcreve localmente na máquina (via faster-whisper, sem enviar nada
para fora) e salva um arquivo .txt por vídeo com autor, plataforma,
link, duração, idioma detectado, transcrição corrida e versão com
marcação de tempo.

Uso pela linha de comando:
    python transcritor.py <link1> <link2> ...

A janela gráfica (janela.py) usa as mesmas funções deste arquivo.
"""

import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path

PASTA_FERRAMENTA = Path(__file__).resolve().parent
ARQUIVO_CONFIG = PASTA_FERRAMENTA / "config.txt"

NOMES_IDIOMAS = {
    "pt": "Português", "en": "Inglês", "es": "Espanhol", "fr": "Francês",
    "it": "Italiano", "de": "Alemão", "ja": "Japonês", "ko": "Coreano",
    "zh": "Chinês", "ru": "Russo", "ar": "Árabe", "hi": "Hindi",
    "nl": "Holandês", "pl": "Polonês", "tr": "Turco",
}

NOMES_PLATAFORMAS = {
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "youtube": "YouTube",
}

# Sinais, na mensagem de erro do yt-dlp, de que o vídeo exige login —
# nesse caso tentamos de novo usando os cookies do navegador.
SINAIS_DE_LOGIN = (
    "login", "log in", "logged in", "cookies", "rate-limit", "rate limit",
    "private", "restricted", "authentication", "account",
)


# ----------------------------------------------------------------------
# Configuração
# ----------------------------------------------------------------------

CONFIG_PADRAO = """# Configuração do Transcritor de Vídeos
# Pode editar os valores depois do sinal de igual. Linhas com # são ignoradas.

# Tamanho do modelo de transcrição: tiny, base, small, medium, large-v3
# small = bom equilíbrio entre velocidade e precisão (recomendado p/ 16 GB de RAM)
MODELO=small

# Pasta onde as transcrições são salvas. AUTO = Documentos/Transcricoes
PASTA_SAIDA=AUTO

# Navegador de onde pegar os cookies quando um vídeo exigir login
# (chrome, edge, firefox, safari). Só é usado se o download sem login falhar.
NAVEGADOR=chrome
"""


def carregar_config():
    """Lê config.txt (criando com padrões na primeira vez)."""
    if not ARQUIVO_CONFIG.exists():
        ARQUIVO_CONFIG.write_text(CONFIG_PADRAO, encoding="utf-8")
    config = {"MODELO": "small", "PASTA_SAIDA": "AUTO", "NAVEGADOR": "chrome"}
    for linha in ARQUIVO_CONFIG.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        config[chave.strip().upper()] = valor.strip()
    return config


def pasta_documentos():
    """Pasta Documentos real do usuário (funciona com OneDrive no Windows)."""
    if sys.platform == "win32":
        try:
            import ctypes
            import ctypes.wintypes
            buf = ctypes.create_unicode_buffer(ctypes.wintypes.MAX_PATH)
            # CSIDL 5 = pasta pessoal "Documentos"
            ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf)
            if buf.value:
                return Path(buf.value)
        except Exception:
            pass
    for nome in ("Documents", "Documentos"):
        p = Path.home() / nome
        if p.exists():
            return p
    return Path.home()


def pasta_saida(config=None):
    config = config or carregar_config()
    valor = config.get("PASTA_SAIDA", "AUTO")
    pasta = pasta_documentos() / "Transcricoes" if valor.upper() == "AUTO" else Path(valor)
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


# ----------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------

def extrair_links(texto):
    """Extrai todos os links http(s) de um texto colado (um ou vários)."""
    achados = re.findall(r"https?://[^\s\"'<>]+", texto)
    vistos, links = set(), []
    for link in achados:
        link = link.rstrip(".,;)")
        if link not in vistos:
            vistos.add(link)
            links.append(link)
    return links


def limpar_nome(texto, maximo=60):
    """Deixa um texto seguro para usar em nome de arquivo."""
    texto = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", str(texto)).strip()
    texto = re.sub(r"\s+", " ", texto)
    return texto[:maximo].strip() or "desconhecido"


def formatar_duracao(segundos):
    if not segundos:
        return "desconhecida"
    segundos = int(segundos)
    h, resto = divmod(segundos, 3600)
    m, s = divmod(resto, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def formatar_tempo(segundos):
    """Tempo de um trecho, para a marcação [MM:SS] ou [H:MM:SS]."""
    segundos = int(segundos)
    h, resto = divmod(segundos, 3600)
    m, s = divmod(resto, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def nome_idioma(codigo):
    return NOMES_IDIOMAS.get(codigo, f"código '{codigo}'")


def nome_plataforma(extractor):
    chave = (extractor or "").lower()
    for pedaco, nome in NOMES_PLATAFORMAS.items():
        if pedaco in chave:
            return nome
    return extractor or "desconhecida"


# ----------------------------------------------------------------------
# Download (só o áudio)
# ----------------------------------------------------------------------

def baixar_audio(link, pasta_tmp, config, avisar=print):
    """
    Baixa só a trilha de áudio do vídeo. Quando a plataforma não oferece
    áudio separado (comum no TikTok), baixa o arquivo menor com áudio —
    a transcrição usa apenas a trilha sonora de qualquer forma.

    Devolve (caminho_do_audio, metadados).
    """
    import yt_dlp

    opcoes_base = {
        "format": "bestaudio/best",
        "outtmpl": str(Path(pasta_tmp) / "audio.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
    }

    def tentar(opcoes):
        with yt_dlp.YoutubeDL(opcoes) as ydl:
            info = ydl.extract_info(link, download=True)
            if "entries" in info:  # se vier uma lista, usa o primeiro item
                info = info["entries"][0]
            return info

    try:
        info = tentar(opcoes_base)
    except yt_dlp.utils.DownloadError as erro:
        mensagem = str(erro).lower()
        if any(sinal in mensagem for sinal in SINAIS_DE_LOGIN):
            navegador = config.get("NAVEGADOR", "chrome").lower()
            avisar(f"   Este vídeo pede login. Tentando de novo com os cookies do {navegador.capitalize()}...")
            opcoes = dict(opcoes_base)
            opcoes["cookiesfrombrowser"] = (navegador,)
            info = tentar(opcoes)
        else:
            raise

    arquivos = sorted(Path(pasta_tmp).glob("audio.*"))
    if not arquivos:
        raise RuntimeError("O download terminou mas o arquivo de áudio não foi encontrado.")

    metadados = {
        "autor": info.get("uploader") or info.get("channel") or info.get("uploader_id") or "desconhecido",
        "plataforma": nome_plataforma(info.get("extractor_key") or info.get("extractor")),
        "link": info.get("webpage_url") or link,
        "duracao": info.get("duration"),
        "titulo": info.get("title") or "",
        "id_video": info.get("id") or "sem-id",
    }
    return arquivos[0], metadados


# ----------------------------------------------------------------------
# Transcrição (100% local)
# ----------------------------------------------------------------------

_modelo_carregado = None
_nome_modelo_carregado = None


def obter_modelo(nome_modelo, avisar=print):
    """Carrega o modelo uma vez só e reaproveita nas próximas transcrições."""
    global _modelo_carregado, _nome_modelo_carregado
    if _modelo_carregado is None or _nome_modelo_carregado != nome_modelo:
        from faster_whisper import WhisperModel
        avisar(f"   Carregando o modelo de transcrição '{nome_modelo}' "
               "(na primeira vez ele é baixado, ~500 MB; depois fica guardado)...")
        _modelo_carregado = WhisperModel(nome_modelo, device="cpu", compute_type="int8")
        _nome_modelo_carregado = nome_modelo
    return _modelo_carregado


def transcrever_audio(caminho_audio, nome_modelo, avisar=print):
    """
    Transcreve o áudio localmente, detectando o idioma sozinho.
    Devolve (codigo_idioma, confianca, lista_de_trechos).
    Cada trecho é (inicio_em_segundos, texto).
    """
    modelo = obter_modelo(nome_modelo, avisar)
    segmentos, info = modelo.transcribe(str(caminho_audio), language=None, vad_filter=True)
    trechos = [(s.start, s.text.strip()) for s in segmentos if s.text.strip()]
    return info.language, info.language_probability, trechos


# ----------------------------------------------------------------------
# Arquivo de saída
# ----------------------------------------------------------------------

def caminho_saida(metadados, pasta):
    nome = f"{metadados['plataforma']} - {limpar_nome(metadados['autor'])} - {limpar_nome(metadados['id_video'], 30)}.txt"
    return Path(pasta) / nome


def montar_texto(metadados, idioma, confianca, trechos):
    corrida = " ".join(texto for _, texto in trechos) or "(nenhuma fala detectada no áudio)"
    com_tempo = "\n".join(f"[{formatar_tempo(inicio)}] {texto}" for inicio, texto in trechos) \
        or "(nenhuma fala detectada no áudio)"

    linhas = [
        "=" * 60,
        "TRANSCRIÇÃO DE VÍDEO",
        "=" * 60,
        f"Autor:         {metadados['autor']}",
        f"Plataforma:    {metadados['plataforma']}",
        f"Link:          {metadados['link']}",
        f"Duração:       {formatar_duracao(metadados['duracao'])}",
        f"Idioma:        {nome_idioma(idioma)} (confiança de {confianca:.0%})",
        f"Transcrito em: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
    ]
    if metadados.get("titulo"):
        linhas.append(f"Título:        {metadados['titulo']}")
    linhas += [
        "=" * 60,
        "",
        "TRANSCRIÇÃO CORRIDA",
        "-" * 60,
        corrida,
        "",
        "COM MARCAÇÃO DE TEMPO",
        "-" * 60,
        com_tempo,
        "",
    ]
    return "\n".join(linhas)


# ----------------------------------------------------------------------
# Fluxo completo de um link
# ----------------------------------------------------------------------

def processar_link(link, avisar=print, config=None):
    """
    Faz o ciclo completo de um link: baixa o áudio, transcreve e salva.
    Devolve o caminho do arquivo salvo, ou None se já existia (não sobrescreve).
    """
    config = config or carregar_config()
    pasta = pasta_saida(config)

    avisar(f"▶ {link}")
    with tempfile.TemporaryDirectory() as pasta_tmp:
        avisar("   Baixando só o áudio...")
        caminho_audio, metadados = baixar_audio(link, pasta_tmp, config, avisar)

        destino = caminho_saida(metadados, pasta)
        if destino.exists():
            avisar(f"   ⚠ JÁ TRANSCRITO ANTES — mantendo o arquivo existente, nada foi sobrescrito:")
            avisar(f"     {destino}")
            return None

        avisar("   Transcrevendo aqui na sua máquina (nada é enviado para fora)...")
        idioma, confianca, trechos = transcrever_audio(
            caminho_audio, config.get("MODELO", "small"), avisar
        )
        avisar(f"   🌐 Idioma detectado: {nome_idioma(idioma)} (confiança de {confianca:.0%})")

        destino.write_text(montar_texto(metadados, idioma, confianca, trechos), encoding="utf-8")
        avisar(f"   ✔ Salvo em: {destino}")
        return destino


def processar_varios(texto_com_links, avisar=print):
    """Processa todos os links de um texto. Devolve (salvos, pulados, erros)."""
    links = extrair_links(texto_com_links)
    if not links:
        avisar("Nenhum link encontrado no texto colado.")
        return [], [], []

    config = carregar_config()
    salvos, pulados, erros = [], [], []
    for i, link in enumerate(links, 1):
        avisar(f"\n[{i} de {len(links)}]")
        try:
            resultado = processar_link(link, avisar, config)
            (salvos if resultado else pulados).append(link)
        except Exception as erro:
            mensagem = str(erro).strip().splitlines()[-1] if str(erro).strip() else repr(erro)
            avisar(f"   ✖ Erro neste vídeo: {mensagem}")
            erros.append((link, mensagem))

    avisar("\n" + "=" * 60)
    avisar(f"Concluído: {len(salvos)} transcrito(s), {len(pulados)} já existia(m), {len(erros)} erro(s).")
    avisar(f"Pasta das transcrições: {pasta_saida(config)}")
    return salvos, pulados, erros


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python transcritor.py <link1> <link2> ...")
        sys.exit(1)
    processar_varios(" ".join(sys.argv[1:]))
