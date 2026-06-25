$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendPath = "web_engine\src\main\resources\resfile\resources\app"

# ---- Auto-detect DevEco Studio ----
$candidates = @(
    "D:\DevEco Studio",
    "C:\Program Files\Huawei\DevEco Studio",
    "C:\Program Files\DevEco Studio",
    "E:\DevEco Studio"
)
$devecoHome = $null
foreach ($d in $candidates) {
    if (Test-Path "$d\tools\node\node.exe") { $devecoHome = $d; break }
}
if (-not $devecoHome) {
    $hvigorPath = Get-Command "hvigorw" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($hvigorPath) { $devecoHome = (Get-Item $hvigorPath).Directory.Parent.Parent.FullName }
}
if (-not $devecoHome) {
    Write-Host "ERROR: Cannot find DevEco Studio (checked: $($candidates -join ', '))" -ForegroundColor Red
    exit 1
}

$nodeBin = "$devecoHome\tools\node"
Write-Host "DevEco Studio found at: $devecoHome" -ForegroundColor Green

# ---- Auto-detect SDK path ----
$sdkCandidates = @(
    "$devecoHome\sdk\default\openharmony",
    "$env:USERPROFILE\AppData\Local\Huawei\Sdk"
)
$sdkHome = $null
foreach ($s in $sdkCandidates) {
    if (Test-Path "$s\ets\oh-uni-package.json") { $sdkHome = $s; break }
}
if (-not $sdkHome -and $env:DEVECO_SDK_HOME) {
    $sdkHome = $env:DEVECO_SDK_HOME
}
if ($sdkHome) {
    $env:DEVECO_SDK_HOME = $sdkHome
    Write-Host "DEVECO_SDK_HOME set to: $sdkHome" -ForegroundColor Green
} else {
    Write-Host "WARN: DEVECO_SDK_HOME not found, hvigor may fail" -ForegroundColor Yellow
}

# ---- [1/2] Build frontend ----
Write-Host "`n=== [1/2] Building frontend (vite) ===" -ForegroundColor Cyan
Set-Location -LiteralPath "$ProjectRoot\$FrontendPath"

if (-not (Test-Path "node_modules\.package-lock.json")) {
    Write-Host ">> npm install..." -ForegroundColor Yellow
    & "$nodeBin\npm.cmd" install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& "$nodeBin\npx.cmd" vite build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# ---- [2/2] Build HAP ----
Write-Host "`n=== [2/2] Building HAP (hvigor) ===" -ForegroundColor Cyan
Set-Location -LiteralPath $ProjectRoot
& "$nodeBin\node.exe" "$devecoHome\tools\hvigor\bin\hvigorw.js" @args

exit $LASTEXITCODE
