/* Ponte minima entre a pagina e o sistema: so salvar, abrir e o arquivo
   recebido no duplo clique. A pagina nao tem acesso ao Node. */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flexoNativo', {
  salvar: (nome, texto) => ipcRenderer.invoke('salvar', nome, texto),
  abrir: () => ipcRenderer.invoke('abrir'),
  arquivoInicial: () => ipcRenderer.invoke('arquivoInicial')
});
