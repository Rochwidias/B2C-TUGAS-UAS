$ErrorActionPreference = "Stop"
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$src = "D:\Project\B2C-TUGAS-UAS\tugas-uts\Makalah-CraftAI-Studio-Kelompok-10-UTS-SI134.docx"
$pdf = "D:\Project\B2C-TUGAS-UAS\tugas-uts\_build\makalah_preview.pdf"
$d = $w.Documents.Open($src, $false, $true)
$pages = $d.ComputeStatistics(2)
$words = $d.ComputeStatistics(0)
Write-Output "PAGES=$pages"
Write-Output "WORDS=$words"
$d.SaveAs2($pdf, 17)
$d.Close($false)
$w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null