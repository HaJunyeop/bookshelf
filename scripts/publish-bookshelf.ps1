$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$web=Join-Path $root 'web'
$vite=Join-Path $web 'node_modules\.bin\vite.cmd'
$nodeDir=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'

if(-not (Test-Path -LiteralPath $vite)){
  throw 'Website build tools are missing. Open this project in Codex and ask to restore the web dependencies.'
}

$oldPath=$env:PATH
if(Test-Path -LiteralPath (Join-Path $nodeDir 'node.exe')){$env:PATH="$nodeDir;$env:PATH"}
Push-Location $web
try {
  & $vite build --config vite.static.config.ts
  if($LASTEXITCODE -ne 0){ throw 'Website build failed.' }
} finally {
  Pop-Location
  $env:PATH=$oldPath
}

$gitCandidates=@(
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'),
  (Join-Path $env:ProgramFiles 'Git\cmd\git.exe')
)
$git=$gitCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if(-not $git){
  $gitCommand=Get-Command git.exe -ErrorAction SilentlyContinue
  if($gitCommand){$git=$gitCommand.Source}
}
if(-not $git){ throw 'Git is not installed, so the public website could not be updated.' }

$changes=& $git -C $root status --porcelain -- docs web/public/data ObsidianVault
if(-not $changes){
  Write-Host 'The public website is already up to date.'
  exit 0
}

& $git -C $root add -- docs web/public/data ObsidianVault
if($LASTEXITCODE -ne 0){ throw 'Preparing the website update failed.' }
$stamp=Get-Date -Format 'yyyy-MM-dd HH:mm'
& $git -C $root commit -m "update bookshelf $stamp"
if($LASTEXITCODE -ne 0){ throw 'Saving the website update failed.' }
& $git -C $root push origin main
if($LASTEXITCODE -ne 0){ throw 'Uploading the website update failed.' }
Write-Host 'The public website update has been uploaded. GitHub Pages will refresh shortly.'
