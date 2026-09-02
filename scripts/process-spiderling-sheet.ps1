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
public static class SpiderlingSheetProcessor
{
    private static Color RemoveMagenta(Color c)
    {
        int excess = Math.Min(c.R, c.B) - c.G;
        if (excess > 8)
        {
            // Soft matte preserves narrow legs contaminated by JPEG magenta.
            // Unmix the magenta background instead of deleting dark edge pixels.
            if (excess >= 220) return Color.Transparent;
            double alpha = 1.0 - excess / 255.0;
            int r = (int)Math.Round((c.R - excess) / alpha);
            int g = (int)Math.Round(c.G / alpha);
            int b = (int)Math.Round((c.B - excess) / alpha);
            return Color.FromArgb((int)Math.Round(alpha * 255),
                Math.Max(0, Math.Min(255, r)), Math.Max(0, Math.Min(255, g)), Math.Max(0, Math.Min(255, b)));
        }
        return c;
    }
    public static void Process(string input, string output, string previewPath)
    {
        System.IO.Directory.CreateDirectory(output);
        // Explicit source bounds: attack 1-5, hit 1-4 (hit 5 excluded), death 1-6.
        int[][] edges = { new [] {108, 345, 575, 802, 1034, 1276},
                          new [] {108, 345, 575, 802, 1034},
                          new [] {110, 302, 498, 692, 884, 1076, 1274} };
        int[] tops = {40, 270, 528}, bottoms = {246, 486, 690};
        string[] motions = {"attack", "hit", "death"};
        const int width = 260, height = 250;
        using (var source = new Bitmap(input))
        using (var preview = new Bitmap(width * 6, height * 3))
        using (var pg = Graphics.FromImage(preview))
        using (var font = new Font(FontFamily.GenericSansSerif, 12))
        {
            if (source.Width != 1280 || source.Height != 698)
                throw new InvalidOperationException("Expected the original 1280x698 Spiderling sheet.");
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
                        // Remove only the area above the final remains containing the pink sparkle.
                        Color c = row == 2 && index == 5 && sy < 603
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
[SpiderlingSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory, $PreviewPath)
