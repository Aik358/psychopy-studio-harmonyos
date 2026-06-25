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
    # fallback: search PATH for hvigorw
    $hvigorPath = Get-Command "hvigorw" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($hvigorPath) { $devecoHome = (Get-Item $hvigorPath).Directory.Parent.Parent.FullName }
}
if (-not $devecoHome) {
    Write-Host "ERROR: Cannot find DevEco Studio (checked: $($candidates -join ', '))" -ForegroundColor Red
    Write-Host "Set `$devecoHome at the top of this script or pass -devecoHome <path>" -ForegroundColor Yellow
    exit 1
}

$nodeBin = "$devecoHome\tools\node"
Write-Host "DevEco Studio found at: $devecoHome" -ForegroundColor Green

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
