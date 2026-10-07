# ---------------------------------------------------------------------------
#  Flexo Simples - cria um atalho de aplicativo no Windows
#
#  O atalho abre a ferramenta em modo aplicativo (--app), ou seja, numa janela
#  propria, sem barra de enderecos nem abas: fica com cara de programa.
#  Nada e instalado e nenhum registro do sistema e alterado - o script apenas
#  cria um arquivo .lnk na Area de Trabalho e no Menu Iniciar.
# ---------------------------------------------------------------------------

param(
    # 'classico' (azul) ou 'corporativo' (cinza grafite e amarelo)
    [ValidateSet('classico', 'corporativo')]
    [string]$Tema = 'classico'
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

# --- o que abrir: a copia local, se existir; senao a versao publicada --------
$sufixo = if ($Tema -eq 'corporativo') { '?tema=corporativo' } else { '' }
$paginaLocal = Join-Path $raiz 'index.html'
if (Test-Path $paginaLocal) {
    $alvo = 'file:///' + ($paginaLocal -replace '\\', '/') + $sufixo
    $origem = 'arquivos locais'
} else {
    $alvo = 'https://0bibs.github.io/Flex-o-Simples/' + $sufixo
    $origem = 'versao publicada'
}

# --- qual navegador usar ----------------------------------------------------
function Achar-Navegador {
    $chaves = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe',
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe'
    )
    foreach ($c in $chaves) {
        if (Test-Path $c) {
            $p = (Get-ItemProperty $c).'(default)'
            if ($p -and (Test-Path $p)) { return $p }
        }
    }
    $caminhos = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($p in $caminhos) { if (Test-Path $p) { return $p } }
    return $null
}

$navegador = Achar-Navegador
if (-not $navegador) {
    Write-Host ''
    Write-Host '  Nao encontrei o Chrome nem o Edge.' -ForegroundColor Red
    Write-Host '  Instale um dos dois, ou abra o index.html direto no navegador.'
    Write-Host ''
    exit 1
}

# --- icone ------------------------------------------------------------------
$arqIcone = if ($Tema -eq 'corporativo') { 'flexo-simples-corporativo.ico' }
            else { 'flexo-simples.ico' }
$icone = Join-Path $raiz "icons\$arqIcone"
if (-not (Test-Path $icone)) { $icone = $navegador }

# --- cria os atalhos --------------------------------------------------------
$shell = New-Object -ComObject WScript.Shell
$nome = if ($Tema -eq 'corporativo') { 'Flexo Simples (corporativo)' }
        else { 'Flexo Simples' }
$destinos = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) "$nome.lnk"),
    (Join-Path ([Environment]::GetFolderPath('StartMenu')) "Programs\$nome.lnk")
)

foreach ($destino in $destinos) {
    $pasta = Split-Path -Parent $destino
    if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
    $lnk = $shell.CreateShortcut($destino)
    $lnk.TargetPath = $navegador
    $lnk.Arguments = "--app=`"$alvo`""
    $lnk.IconLocation = $icone
    $lnk.Description = 'Calculo de flexao, cortante e torcao - NBR 6118'
    $lnk.WorkingDirectory = Split-Path -Parent $navegador
    $lnk.Save()
    Write-Host "  criado: $destino" -ForegroundColor Green
}

Write-Host ''
Write-Host '  Pronto.' -ForegroundColor Green
Write-Host "  Tema:      $Tema"
Write-Host "  Navegador: $navegador"
Write-Host "  Abrindo:   $origem"
Write-Host ''
Write-Host '  Para fixar na barra de tarefas, clique com o botao direito no'
Write-Host '  atalho da Area de Trabalho e escolha "Fixar na barra de tarefas".'
Write-Host ''
