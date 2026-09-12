param(
  [Parameter(Mandatory = $true)][string]$SheetPath,
  [Parameter(Mandatory = $true)][string]$PortraitPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [Parameter(Mandatory = $true)][string]$PortraitOutputPath,
  [string]$PreviewPath = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class CorpseSlimeProcessor
{
    private static Color RemoveMagenta(Color color)
    {
        int redExcess = color.R - color.G;
        int blueExcess = color.B - color.G;
        if (color.R >= 70 && color.B >= 70 && color.G <= 135 && redExcess >= 18 && blueExcess >= 18)
        {
            int edge = Math.Min(redExcess - 18, blueExcess - 18);
            if (edge >= 20) return Color.Transparent;
            int alpha = Math.Max(0, Math.Min(255, (20 - edge) * 12));
            return Color.FromArgb(alpha, Math.Min((int)color.R, color.G + 10), color.G, Math.Min((int)color.B, color.G + 10));
        }
        return color;
    }

    private static Color RemoveWhite(Color color)
    {
        int minimum = Math.Min(color.R, Math.Min(color.G, color.B));
        int maximum = Math.Max(color.R, Math.Max(color.G, color.B));
        if (minimum >= 238 && maximum - minimum <= 18) return Color.Transparent;
        if (minimum >= 216 && maximum - minimum <= 26)
        {
            int alpha = Math.Max(0, Math.Min(255, (238 - minimum) * 12));
            return Color.FromArgb(alpha, color.R, color.G, color.B);
        }
        return color;
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool magenta)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color color = source.GetPixel(cell.X + x, cell.Y + y);
                keyed.SetPixel(x, y, magenta ? RemoveMagenta(color) : RemoveWhite(color));
            }

            var visited = new bool[cell.Width * cell.Height];
            var largest = new List<int>();
            for (int seed = 0; seed < visited.Length; seed++)
            {
                if (visited[seed] || keyed.GetPixel(seed % cell.Width, seed / cell.Width).A <= 12) continue;
                var component = new List<int>();
                var queue = new Queue<int>();
                queue.Enqueue(seed); visited[seed] = true;
                while (queue.Count > 0)
                {
                    int current = queue.Dequeue(); component.Add(current);
                    int cx = current % cell.Width, cy = current / cell.Width;
                    for (int dy = -1; dy <= 1; dy++)
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        int nx = cx + dx, ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= cell.Width || ny >= cell.Height) continue;
                        int next = ny * cell.Width + nx;
                        if (visited[next] || keyed.GetPixel(nx, ny).A <= 12) continue;
                        visited[next] = true; queue.Enqueue(next);
                    }
                }
                if (component.Count > largest.Count) largest = component;
            }
            if (largest.Count == 0) throw new InvalidOperationException("No foreground in " + cell);
            var keep = new bool[visited.Length];
            foreach (int pixel in largest)
            {
                int px = pixel % cell.Width, py = pixel / cell.Width;
                for (int dy = -2; dy <= 2; dy++)
                for (int dx = -2; dx <= 2; dx++)
                {
                    int nx = px + dx, ny = py + dy;
                    if (nx >= 0 && ny >= 0 && nx < cell.Width && ny < cell.Height) keep[ny * cell.Width + nx] = true;
                }
            }
            for (int pixel = 0; pixel < keep.Length; pixel++)
                if (!keep[pixel]) keyed.SetPixel(pixel % cell.Width, pixel / cell.Width, Color.Transparent);

            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                if (keyed.GetPixel(x, y).A <= 12) continue;
                left = Math.Min(left, x); top = Math.Min(top, y);
                right = Math.Max(right, x); bottom = Math.Max(bottom, y);
            }
            const int padding = 3;
            left = Math.Max(0, left - padding); top = Math.Max(0, top - padding);
            right = Math.Min(cell.Width - 1, right + padding); bottom = Math.Min(cell.Height - 1, bottom + padding);
            return keyed.Clone(Rectangle.FromLTRB(left, top, right + 1, bottom + 1), PixelFormat.Format32bppArgb);
        }
    }

    private static Bitmap Place(Bitmap frame, int width, int height, int maxWidth, int maxHeight, int bottom)
    {
        var canvas = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(canvas))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            double scale = Math.Min((double)maxWidth / frame.Width, (double)maxHeight / frame.Height);
            int drawWidth = Math.Max(1, (int)Math.Round(frame.Width * scale));
            int drawHeight = Math.Max(1, (int)Math.Round(frame.Height * scale));
            graphics.DrawImage(frame, new Rectangle((width - drawWidth) / 2, bottom - drawHeight, drawWidth, drawHeight));
        }
        return canvas;
    }

    private static void SaveFrame(Bitmap sheet, Rectangle cell, string outputDirectory, string motion, int index)
    {
        using (var frame = Extract(sheet, cell, true))
        using (var canvas = Place(frame, 280, 270, 258, 238, 260))
            canvas.Save(System.IO.Path.Combine(outputDirectory, motion + "-" + index.ToString("00") + ".png"), ImageFormat.Png);
    }

    public static void Process(string sheetPath, string portraitPath, string outputDirectory, string portraitOutputPath)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle row1col2 = Rectangle.FromLTRB(188, 18, 393, 179);
        Rectangle row1col3 = Rectangle.FromLTRB(390, 18, 575, 179);
        Rectangle row1col4 = Rectangle.FromLTRB(563, 18, 800, 179);
        Rectangle row1col5 = Rectangle.FromLTRB(778, 18, 1042, 179);
        Rectangle row2col1 = Rectangle.FromLTRB(22, 220, 228, 374);
        Rectangle row2col2 = Rectangle.FromLTRB(238, 220, 462, 374);
        Rectangle row2col3 = Rectangle.FromLTRB(452, 220, 678, 374);
        Rectangle row2col4 = Rectangle.FromLTRB(674, 220, 885, 374);
        Rectangle[] death = {
            Rectangle.FromLTRB(14, 405, 208, 548),
            Rectangle.FromLTRB(194, 405, 372, 548),
            Rectangle.FromLTRB(348, 405, 532, 548),
            Rectangle.FromLTRB(512, 405, 688, 548),
            Rectangle.FromLTRB(812, 405, 994, 548)
        };

        using (var sheet = new Bitmap(sheetPath))
        {
            Rectangle[] attack = { row1col2, row2col2, row2col3, row1col4, row1col5, row2col3, row1col2 };
            Rectangle[] hit = { row2col1, row1col3, row2col4, row1col3 };
            for (int index = 0; index < attack.Length; index++) SaveFrame(sheet, attack[index], outputDirectory, "attack", index + 1);
            for (int index = 0; index < hit.Length; index++) SaveFrame(sheet, hit[index], outputDirectory, "hit", index + 1);
            for (int index = 0; index < death.Length; index++) SaveFrame(sheet, death[index], outputDirectory, "death", index + 1);
        }
        using (var portrait = new Bitmap(portraitPath))
        using (var frame = Extract(portrait, new Rectangle(0, 0, portrait.Width, portrait.Height), false))
        using (var canvas = Place(frame, 192, 192, 178, 176, 186))
            canvas.Save(portraitOutputPath, ImageFormat.Png);
    }

    public static void CreatePreview(string outputDirectory, string previewPath)
    {
        if (String.IsNullOrEmpty(previewPath)) return;
        using (var preview = new Bitmap(1960, 810, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(preview))
        {
            graphics.Clear(Color.FromArgb(28, 24, 22));
            string[] motions = { "attack", "hit", "death" };
            int[] counts = { 7, 4, 5 };
            for (int row = 0; row < motions.Length; row++)
            for (int index = 1; index <= counts[row]; index++)
            {
                string path = System.IO.Path.Combine(outputDirectory, motions[row] + "-" + index.ToString("00") + ".png");
                using (var frame = new Bitmap(path)) graphics.DrawImageUnscaled(frame, (index - 1) * 280, row * 270);
            }
            preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[CorpseSlimeProcessor]::Process(
  (Resolve-Path $SheetPath),
  (Resolve-Path $PortraitPath),
  $OutputDirectory,
  $PortraitOutputPath
)
[CorpseSlimeProcessor]::CreatePreview($OutputDirectory, $PreviewPath)
Write-Output "Processed Corpse Slime: 7 attack, 4 hit, 5 death frames and portrait."
