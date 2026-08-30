param(
    [string]$SourceDirectory = "art/v2-style/map-test/tiles-source",
    [string]$OutputDirectory = "art/v2-style/map-test/tiles",
    [string]$HeroSourcePath = "art/v2-style/map-test/hero-source/necromancer-hero.jpg",
    [string]$HeroOutputPath = "art/v2-style/map-test/hero/necromancer-hero.png"
)

$ErrorActionPreference = "Stop"

$sourceCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public static class MapTileProcessor
{
    public static void Process(string inputPath, string outputPath)
    {
        using (var source = new Bitmap(inputPath))
        using (var transparent = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            int minX = source.Width, minY = source.Height, maxX = -1, maxY = -1;
            for (int y = 0; y < source.Height; y++)
            for (int x = 0; x < source.Width; x++)
            {
                Color color = source.GetPixel(x, y);
                int minimum = Math.Min(color.R, Math.Min(color.G, color.B));
                int maximum = Math.Max(color.R, Math.Max(color.G, color.B));
                int alpha = 255;
                if (minimum > 214 && maximum - minimum < 22)
                    alpha = Math.Max(0, Math.Min(255, (245 - minimum) * 9));

                if (alpha <= 4)
                {
                    transparent.SetPixel(x, y, Color.Transparent);
                    continue;
                }

                transparent.SetPixel(x, y, Color.FromArgb(alpha, color.R, color.G, color.B));
                if (alpha > 20)
                {
                    minX = Math.Min(minX, x);
                    minY = Math.Min(minY, y);
                    maxX = Math.Max(maxX, x);
                    maxY = Math.Max(maxY, y);
                }
            }

            if (maxX < minX || maxY < minY)
                throw new InvalidOperationException("No tile foreground found: " + inputPath);

            const int padding = 6;
            minX = Math.Max(0, minX - padding);
            minY = Math.Max(0, minY - padding);
            maxX = Math.Min(source.Width - 1, maxX + padding);
            maxY = Math.Min(source.Height - 1, maxY + padding);
            using (var trimmed = transparent.Clone(
                Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1),
                PixelFormat.Format32bppArgb))
            {
                trimmed.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$source = (Resolve-Path -LiteralPath $SourceDirectory).Path
$output = (Resolve-Path -LiteralPath $OutputDirectory).Path
$names = @('basic','graveyard','altar','unknown','forest','rest','monster','gem','event','warp')
foreach ($name in $names) {
    [MapTileProcessor]::Process(
        (Join-Path $source ($name + '.jpg')),
        (Join-Path $output ($name + '.png')))
}
$heroSource = (Resolve-Path -LiteralPath $HeroSourcePath).Path
$heroOutputDirectory = Split-Path -Parent $HeroOutputPath
New-Item -ItemType Directory -Force -Path $heroOutputDirectory | Out-Null
$heroOutput = Join-Path (Resolve-Path -LiteralPath $heroOutputDirectory).Path (Split-Path -Leaf $HeroOutputPath)
[MapTileProcessor]::Process($heroSource, $heroOutput)
Write-Output "Processed 10 transparent map tiles and 1 hero token without resizing."
