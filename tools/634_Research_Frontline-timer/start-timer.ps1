$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$timerPath = 'tools/634_Research_Frontline-timer/index.html'
$port = 8634
$prefix = "http://127.0.0.1:$port/"

function Get-ContentType {
    param([string]$path)

    switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
        '.html' { 'text/html; charset=utf-8'; break }
        '.css'  { 'text/css; charset=utf-8'; break }
        '.js'   { 'application/javascript; charset=utf-8'; break }
        '.json' { 'application/json; charset=utf-8'; break }
        '.svg'  { 'image/svg+xml'; break }
        '.png'  { 'image/png'; break }
        '.jpg'  { 'image/jpeg'; break }
        '.jpeg' { 'image/jpeg'; break }
        '.gif'  { 'image/gif'; break }
        '.webp' { 'image/webp'; break }
        '.ico'  { 'image/x-icon'; break }
        '.woff' { 'font/woff'; break }
        '.woff2' { 'font/woff2'; break }
        default { 'application/octet-stream' }
    }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start server on $prefix" -ForegroundColor Red
    Write-Host "Another app may already be using port $port." -ForegroundColor Yellow
    throw
}

Write-Host "Serving: $projectRoot"
Write-Host "Open:    $prefix$timerPath"
Write-Host "Press Ctrl+C to stop."
Start-Process "$prefix$timerPath"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))

        if ([string]::IsNullOrWhiteSpace($requestPath)) {
            $requestPath = $timerPath
        }

        $candidatePath = Join-Path $projectRoot ($requestPath -replace '/', '\\')

        try {
            $fullPath = (Resolve-Path -LiteralPath $candidatePath).Path
            if (-not $fullPath.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw 'Forbidden path traversal attempt.'
            }

            if ((Get-Item -LiteralPath $fullPath) -is [System.IO.DirectoryInfo]) {
                $fullPath = Join-Path $fullPath 'index.html'
            }

            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
                $context.Response.ContentType = 'text/plain; charset=utf-8'
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                $context.Response.Close()
                continue
            }

            $content = [IO.File]::ReadAllBytes($fullPath)
            $context.Response.ContentType = Get-ContentType $fullPath
            $context.Response.ContentLength64 = $content.Length
            $context.Response.OutputStream.Write($content, 0, $content.Length)
            $context.Response.StatusCode = 200
            $context.Response.Close()
        } catch {
            $context.Response.StatusCode = 403
            $bytes = [Text.Encoding]::UTF8.GetBytes('403 Forbidden')
            $context.Response.ContentType = 'text/plain; charset=utf-8'
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $context.Response.Close()
        }
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
