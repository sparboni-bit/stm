Write-Host ""
Write-Host "========================================"
Write-Host " Picklers Project Inventory Export"
Write-Host "========================================"
Write-Host ""

$exclude = @(
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "coverage",
    "dist",
    "build"
)

$files = Get-ChildItem -Recurse -File | Where-Object {
    $path = $_.FullName
    foreach ($e in $exclude) {
        if ($path -match "\\$e\\") { return $false }
    }
    return $true
}

$files |
    Sort-Object FullName |
    Select-Object @{
        Name="Path"
        Expression={
            $_.FullName.Replace((Get-Location).Path + "\", "")
        }
    },
    Length,
    LastWriteTime |
    Export-Csv project_inventory.csv -NoTypeInformation -Encoding UTF8

$files |
    Sort-Object FullName |
    ForEach-Object {
        $_.FullName.Replace((Get-Location).Path + "\", "")
    } |
    Out-File project_inventory.txt -Encoding UTF8

tree /F /A > project_tree.txt

Write-Host ""
Write-Host "Files generated:"
Write-Host ""
Write-Host "project_inventory.csv"
Write-Host "project_inventory.txt"
Write-Host "project_tree.txt"
Write-Host ""