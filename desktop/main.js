/* ---------------------------------------------------------------------------
   Flexo Simples - aplicativo de desktop (Electron)

   Abre as mesmas paginas da versao web numa janela propria, sem navegador.
   Acrescenta so o que a web nao tem: janelas nativas de salvar/abrir e a
   abertura de arquivos .flexo por duplo clique.
   --------------------------------------------------------------------------- */
'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const FILTROS = [{ name: 'Projeto Flexo Simples', extensions: ['flexo'] },
  { name: 'Todos os arquivos', extensions: ['*'] }];

/* arquivo passado na linha de comando (duplo clique num .flexo); entregue
   uma unica vez, senao reabriria a cada troca de aba */
let arquivoInicial = process.argv.slice(1).find((a) => /\.flexo$/i.test(a)) || null;

function pastaProjetos() {
  const p = path.join(app.getPath('documents'), 'Flexo Simples');
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function ler(caminho) {
  return { caminho, texto: fs.readFileSync(caminho, 'utf8') };
}

ipcMain.handle('salvar', async (ev, nome, texto) => {
  const janela = BrowserWindow.fromWebContents(ev.sender);
  const r = await dialog.showSaveDialog(janela, {
    title: 'Salvar projeto',
    defaultPath: path.join(pastaProjetos(), nome),
    filters: FILTROS
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, texto, 'utf8');
  app.addRecentDocument(r.filePath);
  return r.filePath;
});

ipcMain.handle('abrir', async (ev) => {
  const janela = BrowserWindow.fromWebContents(ev.sender);
  const r = await dialog.showOpenDialog(janela, {
    title: 'Abrir projeto',
    defaultPath: pastaProjetos(),
    filters: FILTROS,
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths.length) return null;
  app.addRecentDocument(r.filePaths[0]);
  return ler(r.filePaths[0]);
});

ipcMain.handle('arquivoInicial', () => {
  const a = arquivoInicial;
  arquivoInicial = null;
  return a && fs.existsSync(a) ? ler(a) : null;
});

let janela = null;

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Flexo Simples',
    icon: path.join(RAIZ, 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  Menu.setApplicationMenu(null);
  janela.loadFile(path.join(RAIZ, 'index.html'));

  /* links externos (http/https) abrem no navegador do sistema */
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  janela.webContents.on('will-navigate', (ev, url) => {
    if (/^https?:/.test(url)) { ev.preventDefault(); shell.openExternal(url); }
  });
}

/* uma instancia so: um segundo duplo clique num .flexo vai para a janela aberta */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (ev, argv) => {
    const arq = argv.slice(1).find((a) => /\.flexo$/i.test(a));
    if (!janela) return;
    if (janela.isMinimized()) janela.restore();
    janela.focus();
    if (arq) { arquivoInicial = arq; janela.reload(); }
  });
  app.whenReady().then(criarJanela);
  app.on('window-all-closed', () => app.quit());
}
