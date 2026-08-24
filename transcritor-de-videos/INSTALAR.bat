@echo off
rem ============================================================
rem  Instalador do Transcritor de Videos (Windows 10/11)
rem  Basta dar dois cliques neste arquivo.
rem ============================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Instalador do Transcritor de Videos

echo.
echo  ============================================
echo   Instalador do Transcritor de Videos
echo  ============================================
echo.
echo  Este instalador vai:
echo   1. Verificar/instalar o Python (gratuito, da python.org)
echo   2. Instalar as pecas da ferramenta (yt-dlp e faster-whisper)
echo   3. Criar um atalho "Transcritor de Videos" na sua Area de Trabalho
echo.
echo  Nada e enviado para fora do seu computador durante o uso.
echo.
pause

rem ---------- 1. Encontrar ou instalar o Python ----------
set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE where python >nul 2>nul && set "PYEXE=python"

if not defined PYEXE (
    echo.
    echo  Python nao encontrado. Instalando automaticamente via winget...
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    rem O PATH so atualiza em janelas novas; procura direto na pasta padrao:
    for /d %%D in ("%LocalAppData%\Programs\Python\Python3*") do set "PYEXE=%%D\python.exe"
    if not defined PYEXE (
        echo.
        echo  Nao consegui instalar o Python sozinho.
        echo  Abra este endereco, baixe e instale o Python marcando a opcao
        echo  "Add python.exe to PATH", e depois rode este INSTALAR.bat de novo:
        echo.
        echo      https://www.python.org/downloads/
        echo.
        start https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

echo.
echo  Python encontrado. Preparando o ambiente da ferramenta...

rem ---------- 2. Ambiente isolado + dependencias ----------
%PYEXE% -m venv .venv
if errorlevel 1 (
    echo  Erro ao criar o ambiente. Feche esta janela e rode o INSTALAR.bat de novo.
    pause
    exit /b 1
)

echo  Baixando as pecas da ferramenta (pode levar alguns minutos)...
".venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
".venv\Scripts\python.exe" -m pip install yt-dlp faster-whisper --quiet
if errorlevel 1 (
    echo  Erro ao baixar as dependencias. Verifique sua internet e rode de novo.
    pause
    exit /b 1
)

rem ---------- 3. Atalho na Area de Trabalho ----------
powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Transcritor de Videos.lnk');" ^
  "$s.TargetPath='%~dp0.venv\Scripts\pythonw.exe';" ^
  "$s.Arguments='\"%~dp0janela.py\"';" ^
  "$s.WorkingDirectory='%~dp0';" ^
  "$s.Description='Transcreve videos de Instagram, TikTok e YouTube no seu computador';" ^
  "$s.Save()"

echo.
echo  ============================================
echo   Instalacao concluida!
echo  ============================================
echo.
echo  Um atalho "Transcritor de Videos" foi criado na sua Area de Trabalho.
echo  As transcricoes serao salvas em Documentos\Transcricoes.
echo.
echo  Observacao: na PRIMEIRA transcricao a ferramenta baixa o modelo
echo  de voz (~500 MB) uma unica vez; depois disso tudo roda offline.
echo.
echo  Abrindo a ferramenta agora...
start "" ".venv\Scripts\pythonw.exe" "%~dp0janela.py"
pause
