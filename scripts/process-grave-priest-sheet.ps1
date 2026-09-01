param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public static class GravePriestSheetProcessor
{
    private static Color RemoveMagenta(Color color)
    {
        int baseChannel = Math.Max(color.G, Math.Min(color.R, color.B) / 3);
        int excess = Math.Min(color.R, color.B) - color.G;
        if (color.R >= 58 && color.B >= 54 && excess >= 14)
        {
            if (excess >= 34) return Color.Transparent;
            int alpha = (int)Math.Round(255.0 * (34 - excess) / 20.0);
            alpha = Math.Max(0, Math.Min(255, alpha));
            return Color.FromArgb(alpha, Math.Min(color.R, baseChannel + 10), color.G, Math.Min(color.B, baseChannel + 10));
        }
        return color;
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool removeFinalSparkle)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                int globalX = cell.X + x, globalY = cell.Y + y;
                Color output = removeFinalSparkle && globalX >= 1125 && globalX <= 1245 && globalY <= 510
                    ? Color.Transparent
                    : RemoveMagenta(source.GetPixel(globalX, globalY));
                keyed.SetPixel(x, y, output);
                if (output.A > 8)
                {
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }
            if (right < left || bottom < top) throw new InvalidOperationException("No foreground in " + cell);
            const int padding = 3;
            left = Math.Max(0, left - padding); top = Math.Max(0, top - padding);
            right = Math.Min(cell.Width - 1, right + padding); bottom = Math.Min(cell.Height - 1, bottom + padding);
            return keyed.Clone(Rectangle.FromLTRB(left, top, right + 1, bottom + 1), PixelFormat.Format32bppArgb);
        }
    }

    private static Bitmap PlaceOnCanvas(Bitmap frame)
    {
        const int width = 280, height = 250;
        var canvas = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(canvas))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(frame, (width - frame.Width) / 2, height - frame.Height - 7);
        }
        return canvas;
    }

    public static void Process(string inputPath, string outputDirectory)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle[][] cells = {
            new Rectangle[] {
                Rectangle.FromLTRB(100, 5, 300, 198), Rectangle.FromLTRB(305, 3, 512, 198),
                Rectangle.FromLTRB(518, 8, 746, 198), Rectangle.FromLTRB(748, 10, 1002, 198),
                Rectangle.FromLTRB(1035, 8, 1268, 198)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(100, 200, 330, 390), Rectangle.FromLTRB(330, 200, 570, 390),
                Rectangle.FromLTRB(575, 200, 770, 390), Rectangle.FromLTRB(775, 200, 1002, 390)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(100, 390, 300, 576), Rectangle.FromLTRB(305, 390, 500, 576),
                Rectangle.FromLTRB(500, 400, 695, 576), Rectangle.FromLTRB(695, 410, 900, 576),
                Rectangle.FromLTRB(895, 420, 1090, 576), Rectangle.FromLTRB(1090, 405, 1280, 576)
            }
        };
        string[] names = { "attack", "hit", "death" };
        using (var source = new Bitmap(inputPath))
        {
            for (int row = 0; row < cells.Length; row++)
            for (int frameIndex = 0; frameIndex < cells[row].Length; frameIndex++)
            using (var extracted = Extract(source, cells[row][frameIndex], row == 2 && frameIndex == 5))
            using (var normalized = PlaceOnCanvas(extracted))
            {
                string outputPath = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frameIndex + 1).ToString("00") + ".png");
                normalized.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[GravePriestSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory)
Write-Output "Processed grave priest sheet into $OutputDirectory"
