$root=(Resolve-Path (Join-Path $PSScriptRoot '..\docs')).Path
$prefix='http://localhost:8765/'
$listener=[Net.HttpListener]::new();$listener.Prefixes.Add($prefix);$listener.Start()
Start-Process $prefix
Write-Host 'Bookshelf is open at http://localhost:8765/ . Close this window to stop it.'
try{
  while($listener.IsListening){
    $ctx=$listener.GetContext();$path=$ctx.Request.Url.AbsolutePath.TrimStart('/')
    if(-not $path){$path='index.html'}
    $file=[IO.Path]::GetFullPath((Join-Path $root $path))
    if(-not $file.StartsWith($root) -or -not (Test-Path -LiteralPath $file)){ $ctx.Response.StatusCode=404;$ctx.Response.Close();continue }
    $ext=[IO.Path]::GetExtension($file).ToLowerInvariant();$types=@{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.json'='application/json; charset=utf-8';'.svg'='image/svg+xml'}
    $ctx.Response.ContentType=if($types[$ext]){$types[$ext]}else{'application/octet-stream'}
    $bytes=[IO.File]::ReadAllBytes($file);$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length);$ctx.Response.Close()
  }
}finally{$listener.Stop();$listener.Close()}
