@echo off
rem Atalho reserva: abre a ferramenta caso o atalho da Area de Trabalho falhe.
rem So funciona depois de rodar o INSTALAR.bat uma vez.
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
    echo Rode primeiro o INSTALAR.bat (dois cliques nele^).
    pause
    exit /b 1
)
start "" ".venv\Scripts\pythonw.exe" "%~dp0janela.py"
