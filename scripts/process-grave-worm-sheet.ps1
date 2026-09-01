param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;

public static class GraveWormSheetProcessor
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

    private static void RemoveDetachedEffects(Bitmap bitmap, Rectangle cell, Rectangle globalRegion, int maximumSize)
    {
        var visited = new bool[bitmap.Width, bitmap.Height];
        for (int y = 0; y < bitmap.Height; y++)
        for (int x = 0; x < bitmap.Width; x++)
        {
            if (visited[x, y] || bitmap.GetPixel(x, y).A <= 8) continue;
            var component = new List<Point>();
            var queue = new Queue<Point>();
            bool touchesEffectArea = false;
            queue.Enqueue(new Point(x, y));
            visited[x, y] = true;
            while (queue.Count > 0)
            {
                Point point = queue.Dequeue();
                component.Add(point);
                if (globalRegion.Contains(cell.X + point.X, cell.Y + point.Y)) touchesEffectArea = true;
                int[] dx = { -1, 1, 0, 0 };
                int[] dy = { 0, 0, -1, 1 };
                for (int direction = 0; direction < 4; direction++)
                {
                    int nx = point.X + dx[direction], ny = point.Y + dy[direction];
                    if (nx < 0 || ny < 0 || nx >= bitmap.Width || ny >= bitmap.Height || visited[nx, ny]) continue;
                    visited[nx, ny] = true;
                    if (bitmap.GetPixel(nx, ny).A > 8) queue.Enqueue(new Point(nx, ny));
                }
            }
            if (touchesEffectArea && component.Count < maximumSize)
                foreach (Point point in component) bitmap.SetPixel(point.X, point.Y, Color.Transparent);
        }
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, Rectangle effectRegion, int effectMaximumSize)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
                keyed.SetPixel(x, y, RemoveMagenta(source.GetPixel(cell.X + x, cell.Y + y)));

            if (!effectRegion.IsEmpty) RemoveDetachedEffects(keyed, cell, effectRegion, effectMaximumSize);

            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                if (keyed.GetPixel(x, y).A <= 8) continue;
                left = Math.Min(left, x); top = Math.Min(top, y);
                right = Math.Max(right, x); bottom = Math.Max(bottom, y);
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
                Rectangle.FromLTRB(105, 0, 334, 246), Rectangle.FromLTRB(338, 0, 576, 246),
                Rectangle.FromLTRB(578, 0, 806, 246), Rectangle.FromLTRB(808, 0, 1034, 246),
                Rectangle.FromLTRB(1036, 0, 1278, 246)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(105, 250, 334, 486), Rectangle.FromLTRB(338, 250, 576, 486),
                Rectangle.FromLTRB(578, 250, 806, 486), Rectangle.FromLTRB(808, 250, 1040, 486)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(105, 490, 320, 712), Rectangle.FromLTRB(322, 490, 506, 712),
                Rectangle.FromLTRB(500, 490, 690, 712), Rectangle.FromLTRB(686, 490, 882, 712),
                Rectangle.FromLTRB(876, 490, 1074, 712), Rectangle.FromLTRB(1068, 490, 1278, 712)
            }
        };
        string[] names = { "attack", "hit", "death" };
        using (var source = new Bitmap(inputPath))
        {
            for (int row = 0; row < cells.Length; row++)
            for (int frameIndex = 0; frameIndex < cells[row].Length; frameIndex++)
            {
                Rectangle effectRegion = Rectangle.Empty;
                int effectMaximumSize = 0;
                if (row == 1 && frameIndex == 2)
                {
                    effectRegion = Rectangle.FromLTRB(640, 252, 800, 338);
                    effectMaximumSize = 5000;
                }
                else if (row == 1 && frameIndex == 3)
                {
                    effectRegion = Rectangle.FromLTRB(880, 252, 1020, 338);
                    effectMaximumSize = 5000;
                }
                else if (row == 2 && frameIndex == 5)
                {
                    effectRegion = Rectangle.FromLTRB(1130, 560, 1230, 650);
                    effectMaximumSize = 2200;
                }

                using (var extracted = Extract(source, cells[row][frameIndex], effectRegion, effectMaximumSize))
                using (var normalized = PlaceOnCanvas(extracted))
                {
                    string outputPath = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frameIndex + 1).ToString("00") + ".png");
                    normalized.Save(outputPath, ImageFormat.Png);
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[GraveWormSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory)
Write-Output "Processed grave worm sheet into $OutputDirectory"
