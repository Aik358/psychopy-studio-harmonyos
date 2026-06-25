$FrontendPath = "web_engine\src\main\resources\resfile\resources\app"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== [1/2] Building frontend (vite) ===" -ForegroundColor Cyan
Set-Location -LiteralPath "$ProjectRoot\$FrontendPath"

if (-not (Test-Path "node_modules\.package-lock.json")) {
    Write-Host ">> npm install..." -ForegroundColor Yellow
    & "D:\DevEco Studio\tools\node\npm.cmd" install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& "D:\DevEco Studio\tools\node\npx.cmd" vite build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== [2/2] Building HAP (hvigor) ===" -ForegroundColor Cyan
Set-Location -LiteralPath $ProjectRoot
& "D:\DevEco Studio\tools\node\node.exe" "D:\DevEco Studio\tools\hvigor\bin\hvigorw.js" @args

exit $LASTEXITCODE
