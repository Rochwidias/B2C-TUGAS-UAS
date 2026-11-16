$ErrorActionPreference = "Stop"
$pp = New-Object -ComObject PowerPoint.Application
$src = "D:\Project\B2C-TUGAS-UAS\tugas-uts\Presentasi-CraftAI-Studio-Kelompok-10-UTS-SI134.pptx"
$out = "D:\Project\B2C-TUGAS-UAS\tugas-uts\_build\slides"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null
$pres = $pp.Presentations.Open($src, $true, $false, $false)
Write-Output ("SLIDES=" + $pres.Slides.Count)
foreach ($sl in $pres.Slides) {
  $name = "{0:00}" -f $sl.SlideIndex
  $sl.Export(($out + "\" + $name + ".png"), "PNG", 1280, 720)
}
$pres.Close()
$pp.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null
Write-Output "EXPORT_OK"