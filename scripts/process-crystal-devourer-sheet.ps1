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

public static class CrystalDevourerSheetProcessor
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
                if (globalX >= 1140 && globalX <= 1225 && globalY >= 430 && globalY <= 520)
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
            Rectangle.FromLTRB(105, 0, 326, 198), Rectangle.FromLTRB(330, 0, 578, 198),
            Rectangle.FromLTRB(580, 0, 798, 198), Rectangle.FromLTRB(804, 0, 1042, 198),
            Rectangle.FromLTRB(1048, 0, 1278, 198)
        };
        Rectangle[] hit = {
            Rectangle.FromLTRB(105, 202, 326, 405), Rectangle.FromLTRB(330, 202, 566, 405),
            Rectangle.FromLTRB(570, 202, 802, 405), Rectangle.FromLTRB(806, 202, 1044, 405),
            Rectangle.FromLTRB(1048, 202, 1278, 405)
        };
        Rectangle[] death = {
            Rectangle.FromLTRB(105, 408, 320, 574), Rectangle.FromLTRB(322, 408, 506, 574),
            Rectangle.FromLTRB(500, 408, 686, 574), Rectangle.FromLTRB(682, 408, 876, 574),
            Rectangle.FromLTRB(870, 408, 1092, 574), Rectangle.FromLTRB(1090, 408, 1278, 574)
        };

        // Requested attack order: source frames 1, 3, 2, 4, 5.
        int[] attackOrder = { 0, 2, 1, 3, 4 };
        using (var source = new Bitmap(inputPath))
        {
            for (int index = 0; index < attackOrder.Length; index++)
                SaveFrame(source, attack[attackOrder[index]], outputDirectory, "attack", index + 1, false);

            // Hit uses only source frames 1-4.
            for (int index = 0; index < 4; index++)
                SaveFrame(source, hit[index], outputDirectory, "hit", index + 1, false);

            // Death order: death 1, hit 5, then original death 2-6 shifted back once.
            SaveFrame(source, death[0], outputDirectory, "death", 1, false);
            SaveFrame(source, hit[4], outputDirectory, "death", 2, false);
            for (int index = 1; index < death.Length; index++)
                SaveFrame(source, death[index], outputDirectory, "death", index + 2, index == death.Length - 1);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[CrystalDevourerSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory)
Write-Output "Processed crystal devourer sheet into $OutputDirectory"
