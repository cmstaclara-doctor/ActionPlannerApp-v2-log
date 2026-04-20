# ActionPlanner v2.0-log Automated Health Check
# Run every 10 minutes via Windows Task Scheduler

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = "C:\Users\Public\C-Code\Projects\ActionPlanner\health-check.log"

Write-Output "[$timestamp] Health Check Running..." | Tee-Object -FilePath $logFile -Append

# Local
$local = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
$localStatus = if ($local.StatusCode -eq 200 -or $local.StatusCode -eq 302) { "✅" } else { "❌" }

# Cloudflare
$cloudflare = Invoke-WebRequest -Uri "https://toolkit-women-conditions-judicial.trycloudflare.com" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
$cfStatus = if ($cloudflare.StatusCode -eq 200) { "✅" } else { "❌" }

# Codespaces
$codespaces = Invoke-WebRequest -Uri "https://refactored-doodle-4jx99qjgpp5xc7g4r-3002.app.github.dev/" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
$csStatus = if ($codespaces.StatusCode -eq 200 -or $codespaces.StatusCode -eq 302) { "✅" } else { "❌" }

$result = "Local: $localStatus | Cloudflare: $cfStatus | Codespaces: $csStatus"
Write-Output $result | Tee-Object -FilePath $logFile -Append
