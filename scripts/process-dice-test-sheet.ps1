param(
    [string]$CleanSixSheet = "art/v2-style/dice-test/source/dice-sheet-clean-six.jpg",
    [string]$CleanOneSheet = "art/v2-style/dice-test/source/dice-sheet-clean-one.jpg",
    [string]$OutputDirectory = "art/v2-style/dice-test/frames"
)

$ErrorActionPreference = "Stop"

$sourceCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public static class DiceTestSheetProcessor
{
    private static Rectangle Cell(int row, int column)
    {
        int[] xs = { 0, 213, 426, 640, 853, 1066, 1280 };
        int[] ys = { 0, 233, 466, 698 };
        return Rectangle.FromLTRB(xs[column], ys[row], xs[column + 1], ys[row + 1]);
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell)
    {
        var cut = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(cut))
        {
            g.DrawImage(source, new Rectangle(0, 0, cut.Width, cut.Height), cell, GraphicsUnit.Pixel);
        }

        int minX = cut.Width, minY = cut.Height, maxX = -1, maxY = -1;
        for (int y = 0; y < cut.Height; y++)
        for (int x = 0; x < cut.Width; x++)
        {
            Color color = cut.GetPixel(x, y);
            int magentaDistance = Math.Min(color.R - color.G, color.B - color.G);
            int alpha = 255;
            if (color.R > 20 && color.B > 20 && magentaDistance >= 4)
            {
                alpha = magentaDistance >= 10
                    ? 0
                    : Math.Max(0, Math.Min(255, (10 - magentaDistance) * 42));
            }

            if (alpha == 0)
            {
                cut.SetPixel(x, y, Color.Transparent);
                continue;
            }

            if (alpha < 255)
            {
                int red = Math.Min(color.R, color.G + 4);
                int blue = Math.Min(color.B, color.G + 4);
                cut.SetPixel(x, y, Color.FromArgb(alpha, red, color.G, blue));
            }

            if (alpha > 18)
            {
                minX = Math.Min(minX, x);
                minY = Math.Min(minY, y);
                maxX = Math.Max(maxX, x);
                maxY = Math.Max(maxY, y);
            }
        }

        if (maxX < minX || maxY < minY)
            throw new InvalidOperationException("No foreground was found in a dice cell.");

        const int padding = 5;
        minX = Math.Max(0, minX - padding);
        minY = Math.Max(0, minY - padding);
        maxX = Math.Min(cut.Width - 1, maxX + padding);
        maxY = Math.Min(cut.Height - 1, maxY + padding);
        var trimmed = cut.Clone(Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1), PixelFormat.Format32bppArgb);
        cut.Dispose();

        var canvas = new Bitmap(256, 256, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(canvas))
        {
            g.Clear(Color.Transparent);
            g.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
            int x = (canvas.Width - trimmed.Width) / 2;
            int y = (canvas.Height - trimmed.Height) / 2;
            g.DrawImageUnscaled(trimmed, x, y);
        }
        trimmed.Dispose();
        return canvas;
    }

    private static void SaveCell(Bitmap source, int row, int column, string outputPath)
    {
        using (var frame = Extract(source, Cell(row, column)))
            frame.Save(outputPath, ImageFormat.Png);
    }

    public static void Process(string cleanSixPath, string cleanOnePath, string outputDirectory)
    {
        Directory.CreateDirectory(outputDirectory);
        using (var cleanSix = new Bitmap(cleanSixPath))
        using (var cleanOne = new Bitmap(cleanOnePath))
        {
            for (int index = 0; index < 12; index++)
            {
                SaveCell(cleanOne, index / 6, index % 6,
                    Path.Combine(outputDirectory, "roll-" + (index + 1).ToString("00") + ".png"));
            }

            // Result 1 is clean only on sheet 2; result 6 is clean only on sheet 1.
            SaveCell(cleanOne, 2, 0, Path.Combine(outputDirectory, "result-01.png"));
            for (int value = 2; value <= 5; value++)
                SaveCell(cleanOne, 2, value - 1, Path.Combine(outputDirectory, "result-" + value.ToString("00") + ".png"));
            SaveCell(cleanSix, 2, 0, Path.Combine(outputDirectory, "result-06.png"));
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
$six = (Resolve-Path -LiteralPath $CleanSixSheet).Path
$one = (Resolve-Path -LiteralPath $CleanOneSheet).Path
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$output = (Resolve-Path -LiteralPath $OutputDirectory).Path
[DiceTestSheetProcessor]::Process($six, $one, $output)
Write-Output "Processed 12 rolling frames and 6 clean result faces."
