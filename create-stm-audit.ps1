$ErrorActionPreference = "Stop"

$root = Get-Location
$outputFolder = Join-Path $root "_stm_audit"
$zipPath = Join-Path $root "stm_audit.zip"

if (Test-Path $outputFolder) {
    Remove-Item $outputFolder -Recurse -Force
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $outputFolder | Out-Null

$pathsToCopy = @(
    "app\competitions",
    "modules\competitions",
    "modules\competition-entries",
    "lib\auth",
    "lib\supabase"
)

foreach ($relativePath in $pathsToCopy) {
    $source = Join-Path $root $relativePath

    if (Test-Path $source) {
        $destination = Join-Path $outputFolder $relativePath
        $destinationParent = Split-Path $destination -Parent

        New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        Copy-Item $source $destination -Recurse -Force
    }
}

$rootFiles = @(
    "proxy.ts",
    "package.json",
    "tsconfig.json",
    "next.config.ts"
)

foreach ($file in $rootFiles) {
    $source = Join-Path $root $file

    if (Test-Path $source) {
        Copy-Item $source (Join-Path $outputFolder $file) -Force
    }
}

tree app\competitions /F /A |
    Out-File (Join-Path $outputFolder "app_competitions_tree.txt") -Encoding utf8

tree modules /F /A |
    Out-File (Join-Path $outputFolder "modules_tree.txt") -Encoding utf8

git status --short |
    Out-File (Join-Path $outputFolder "git_status.txt") -Encoding utf8

git log --oneline -10 |
    Out-File (Join-Path $outputFolder "git_log.txt") -Encoding utf8

Compress-Archive `
    -Path "$outputFolder\*" `
    -DestinationPath $zipPath `
    -Force

Write-Host ""
Write-Host "Audit completato:"
Write-Host $zipPath
Write-Host ""