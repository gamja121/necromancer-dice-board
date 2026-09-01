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

public static class KrakenSheetProcessor
{
    private static bool IsWhiteGutter(Color color)
    {
        return color.A > 8 && color.R >= 215 && color.G >= 215 && color.B >= 215 &&
               Math.Max(color.R, Math.Max(color.G, color.B)) - Math.Min(color.R, Math.Min(color.G, color.B)) <= 24;
    }

    private static void RemoveEdgeWhiteGutters(Bitmap bitmap)
    {
        var visited = new bool[bitmap.Width, bitmap.Height];
        var queue = new Queue<Point>();
        Action<int, int> enqueue = (x, y) => {
            if (!visited[x, y] && IsWhiteGutter(bitmap.GetPixel(x, y)))
            {
                visited[x, y] = true;
                queue.Enqueue(new Point(x, y));
            }
        };
        for (int x = 0; x < bitmap.Width; x++) { enqueue(x, 0); enqueue(x, bitmap.Height - 1); }
        for (int y = 0; y < bitmap.Height; y++) { enqueue(0, y); enqueue(bitmap.Width - 1, y); }
        while (queue.Count > 0)
        {
            Point point = queue.Dequeue();
            bitmap.SetPixel(point.X, point.Y, Color.Transparent);
            for (int ny = Math.Max(0, point.Y - 1); ny <= Math.Min(bitmap.Height - 1, point.Y + 1); ny++)
            for (int nx = Math.Max(0, point.X - 1); nx <= Math.Min(bitmap.Width - 1, point.X + 1); nx++)
                enqueue(nx, ny);
        }
    }

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
                if (globalX >= 1145 && globalX <= 1225 && globalY >= 430 && globalY <= 520)
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

            RemoveEdgeWhiteGutters(keyed);
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

    public static void Process(string inputPath, string outputDirectory)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle[][] cells = {
            new Rectangle[] {
                Rectangle.FromLTRB(132, 0, 334, 198), Rectangle.FromLTRB(335, 0, 535, 198),
                Rectangle.FromLTRB(536, 0, 815, 198), Rectangle.FromLTRB(816, 0, 1090, 198),
                Rectangle.FromLTRB(1091, 0, 1280, 198)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(132, 204, 348, 394), Rectangle.FromLTRB(355, 204, 578, 394),
                Rectangle.FromLTRB(585, 204, 779, 394), Rectangle.FromLTRB(786, 204, 995, 394)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(132, 401, 306, 575), Rectangle.FromLTRB(313, 401, 506, 575),
                Rectangle.FromLTRB(512, 401, 704, 575), Rectangle.FromLTRB(711, 401, 907, 575),
                Rectangle.FromLTRB(914, 401, 1111, 575), Rectangle.FromLTRB(1118, 401, 1280, 575)
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
[KrakenSheetProcessor]::Process((Resolve-Path $InputPath), $OutputDirectory)
Write-Output "Processed kraken sheet into $OutputDirectory"
