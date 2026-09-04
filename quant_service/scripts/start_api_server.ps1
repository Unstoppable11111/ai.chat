# 启动 A股量化决策系统 FastAPI 微服务
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

$env:PYTHONIOENCODING = "utf-8"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 启动 A股量化交易决策微服务 (端口 8100)" -ForegroundColor Green
Write-Host " 盘中 5 分钟自动推演服务已挂载" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

python -m uvicorn api.server:app --host 127.0.0.1 --port 8100 --workers 1
