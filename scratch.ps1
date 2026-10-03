$content = Get-Content -Raw "frontend/app.js"
$content = $content -replace 'window\.sessionService\.login\(\{ name: "Anu", email: email \}\);', 'window.sessionService.login({ name: "Anu", email: email }, true);'
Set-Content -Path "frontend/app.js" -Value $content -NoNewline
