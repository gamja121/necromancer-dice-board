param(
  [Parameter(Mandatory = $true)][string]$SourceDirectory,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
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

public static class UnitCardCutoutProcessor
{
    private static Color RemoveGreen(Color color)
    {
        int other = Math.Max(color.R, color.B);
        int dominance = color.G - other;
        if (color.G >= 70 && dominance >= 18)
        {
            if (dominance >= 58) return Color.Transparent;
            int alpha = Math.Max(0, Math.Min(255, (58 - dominance) * 255 / 40));
            int green = Math.Min(color.G, other + 8);
            return Color.FromArgb(alpha, color.R, green, color.B);
        }
        return Color.FromArgb(255, color.R, color.G, color.B);
    }

    private static Bitmap ExtractCard(Bitmap source)
    {
        using (var keyed = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < source.Height; y++)
            for (int x = 0; x < source.Width; x++)
                keyed.SetPixel(x, y, RemoveGreen(source.GetPixel(x, y)));

            int width = keyed.Width, height = keyed.Height;
            var visited = new bool[width * height];
            var largest = new List<int>();
            for (int seed = 0; seed < visited.Length; seed++)
            {
                if (visited[seed] || keyed.GetPixel(seed % width, seed / width).A <= 12) continue;
                var component = new List<int>();
                var queue = new Queue<int>();
                queue.Enqueue(seed); visited[seed] = true;
                while (queue.Count > 0)
                {
                    int current = queue.Dequeue(); component.Add(current);
                    int cx = current % width, cy = current / width;
                    for (int dy = -1; dy <= 1; dy++)
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        int nx = cx + dx, ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                        int next = ny * width + nx;
                        if (visited[next] || keyed.GetPixel(nx, ny).A <= 12) continue;
                        visited[next] = true; queue.Enqueue(next);
                    }
                }
                if (component.Count > largest.Count) largest = component;
            }
            if (largest.Count == 0) throw new InvalidOperationException("No card foreground found.");

            var keep = new bool[width * height];
            foreach (int pixel in largest)
            {
                int px = pixel % width, py = pixel / width;
                for (int dy = -2; dy <= 2; dy++)
                for (int dx = -2; dx <= 2; dx++)
                {
                    int nx = px + dx, ny = py + dy;
                    if (nx >= 0 && ny >= 0 && nx < width && ny < height) keep[ny * width + nx] = true;
                }
            }

            int left = width, top = height, right = -1, bottom = -1;
            for (int index = 0; index < keep.Length; index++)
            {
                int x = index % width, y = index / width;
                if (!keep[index]) { keyed.SetPixel(x, y, Color.Transparent); continue; }
                if (keyed.GetPixel(x, y).A <= 12) continue;
                left = Math.Min(left, x); top = Math.Min(top, y);
                right = Math.Max(right, x); bottom = Math.Max(bottom, y);
            }
            if (right < left || bottom < top) throw new InvalidOperationException("Card bounds were empty.");
            left = Math.Max(0, left - 2); top = Math.Max(0, top - 2);
            right = Math.Min(width - 1, right + 2); bottom = Math.Min(height - 1, bottom + 2);
            return keyed.Clone(Rectangle.FromLTRB(left, top, right + 1, bottom + 1), PixelFormat.Format32bppArgb);
        }
    }

    private static Bitmap Place(Bitmap card)
    {
        var canvas = new Bitmap(740, 1080, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(canvas))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            double scale = Math.Min(720.0 / card.Width, 1060.0 / card.Height);
            int drawWidth = Math.Max(1, (int)Math.Round(card.Width * scale));
            int drawHeight = Math.Max(1, (int)Math.Round(card.Height * scale));
            graphics.DrawImage(card, new Rectangle((740 - drawWidth) / 2, (1080 - drawHeight) / 2, drawWidth, drawHeight));
        }
        return canvas;
    }

    public static void Process(string sourcePath, string outputPath)
    {
        using (var source = new Bitmap(sourcePath))
        using (var card = ExtractCard(source))
        using (var canvas = Place(card))
            canvas.Save(outputPath, ImageFormat.Png);
    }

    public static void Preview(string[] paths, string previewPath)
    {
        if (String.IsNullOrEmpty(previewPath)) return;
        using (var preview = new Bitmap(1500, 520, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(preview))
        {
            graphics.Clear(Color.FromArgb(42, 46, 52));
            for (int i = 0; i < paths.Length; i++)
            using (var card = new Bitmap(paths[i]))
            {
                int width = 240, height = 350;
                int x = 35 + i * 295, y = 85;
                graphics.FillRectangle(new SolidBrush(Color.FromArgb(63, 69, 78)), x - 12, y - 12, width + 24, height + 24);
                graphics.DrawImage(card, new Rectangle(x, y, width, height));
            }
            preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
$cards = @(
  @{ Source = "1-Photo-1.jpg"; Output = "unit-card-corpse-slime.png" },
  @{ Source = "2-Photo-2.jpg"; Output = "unit-card-minotaur.png" },
  @{ Source = "3-Photo-3.jpg"; Output = "unit-card-plague-frog.png" },
  @{ Source = "4-Photo-4.jpg"; Output = "unit-card-ice-lord.png" },
  @{ Source = "5-Photo-5.jpg"; Output = "unit-card-yeti.png" }
)
$outputs = @()
foreach ($card in $cards) {
  $source = Join-Path $SourceDirectory $card.Source
  $output = Join-Path $OutputDirectory $card.Output
  [UnitCardCutoutProcessor]::Process((Resolve-Path $source), $output)
  $outputs += $output
}
[UnitCardCutoutProcessor]::Preview($outputs, $PreviewPath)
Write-Output "Created five RGBA card cutouts."
