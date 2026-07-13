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

$nodeBin = "D:\qclaw\v0.2.29.592\resources\node"
Write-Host "DevEco Studio found at: $devecoHome" -ForegroundColor Green

# ---- Auto-detect SDK path ----
$sdkCandidates = @(
    "$devecoHome\sdk\default",
    "$devecoHome\sdk\default\openharmony",
    "$env:USERPROFILE\AppData\Local\Huawei\Sdk"
)
$sdkHome = $null
foreach ($s in $sdkCandidates) {
    if (Test-Path "$s\openharmony\ets\oh-uni-package.json") { $sdkHome = $s; break }
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

# ---- [1/2] Build frontend (SKIPPED — already done manually) ----
Write-Host "`n=== [1/2] Building frontend (SKIPPED — already done) ===" -ForegroundColor Cyan

# ---- [1b/2] Copy PsychoJS lib to dist/psychojs-browser/lib/ (SKIPPED — already done) ----
Write-Host ">> Copying PsychoJS lib (SKIPPED — already done)" -ForegroundColor Yellow

# ---- [2/2] Build HAP ----
Write-Host "`n=== [2/2] Building HAP (hvigor) ===" -ForegroundColor Cyan
Set-Location -LiteralPath $ProjectRoot
& "$nodeBin\node.exe" "$devecoHome\tools\hvigor\bin\hvigorw.js" @args

exit $LASTEXITCODE
