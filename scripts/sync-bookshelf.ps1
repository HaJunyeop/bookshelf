param([switch]$SkipOcr, [switch]$Publish)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$catalog=Join-Path $root 'web\public\data\books.json'
$ocr=Join-Path $root 'data\ocr-results.json'
if(-not $SkipOcr){ powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'ocr-photos.ps1') }

$parsed=Get-Content -Raw -Encoding UTF8 $catalog | ConvertFrom-Json
if($parsed.Count -ge 1 -and $parsed[0].PSObject.Properties.Name -contains 'value'){$parsed=$parsed[0].value}
$books=[System.Collections.ArrayList]::new(); foreach($item in $parsed){[void]$books.Add($item)}
$seen=@{}; $books | ForEach-Object { if($_.sourcePhoto){$seen[$_.sourcePhoto]=$true} }
$next=if($books.Count){($books.id | Measure-Object -Maximum).Maximum+1}else{1}
if(Test-Path $ocr){
  $ocrParsed=Get-Content -Raw -Encoding UTF8 $ocr | ConvertFrom-Json
  foreach($ocrItem in $ocrParsed){
    $_=$ocrItem
    if(-not $seen.ContainsKey($_.file)){
      $hint=($_.lines | Where-Object { $_.Length -ge 3 -and $_.Length -le 50 } | Select-Object -First 1)
      if(-not $hint){$hint='Review photo title'}
      [void]$books.Add([pscustomobject]@{id=$next;title=$hint;author='Unknown';publisher='Unknown';year=$null;genre='Unsorted';language='Korean';shelf='New photo';confidence='Review';color='#c6b9a8';rating=0;hidden=$false;sourcePhoto=$_.file})
      $next++
    }
  }
}
$books | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $catalog

$vault=Join-Path $root 'ObsidianVault'; $notes=Join-Path $vault 'Books'
New-Item -ItemType Directory -Force -Path $notes | Out-Null
foreach($b in $books){
  $safe=($b.title -replace '[\\/:*?"<>|]','_' -replace '\.$','').Trim(); if(-not $safe){$safe="book-$($b.id)"}; if($safe.Length -gt 70){$safe=$safe.Substring(0,70)}; $safe="$($b.id.ToString('000'))-$safe"
  $md=@"
---
id: $($b.id)
title: "$($b.title -replace '"','\"')"
author: "$($b.author -replace '"','\"')"
publisher: "$($b.publisher -replace '"','\"')"
year: $($b.year)
genre: "$($b.genre)"
language: "$($b.language)"
shelf: "$($b.shelf)"
rating: $($b.rating)
hidden: $($b.hidden.ToString().ToLower())
status: "$($b.confidence)"
source_photo: "$($b.sourcePhoto)"
---

# $($b.title)

- 저자: $($b.author)
- 출판사: $($b.publisher)
- 장르: $($b.genre)
- 책장: $($b.shelf)
"@
  Set-Content -Encoding UTF8 -LiteralPath (Join-Path $notes "$safe.md") -Value $md
}

$dashboard=@'
# My Bookshelf

Use the web view for ratings, hidden books, search, and the relationship map.

## Library

```dataview
TABLE author, publisher, year, genre, rating
FROM "Books"
WHERE hidden = false
SORT title ASC
```

## Hidden books

```dataview
TABLE author, genre, rating
FROM "Books"
WHERE hidden = true
SORT title ASC
```

## Needs review

```dataview
TABLE author, source_photo
FROM "Books"
WHERE status = "Review" OR status = "검토 필요"
```
'@
Set-Content -Encoding UTF8 -LiteralPath (Join-Path $vault 'My Bookshelf.md') -Value $dashboard
Write-Host "Updated $($books.Count) books and the Obsidian vault."

if($Publish){
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'publish-bookshelf.ps1')
  if($LASTEXITCODE -ne 0){ throw 'The public website update failed.' }
}
