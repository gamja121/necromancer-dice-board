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

public static class SirenSheetProcessor
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

    private static void RemoveFinalSparkle(Bitmap bitmap, Rectangle cell)
    {
        var visited = new bool[bitmap.Width, bitmap.Height];
        for (int y = 0; y < bitmap.Height; y++)
        for (int x = 0; x < bitmap.Width; x++)
        {
            if (visited[x, y] || bitmap.GetPixel(x, y).A <= 8) continue;
            var component = new List<Point>();
            var queue = new Queue<Point>();
            bool touchesSparkleArea = false;
            queue.Enqueue(new Point(x, y));
            visited[x, y] = true;
            while (queue.Count > 0)
            {
                Point point = queue.Dequeue();
                component.Add(point);
                int globalX = cell.X + point.X, globalY = cell.Y + point.Y;
                if (globalX >= 1130 && globalX <= 1225 && globalY >= 555 && globalY <= 650)
                    touchesSparkleArea = true;
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
            if (touchesSparkleArea && component.Count < 2200)
                foreach (Point point in component) bitmap.SetPixel(point.X, point.Y, Color.Transparent);
        }
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool removeFinalSparkle)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
                keyed.SetPixel(x, y, RemoveMagenta(source.GetPixel(cell.X + x, cell.Y + y)));

            if (removeFinalSparkle) RemoveFinalSparkle(keyed, cell);

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

    private static void SaveFrame(Bitmap source, Rectangle cell, string outputDirectory, string motion, int outputIndex, bool removeFinalSparkle)
    {
        using (var extracted = Extract(source, cell, removeFinalSparkle))
        using (var normalized = PlaceOnCanvas(extracted))
        {
            string outputPath = System.IO.Path.Combine(outputDirectory, motion + "-" + outputIndex.ToString("00") + ".png");
            normalized.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void Process(string inputPath, string outputDirectory)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle[] attack = {
            Rectangle.FromLTRB(115, 0, 334, 240), Rectangle.FromLTRB(338, 0, 566, 240),
            Rectangle.FromLTRB(570, 0, 792, 240), Rectangle.FromLTRB(796, 0, 1028, 240),
            Rectangle.FromLTRB(1032, 0, 1278, 240)
        };
        Rectangle[] hit = {
            Rectangle.FromLTRB(115, 244, 338, 474), Rectangle.FromLTRB(342, 244, 566, 474),
            Rectangle.FromLTRB(570, 244, 792, 474), Rectangle.FromLTRB(796, 244, 1030, 474)
        };
        Rectangle[] death = {
            Rectangle.FromLTRB(105, 478, 312, 696), Rectangle.FromLTRB(316, 478, 498, 696),
            Rectangle.FromLTRB(502, 478, 692, 696), Rectangle.FromLTRB(682, 478, 882, 696),
            Rectangle.FromLTRB(872, 478, 1074, 696), Rectangle.FromLTRB(1064, 478, 1278, 696)
        };

        using (var source = new Bitmap(inputPath))
        {
            for (int index = 0; index < attack.Length; index++)
                SaveFrame(source, attack[index], outputDirectory, "attack", index + 1, false);
            for (int index = 0; index < hit.Length; index++)
                SaveFrame(source, hit[index], outputDirectory, "hit", index + 1, false);

            // Requested death order: hit source frame 4, then original death frames 1-6.
            SaveFrame(source, hit[3], outputDirectory, "death", 1, false);
            for (int index = 0; index < death.Length; index++)
                SaveFrame(source, death[index], outputDirectory, "death", index + 2, index == death.Length - 1);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[SirenSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory)
Write-Output "Processed siren sheet into $OutputDirectory"
