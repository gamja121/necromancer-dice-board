param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [string]$PreviewPath
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$sourceCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class CerberusSheetProcessor
{
    private static Color RemoveMagenta(Color c)
    {
        int excess = Math.Min(c.R, c.B) - c.G;
        if (c.R >= 58 && c.B >= 54 && excess >= 14)
        {
            if (excess >= 34) return Color.Transparent;
            int alpha = (int)Math.Round(255.0 * (34 - excess) / 20.0);
            int neutral = Math.Max(c.G, Math.Min(c.R, c.B) / 3) + 10;
            return Color.FromArgb(alpha, Math.Min(c.R, neutral), c.G, Math.Min(c.B, neutral));
        }
        return c;
    }
    public static void Process(string input, string output, string previewPath)
    {
        System.IO.Directory.CreateDirectory(output);
        // Bounds follow the source's unequal panel widths, never an equal-width grid.
        int[][] edges = { new [] {120, 345, 573, 802, 1031, 1255},
                          new [] {120, 345, 573, 802, 1031},
                          new [] {120, 307, 497, 687, 877, 1068, 1255} };
        int[] tops = {17, 252, 493}, bottoms = {241, 476, 692};
        string[] motions = {"attack", "hit", "death"};
        const int width = 260, height = 250;
        using (var source = new Bitmap(input))
        using (var preview = new Bitmap(width * 6, height * 3))
        using (var pg = Graphics.FromImage(preview))
        using (var font = new Font(FontFamily.GenericSansSerif, 12))
        {
            if (source.Width != 1280 || source.Height != 714)
                throw new InvalidOperationException("Expected the original 1280x714 Cerberus sheet.");
            pg.Clear(Color.FromArgb(45, 48, 51));
            for (int row = 0; row < 3; row++)
            for (int index = 0; index < edges[row].Length - 1; index++)
            {
                int cellWidth = edges[row][index + 1] - edges[row][index];
                int cellHeight = bottoms[row] - tops[row];
                using (var cut = new Bitmap(cellWidth, cellHeight, PixelFormat.Format32bppArgb))
                using (var frame = new Bitmap(width, height, PixelFormat.Format32bppArgb))
                {
                    int left = cellWidth, right = -1, top = cellHeight, bottom = -1;
                    for (int y = 0; y < cellHeight; y++)
                    for (int x = 0; x < cellWidth; x++)
                    {
                        int sx = edges[row][index] + x, sy = tops[row] + y;
                        // Final panel's sparkle/particles are above the skulls, not body art.
                        Color c = row == 2 && index == 5 && sy < 610
                            ? Color.Transparent : RemoveMagenta(source.GetPixel(sx, sy));
                        cut.SetPixel(x, y, c);
                        if (c.A <= 8) continue;
                        left = Math.Min(left, x); right = Math.Max(right, x);
                        top = Math.Min(top, y); bottom = Math.Max(bottom, y);
                    }
                    if (right < left || bottom < top) throw new Exception("Empty frame");
                    if (left == 0 || right == cellWidth - 1 || top == 0 || bottom == cellHeight - 1)
                        throw new Exception("Foreground touches crop boundary: " + motions[row] + index);
                    int fw = right - left + 1, fh = bottom - top + 1;
                    if (fw > width - 12 || fh > height - 12) throw new Exception("Frame exceeds canvas");
                    using (var fg = Graphics.FromImage(frame))
                    using (var trimmed = cut.Clone(new Rectangle(left, top, fw, fh), PixelFormat.Format32bppArgb))
                        fg.DrawImageUnscaled(trimmed, (width - fw) / 2, height - fh - 10);
                    string name = motions[row] + "-" + (index + 1).ToString("00");
                    frame.Save(System.IO.Path.Combine(output, name + ".png"), ImageFormat.Png);
                    pg.DrawImageUnscaled(frame, index * width, row * height);
                    pg.DrawString(name, font, Brushes.White, index * width + 8, row * height + 5);
                    Console.WriteLine(name + ": " + fw + "x" + fh + " on 260x250 transparent canvas");
                }
            }
            if (!String.IsNullOrEmpty(previewPath)) preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
"@
Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[CerberusSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory, $PreviewPath)
