param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [string]$UnitName = "death-knight"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class GreenAnimationProcessor
{
    private static Color RemoveGreen(Color c)
    {
        int other = Math.Max(c.R, c.B);
        int excess = c.G - other;
        if (c.G >= 65 && excess >= 28)
        {
            if (excess >= 48) return Color.Transparent;
            int alpha = (int)Math.Round(255.0 * (48 - excess) / 20.0);
            alpha = Math.Max(0, Math.Min(255, alpha));
            int green = Math.Min(c.G, other + 8);
            return Color.FromArgb(alpha, c.R, green, c.B);
        }
        return c;
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color output = RemoveGreen(source.GetPixel(cell.X + x, cell.Y + y));
                keyed.SetPixel(x, y, output);
                if (output.A > 8)
                {
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }

            if (right < left || bottom < top)
                throw new InvalidOperationException("No foreground in " + cell);

            const int cropPadding = 3;
            left = Math.Max(0, left - cropPadding); top = Math.Max(0, top - cropPadding);
            right = Math.Min(cell.Width - 1, right + cropPadding);
            bottom = Math.Min(cell.Height - 1, bottom + cropPadding);
            Rectangle bounds = Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
            using (var cropped = keyed.Clone(bounds, PixelFormat.Format32bppArgb))
            {
                const int safeBorder = 12;
                var output = new Bitmap(cropped.Width + safeBorder * 2, cropped.Height + safeBorder * 2, PixelFormat.Format32bppArgb);
                using (var g = Graphics.FromImage(output))
                {
                    g.Clear(Color.Transparent);
                    g.CompositingMode = CompositingMode.SourceCopy;
                    g.DrawImageUnscaled(cropped, safeBorder, safeBorder);
                }
                return output;
            }
        }
    }

    public static string[] Process(string inputPath, string outputDirectory)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        var outputs = new List<string>();
        using (var source = new Bitmap(inputPath))
        {
            int[][] xBounds = {
                new int[] { 2, 240, 480, 777, 1042, 1278 },
                new int[] { 2, 240, 479, 713, 943 },
                new int[] { 2, 214, 428, 640, 854, 1066, 1278 }
            };
            int[] tops = { 2, 236, 464 };
            int[] bottoms = { 230, 458, 658 };
            string[] names = { "attack", "hit", "death" };
            int[] counts = { 5, 4, 6 };

            for (int row = 0; row < 3; row++)
            for (int frame = 0; frame < counts[row]; frame++)
            {
                int left = xBounds[row][frame] + 2;
                int right = xBounds[row][frame + 1] - 2;
                Rectangle cell = Rectangle.FromLTRB(left, tops[row], right, bottoms[row]);
                using (var output = Extract(source, cell))
                {
                    string path = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png");
                    output.Save(path, ImageFormat.Png);
                    outputs.Add(path);
                }
            }
        }
        return outputs.ToArray();
    }

    public static void CreatePreview(string[] paths, string unitName, string previewPath)
    {
        const int columns = 6, cellWidth = 280, cellHeight = 250, headerHeight = 64;
        int[] counts = { 5, 4, 6 };
        string[] labels = { "ATTACK", "HIT", "DEATH" };
        using (var preview = new Bitmap(columns * cellWidth, headerHeight + 3 * cellHeight, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(preview))
        using (var title = new Font("Malgun Gothic", 22, FontStyle.Bold))
        using (var label = new Font("Malgun Gothic", 14, FontStyle.Bold))
        using (var brush = new SolidBrush(Color.FromArgb(238, 234, 220)))
        using (var pen = new Pen(Color.FromArgb(94, 98, 88), 2))
        {
            g.Clear(Color.FromArgb(25, 28, 26));
            g.DrawString(unitName + " / GREEN SCREEN REVIEW", title, brush, 20, 14);
            int index = 0;
            for (int row = 0; row < 3; row++)
            for (int col = 0; col < counts[row]; col++, index++)
            {
                int x = col * cellWidth, y = headerHeight + row * cellHeight;
                g.DrawRectangle(pen, x + 4, y + 4, cellWidth - 8, cellHeight - 8);
                g.DrawString(labels[row] + " " + (col + 1), label, brush, x + 12, y + 10);
                using (var frame = new Bitmap(paths[index]))
                {
                    int aw = cellWidth - 24, ah = cellHeight - 48;
                    double scale = Math.Min(1.0, Math.Min((double)aw / frame.Width, (double)ah / frame.Height));
                    int dw = (int)Math.Round(frame.Width * scale), dh = (int)Math.Round(frame.Height * scale);
                    g.DrawImage(frame, new Rectangle(x + (cellWidth - dw) / 2, y + cellHeight - 10 - dh, dw, dh));
                }
            }
            preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$paths = [GreenAnimationProcessor]::Process($resolvedInput, $resolvedOutput)
$preview = Join-Path $resolvedOutput ($UnitName + "-preview.png")
[GreenAnimationProcessor]::CreatePreview($paths, $UnitName, $preview)
Write-Output ("Processed: {0}" -f $UnitName)
Write-Output ("Frames: {0}" -f $paths.Count)
Write-Output ("Preview: {0}" -f $preview)
