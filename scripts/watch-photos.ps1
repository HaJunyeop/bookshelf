$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$photos=Join-Path $root 'Photos'
$watcher=[IO.FileSystemWatcher]::new($photos)
$watcher.Filter='*.*';$watcher.EnableRaisingEvents=$true
Write-Host 'Watching Photos. Keep this window open for automatic updates.'
$action={ Start-Sleep -Seconds 3; powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $using:PSScriptRoot 'sync-bookshelf.ps1') }
$job=Register-ObjectEvent $watcher Created -Action $action
try { while($true){ Wait-Event -Timeout 5 | Out-Null } }
finally { Unregister-Event -SourceIdentifier $job.Name -ErrorAction SilentlyContinue; $watcher.Dispose() }
