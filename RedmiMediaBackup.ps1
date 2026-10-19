#Requires -Version 5.1
$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = Get-Location }

$BackupRoot  = Join-Path $ScriptDir "Redmi_Media_Backup"
$TransferLog = Join-Path $ScriptDir "RedmiMediaBackup_TransferLog.txt"
$FailedLog   = Join-Path $ScriptDir "RedmiMediaBackup_FailedFiles.txt"

$Extensions = @(
    "jpg","jpeg","png","webp","heic","heif","gif","dng",
    "mp4","mov","mkv","avi","3gp","webm","m4v","mts","ts"
)

function Write-Log {
    param([string]$Message, [string]$LogFile)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

Write-Host "`n=== Redmi Media Backup Script ===" -ForegroundColor Cyan
Write-Host "Checking for connected ADB devices..."

$deviceOutput = & adb devices 2>&1
$deviceLines = @()
foreach ($d in $deviceOutput) {
    $ds = "$d".Trim()
    if ($ds -match '^\S+\s+device$') { $deviceLines += $ds }
}

if ($deviceLines.Count -eq 0) {
    Write-Host "`nERROR: No authorized ADB device found." -ForegroundColor Red
    Write-Host "Please connect your device, enable USB debugging, and authorize." -ForegroundColor Yellow
    Write-Host "`nadb devices output:"
    foreach ($d in $deviceOutput) { Write-Host "  $d" }
    exit 1
}

Write-Host "Found $($deviceLines.Count) authorized device(s):" -ForegroundColor Green
foreach ($d in $deviceLines) { Write-Host "  $d" }

# Initialize logs
if (Test-Path $TransferLog) { Remove-Item $TransferLog -Force }
if (Test-Path $FailedLog)   { Remove-Item $FailedLog -Force }
"=== Redmi Media Backup - Transfer Log ===" | Out-File -FilePath $TransferLog -Encoding UTF8
"" | Out-File -FilePath $FailedLog -Encoding UTF8
"=== Redmi Media Backup - Failed Files Log ===" | Out-File -FilePath $FailedLog -Encoding UTF8 -Append

if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    Write-Log "Created backup directory: $BackupRoot" $TransferLog
}

# Build find command for all extensions
$findParts = @()
foreach ($ext in $Extensions) {
    $findParts += "-iname '*.$ext'"
}
$findExpr = "find /storage/emulated/0 -type f (" + ($findParts -join " -o ") + ")"

Write-Host "`nScanning device for media files (may take a while)..." -ForegroundColor Yellow
Write-Log "Running: $findExpr" $TransferLog

$rawOutput = & adb shell "$findExpr" 2>&1

# Filter lines into a proper array
$fileList = @()
foreach ($entry in $rawOutput) {
    $s = "$entry".Trim()
    if ($s -and -not ($s -match '^find:.*Permission denied') -and -not ($s -match '^find:.*No such file') -and $s.Length -gt 1) {
        $fileList += $s
    }
}

Write-Host "Found $($fileList.Count) media files on device." -ForegroundColor Green
Write-Log "Found $($fileList.Count) media files." $TransferLog

if ($fileList.Count -eq 0) {
    Write-Host "`nNo media files found. Exiting." -ForegroundColor Yellow
    exit 0
}

# Pull files
$successCount = 0
$failCount    = 0
$totalBytes   = [long]0
$current      = 0

foreach ($remotePath in $fileList) {
    $current++

    $relativePath = $remotePath -replace '^/storage/emulated/0/', ''

    if (-not $relativePath) {
        Write-Log "SKIP: Could not determine relative path for '$remotePath'" $TransferLog
        $failCount++
        Add-Content -Path $FailedLog -Value $remotePath
        continue
    }

    $localPath = Join-Path $BackupRoot $relativePath

    $destDir = Split-Path $localPath -Parent
    if ($destDir -and -not (Test-Path $destDir)) {
        try {
            New-Item -ItemType Directory -Path $destDir -Force -ErrorAction Stop | Out-Null
        } catch {
            Write-Log "FAIL (mkdir): $relativePath - $($_.Exception.Message)" $TransferLog
            $failCount++
            Add-Content -Path $FailedLog -Value $remotePath
            continue
        }
    }

    # Resume support: skip if already pulled
    if (Test-Path $localPath) {
        $esize = (Get-Item $localPath).Length
        $totalBytes += $esize
        $successCount++
        if ($current % 100 -eq 0) {
            Write-Host "  [$current/$($fileList.Count)] Already exists: $relativePath" -ForegroundColor DarkGray
        }
        continue
    }

    $pct = [math]::Round(($current / $fileList.Count) * 100, 1)
    if ($current % 25 -eq 0 -or $current -eq 1) {
        Write-Host "  [$current/$($fileList.Count)] ($pct%) Pulling: $relativePath" -ForegroundColor White
    }

    $pullResult = & adb pull "$remotePath" "$localPath" 2>&1

    if ($LASTEXITCODE -eq 0 -and (Test-Path $localPath)) {
        $fsize = (Get-Item $localPath).Length
        $totalBytes += $fsize
        $successCount++
    } else {
        $failCount++
        Add-Content -Path $FailedLog -Value $remotePath
        Write-Log "FAIL (pull): $relativePath" $TransferLog
        if (Test-Path $localPath) {
            $psize = (Get-Item $localPath).Length
            if ($psize -lt 10) {
                Remove-Item -Path $localPath -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Summary
$sizeMB   = [math]::Round($totalBytes / 1MB, 2)
$sizeGB   = [math]::Round($totalBytes / 1GB, 2)
$sizeDisp = if ($sizeGB -ge 1) { "$sizeGB GB" } else { "$sizeMB MB" }

Write-Host "`n=== Backup Complete ===" -ForegroundColor Cyan
Write-Host "Files found:    $($fileList.Count)"
Write-Host "Files copied:   $successCount" -ForegroundColor Green
Write-Host "Files failed:   $failCount" -ForegroundColor $(if ($failCount -gt 0) { 'Red' } else { 'Green' })
Write-Host "Total size:     $sizeDisp"
Write-Host "Backup folder:  $BackupRoot"
Write-Host "Transfer log:   $TransferLog"
Write-Host "Failed log:     $FailedLog"

"" | Out-File -FilePath $TransferLog -Append
"=== SUMMARY ===" | Out-File -FilePath $TransferLog -Append
"Files found:    $($fileList.Count)" | Out-File -FilePath $TransferLog -Append
"Files copied:   $successCount" | Out-File -FilePath $TransferLog -Append
"Files failed:   $failCount" | Out-File -FilePath $TransferLog -Append
"Total size:     $sizeDisp" | Out-File -FilePath $TransferLog -Append
Write-Log "Backup operation finished." $TransferLog

if ($failCount -gt 0) {
    Write-Host "`nReview $FailedLog for inaccessible files." -ForegroundColor Yellow
}
