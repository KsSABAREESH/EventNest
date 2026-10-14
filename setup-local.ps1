$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
Set-Location $repoRoot

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
  }
}

function New-LocalSecret {
  $bytes = New-Object byte[] 48
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Set-EnvValue {
  param([string]$Content, [string]$Name, [string]$Value)
  $pattern = "(?m)^$([regex]::Escape($Name))=.*$"
  $line = "$Name=$Value"
  if ([regex]::IsMatch($Content, $pattern)) {
    return [regex]::Replace($Content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $line })
  }
  return "$($Content.TrimEnd())`r`n$line`r`n"
}

function Initialize-EnvFile {
  param([string]$Path, [string]$ExamplePath, [bool]$Backend)

  if (-not (Test-Path -LiteralPath $Path)) {
    Copy-Item -LiteralPath $ExamplePath -Destination $Path
    Write-Host "Created $Path"
  }

  $content = [IO.File]::ReadAllText($Path)
  $generatedAdminPassword = $null
  if ($Backend -and $content -match '(?m)^JWT_SECRET=replace-with-') {
    $content = Set-EnvValue $content 'JWT_SECRET' (New-LocalSecret)
  }
  if ($Backend -and $content -match '(?m)^ADMIN_PASSWORD=change-this-') {
    $generatedAdminPassword = New-LocalSecret
    $content = Set-EnvValue $content 'ADMIN_PASSWORD' $generatedAdminPassword
  }
  [IO.File]::WriteAllText($Path, $content, [System.Text.UTF8Encoding]::new($false))
  return $generatedAdminPassword
}

$node = (node --version 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $node) { throw 'Node.js is required. Install Node.js 20.9 or newer, then run this script again.' }
if ([version]($node.TrimStart('v')) -lt [version]'20.9') { throw "Node.js 20.9 or newer is required. Found $node." }
$npm = (npm.cmd --version 2>$null)
if ($LASTEXITCODE -ne 0 -or [version]$npm -lt [version]'10.0') { throw 'npm 10 or newer is required. Update Node.js/npm, then run this script again.' }

$adminPassword = Initialize-EnvFile (Join-Path $repoRoot 'backend/.env') (Join-Path $repoRoot 'backend/.env.example') $true
$null = Initialize-EnvFile (Join-Path $repoRoot 'frontend/.env.local') (Join-Path $repoRoot 'frontend/.env.example') $false
$backendEnvContent = [IO.File]::ReadAllText((Join-Path $repoRoot 'backend/.env'))
$adminEmailMatch = [regex]::Match($backendEnvContent, '(?m)^ADMIN_EMAIL=(.*)$')
$adminEmail = if ($adminEmailMatch.Success) { $adminEmailMatch.Groups[1].Value.Trim() } else { 'admin@eventnest.local' }

Write-Host 'Installing workspace dependencies...'
Invoke-CheckedCommand 'npm.cmd' @('install')
Write-Host 'Running database migrations...'
try {
  Invoke-CheckedCommand 'npm.cmd' @('run', 'db:migrate')
} catch {
  throw "Database migration failed. Make sure PostgreSQL is running and DATABASE_URL in backend/.env points to the EventNest database. $($_.Exception.Message)"
}
Write-Host 'Loading the 15 sample events...'
Invoke-CheckedCommand 'npm.cmd' @('run', 'db:seed')

Write-Host ''
Write-Host 'Local setup is complete.' -ForegroundColor Green
Write-Host 'Start the frontend and each backend service in four separate terminals from the repository root:'
Write-Host '  npm run dev'
Write-Host '  npm run dev:auth'
Write-Host '  npm run dev:events'
Write-Host '  npm run dev:preferences'
if ($adminPassword) {
  Write-Host ''
  Write-Host 'Local admin login (save this password):' -ForegroundColor Yellow
  Write-Host "  Email:    $adminEmail"
  Write-Host "  Password: $adminPassword"
  Write-Host 'Sign in at http://localhost:3000/admin/login'
} else {
  Write-Host 'Admin credentials are configured in backend/.env; sign in at http://localhost:3000/admin/login'
}
