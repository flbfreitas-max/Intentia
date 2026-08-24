# -*- coding: utf-8 -*-
"""
Transcritor de Vídeos — janela gráfica.

Cole um ou vários links (Instagram, TikTok, YouTube), clique em
"Transcrever" e acompanhe o andamento. Os arquivos .txt ficam em
Documentos/Transcricoes (ajustável no config.txt).
"""

import queue
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import scrolledtext, ttk

import transcritor

CORES = {
    "fundo": "#1e1e2e",
    "painel": "#2a2a3c",
    "texto": "#e6e6f0",
    "destaque": "#7c6ff0",
    "ok": "#5fd08a",
}


class Janela:
    def __init__(self, raiz):
        self.raiz = raiz
        raiz.title("Transcritor de Vídeos")
        raiz.geometry("760x640")
        raiz.configure(bg=CORES["fundo"])
        raiz.minsize(560, 480)

        self.fila_mensagens = queue.Queue()
        self.trabalhando = False

        tk.Label(
            raiz, text="Transcritor de Vídeos",
            font=("Segoe UI", 16, "bold"), bg=CORES["fundo"], fg=CORES["texto"],
        ).pack(pady=(14, 2))
        tk.Label(
            raiz,
            text="Cole abaixo um ou vários links (Instagram, TikTok ou YouTube) — um por linha ou todos juntos.\n"
                 "Tudo é transcrito aqui na sua máquina; nenhum áudio é enviado para fora.",
            font=("Segoe UI", 10), bg=CORES["fundo"], fg=CORES["texto"], justify="center",
        ).pack(pady=(0, 8))

        self.caixa_links = scrolledtext.ScrolledText(
            raiz, height=6, font=("Consolas", 10),
            bg=CORES["painel"], fg=CORES["texto"], insertbackground=CORES["texto"],
            relief="flat", padx=8, pady=8,
        )
        self.caixa_links.pack(fill="x", padx=16)

        barra = tk.Frame(raiz, bg=CORES["fundo"])
        barra.pack(pady=10)
        self.botao_transcrever = tk.Button(
            barra, text="▶  Transcrever", command=self.iniciar,
            font=("Segoe UI", 11, "bold"), bg=CORES["destaque"], fg="white",
            activebackground="#6a5de0", activeforeground="white",
            relief="flat", padx=18, pady=6, cursor="hand2",
        )
        self.botao_transcrever.pack(side="left", padx=6)
        tk.Button(
            barra, text="📁  Abrir pasta das transcrições", command=self.abrir_pasta,
            font=("Segoe UI", 10), bg=CORES["painel"], fg=CORES["texto"],
            activebackground="#3a3a4e", activeforeground=CORES["texto"],
            relief="flat", padx=14, pady=6, cursor="hand2",
        ).pack(side="left", padx=6)

        self.progresso = ttk.Progressbar(raiz, mode="indeterminate")

        tk.Label(
            raiz, text="Andamento:", font=("Segoe UI", 10, "bold"),
            bg=CORES["fundo"], fg=CORES["texto"], anchor="w",
        ).pack(fill="x", padx=16)
        self.caixa_log = scrolledtext.ScrolledText(
            raiz, font=("Consolas", 9), state="disabled",
            bg=CORES["painel"], fg=CORES["ok"],
            relief="flat", padx=8, pady=8,
        )
        self.caixa_log.pack(fill="both", expand=True, padx=16, pady=(2, 14))

        self.escrever_log(f"Pronto. As transcrições serão salvas em:\n{transcritor.pasta_saida()}\n")
        self.raiz.after(150, self.despachar_mensagens)

    # ---------------- log seguro entre threads ----------------

    def escrever_log(self, texto):
        self.caixa_log.configure(state="normal")
        self.caixa_log.insert("end", texto + "\n")
        self.caixa_log.see("end")
        self.caixa_log.configure(state="disabled")

    def avisar(self, texto):
        """Chamado pela thread de trabalho — só enfileira."""
        self.fila_mensagens.put(str(texto))

    def despachar_mensagens(self):
        try:
            while True:
                self.escrever_log(self.fila_mensagens.get_nowait())
        except queue.Empty:
            pass
        self.raiz.after(150, self.despachar_mensagens)

    # ---------------- ações ----------------

    def iniciar(self):
        if self.trabalhando:
            return
        texto = self.caixa_links.get("1.0", "end").strip()
        links = transcritor.extrair_links(texto)
        if not links:
            self.escrever_log("⚠ Cole pelo menos um link antes de clicar em Transcrever.")
            return
        self.trabalhando = True
        self.botao_transcrever.configure(state="disabled", text="Transcrevendo...")
        self.progresso.pack(fill="x", padx=16, before=self.caixa_log)
        self.progresso.start(12)
        threading.Thread(target=self.trabalhar, args=(texto,), daemon=True).start()

    def trabalhar(self, texto):
        try:
            transcritor.processar_varios(texto, avisar=self.avisar)
        except Exception as erro:
            self.avisar(f"✖ Erro inesperado: {erro}")
        finally:
            self.raiz.after(200, self.finalizar)

    def finalizar(self):
        self.trabalhando = False
        self.botao_transcrever.configure(state="normal", text="▶  Transcrever")
        self.progresso.stop()
        self.progresso.pack_forget()

    def abrir_pasta(self):
        pasta = str(transcritor.pasta_saida())
        if sys.platform == "win32":
            subprocess.Popen(["explorer", pasta])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", pasta])
        else:
            subprocess.Popen(["xdg-open", pasta])


def main():
    raiz = tk.Tk()
    Janela(raiz)
    raiz.mainloop()


if __name__ == "__main__":
    main()
