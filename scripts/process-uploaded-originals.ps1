param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$OnlyNeutral
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$processorSource = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class UploadedOriginalProcessor
{
    private static int DistanceSquared(Color a, Color b)
    {
        int dr = a.R - b.R;
        int dg = a.G - b.G;
        int db = a.B - b.B;
        return dr * dr + dg * dg + db * db;
    }

    private static Color BorderColor(Bitmap source)
    {
        long red = 0, green = 0, blue = 0, count = 0;
        int stepX = Math.Max(1, source.Width / 64);
        int stepY = Math.Max(1, source.Height / 64);
        for (int x = 0; x < source.Width; x += stepX)
        {
            Color top = source.GetPixel(x, 0);
            Color bottom = source.GetPixel(x, source.Height - 1);
            red += top.R + bottom.R; green += top.G + bottom.G; blue += top.B + bottom.B; count += 2;
        }
        for (int y = 0; y < source.Height; y += stepY)
        {
            Color left = source.GetPixel(0, y);
            Color right = source.GetPixel(source.Width - 1, y);
            red += left.R + right.R; green += left.G + right.G; blue += left.B + right.B; count += 2;
        }
        return Color.FromArgb((int)(red / count), (int)(green / count), (int)(blue / count));
    }

    public static void Process(string inputPath, string outputPath)
    {
        using (var sourceFile = new Bitmap(inputPath))
        using (var source = new Bitmap(sourceFile.Width, sourceFile.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source)) graphics.DrawImageUnscaled(sourceFile, 0, 0);
            int width = source.Width;
            int height = source.Height;
            Color border = BorderColor(source);
            int borderBrightness = (border.R + border.G + border.B) / 3;
            int tolerance = borderBrightness < 45 ? 48 : 72;
            int toleranceSquared = tolerance * tolerance;
            var background = new bool[width * height];
            var queue = new Queue<int>();

            Action<int, int> enqueue = (x, y) =>
            {
                int index = y * width + x;
                if (background[index]) return;
                Color color = source.GetPixel(x, y);
                int brightness = (color.R + color.G + color.B) / 3;
                bool darkBackdrop = borderBrightness < 45 && brightness <= 54;
                bool similarBackdrop = DistanceSquared(color, border) <= toleranceSquared;
                if (!darkBackdrop && !similarBackdrop) return;
                background[index] = true;
                queue.Enqueue(index);
            };

            for (int x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
            for (int y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
            while (queue.Count > 0)
            {
                int index = queue.Dequeue();
                int x = index % width;
                int y = index / width;
                if (x > 0) enqueue(x - 1, y);
                if (x + 1 < width) enqueue(x + 1, y);
                if (y > 0) enqueue(x, y - 1);
                if (y + 1 < height) enqueue(x, y + 1);
            }

            int left = width, top = height, right = -1, bottom = -1;
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int index = y * width + x;
                    Color color = source.GetPixel(x, y);
                    if (background[index])
                    {
                        source.SetPixel(x, y, Color.FromArgb(0, color.R, color.G, color.B));
                        continue;
                    }
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }
            if (right < left || bottom < top) throw new InvalidOperationException("No foreground found: " + inputPath);

            int pad = Math.Max(4, Math.Min(width, height) / 80);
            left = Math.Max(0, left - pad); top = Math.Max(0, top - pad);
            right = Math.Min(width - 1, right + pad); bottom = Math.Min(height - 1, bottom + pad);
            var bounds = Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
            using (var cropped = source.Clone(bounds, PixelFormat.Format32bppArgb))
            using (var output = new Bitmap(192, 192, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                const int maxWidth = 180, maxHeight = 174;
                double scale = Math.Min((double)maxWidth / cropped.Width, (double)maxHeight / cropped.Height);
                int drawWidth = Math.Max(1, (int)Math.Round(cropped.Width * scale));
                int drawHeight = Math.Max(1, (int)Math.Round(cropped.Height * scale));
                int drawX = (192 - drawWidth) / 2;
                int drawY = 184 - drawHeight;
                graphics.DrawImage(cropped, new Rectangle(drawX, drawY, drawWidth, drawHeight));
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    public static void ProcessNeutralBackdrop(string inputPath, string outputPath)
    {
        using (var sourceFile = new Bitmap(inputPath))
        using (var source = new Bitmap(sourceFile.Width, sourceFile.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source)) graphics.DrawImageUnscaled(sourceFile, 0, 0);
            int width = source.Width, height = source.Height;
            bool chromaOnly = System.IO.Path.GetFileName(inputPath).IndexOf("siren", StringComparison.OrdinalIgnoreCase) >= 0;
            var candidate = new bool[width * height];
            for (int y = 1; y < height - 1; y++)
            {
                for (int x = 1; x < width - 1; x++)
                {
                    Color color = source.GetPixel(x, y);
                    int max = Math.Max(color.R, Math.Max(color.G, color.B));
                    int min = Math.Min(color.R, Math.Min(color.G, color.B));
                    int brightness = (color.R + color.G + color.B) / 3;
                    int chromaThreshold = chromaOnly ? 6 : 13;
                    candidate[y * width + x] = (max - min >= chromaThreshold) || (!chromaOnly && brightness < 42);
                }
            }

            var visited = new bool[width * height];
            var best = new List<int>();
            var retained = new List<int>();
            int[] dx = { -1, 0, 1, -1, 1, -1, 0, 1 };
            int[] dy = { -1, -1, -1, 0, 0, 1, 1, 1 };
            for (int y = 1; y < height - 1; y++)
            {
                for (int x = 1; x < width - 1; x++)
                {
                    int start = y * width + x;
                    if (!candidate[start] || visited[start]) continue;
                    var component = new List<int>();
                    var queue = new Queue<int>();
                    visited[start] = true; queue.Enqueue(start);
                    while (queue.Count > 0)
                    {
                        int index = queue.Dequeue(); component.Add(index);
                        int px = index % width, py = index / width;
                        for (int n = 0; n < 8; n++)
                        {
                            int nx = px + dx[n], ny = py + dy[n];
                            if (nx <= 0 || nx >= width - 1 || ny <= 0 || ny >= height - 1) continue;
                            int next = ny * width + nx;
                            if (!candidate[next] || visited[next]) continue;
                            visited[next] = true; queue.Enqueue(next);
                        }
                    }
                    if (chromaOnly && component.Count >= 24)
                    {
                        long sumX = 0, sumY = 0;
                        foreach (int index in component) { sumX += index % width; sumY += index / width; }
                        double centerX = (double)sumX / component.Count;
                        double centerY = (double)sumY / component.Count;
                        if (centerX >= width * 0.20 && centerX <= width * 0.80 && centerY <= height * 0.96)
                            retained.AddRange(component);
                    }
                    if (component.Count > best.Count) best = component;
                }
            }
            if (chromaOnly && retained.Count > 0) best = retained;
            if (best.Count == 0) throw new InvalidOperationException("No neutral-background foreground found: " + inputPath);

            var foreground = new bool[width * height];
            foreach (int index in best) foreground[index] = true;
            for (int pass = 0; pass < 2; pass++)
            {
                var expanded = (bool[])foreground.Clone();
                for (int y = 1; y < height - 1; y++)
                {
                    for (int x = 1; x < width - 1; x++)
                    {
                        int index = y * width + x;
                        if (foreground[index]) continue;
                        bool near = false;
                        for (int n = 0; n < 8 && !near; n++) near = foreground[(y + dy[n]) * width + (x + dx[n])];
                        if (near) expanded[index] = true;
                    }
                }
                foreground = expanded;
            }

            var outside = new bool[width * height];
            var outsideQueue = new Queue<int>();
            Action<int, int> enqueueOutside = (x, y) =>
            {
                int index = y * width + x;
                if (foreground[index] || outside[index]) return;
                outside[index] = true; outsideQueue.Enqueue(index);
            };
            for (int x = 0; x < width; x++) { enqueueOutside(x, 0); enqueueOutside(x, height - 1); }
            for (int y = 0; y < height; y++) { enqueueOutside(0, y); enqueueOutside(width - 1, y); }
            while (outsideQueue.Count > 0)
            {
                int index = outsideQueue.Dequeue(); int x = index % width, y = index / width;
                if (x > 0) enqueueOutside(x - 1, y); if (x + 1 < width) enqueueOutside(x + 1, y);
                if (y > 0) enqueueOutside(x, y - 1); if (y + 1 < height) enqueueOutside(x, y + 1);
            }
            for (int i = 0; i < foreground.Length; i++) if (!outside[i]) foreground[i] = true;

            int left = width, top = height, right = -1, bottom = -1;
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int index = y * width + x; Color color = source.GetPixel(x, y);
                    if (!foreground[index]) { source.SetPixel(x, y, Color.FromArgb(0, color.R, color.G, color.B)); continue; }
                    left = Math.Min(left, x); top = Math.Min(top, y); right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }
            if (right < left || bottom < top) throw new InvalidOperationException("No foreground found: " + inputPath);
            int pad = Math.Max(4, Math.Min(width, height) / 80);
            left = Math.Max(0, left - pad); top = Math.Max(0, top - pad);
            right = Math.Min(width - 1, right + pad); bottom = Math.Min(height - 1, bottom + pad);
            var bounds = Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
            using (var cropped = source.Clone(bounds, PixelFormat.Format32bppArgb))
            using (var output = new Bitmap(192, 192, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                double scale = Math.Min(180.0 / cropped.Width, 174.0 / cropped.Height);
                int drawWidth = Math.Max(1, (int)Math.Round(cropped.Width * scale));
                int drawHeight = Math.Max(1, (int)Math.Round(cropped.Height * scale));
                graphics.DrawImage(cropped, new Rectangle((192 - drawWidth) / 2, 184 - drawHeight, drawWidth, drawHeight));
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $processorSource -ReferencedAssemblies System.Drawing

$items = @(
  @{ Source = "batch-01-photo-01.jpg"; File = "plague-frog" },
  @{ Source = "batch-01-photo-02.jpg"; File = "minotaur" },
  @{ Source = "batch-01-photo-03.jpg"; File = "spider-queen" },
  @{ Source = "batch-01-photo-04.jpg"; File = "stone-golem" },
  @{ Source = "batch-01-photo-05.jpg"; File = "crystal-devourer" },
  @{ Source = "batch-02-photo-01.jpg"; File = "kraken" },
  @{ Source = "batch-02-photo-02.jpg"; File = "skeleton-archer" },
  @{ Source = "batch-02-photo-03.jpg"; File = "skeleton-spear" },
  @{ Source = "batch-02-photo-04.jpg"; File = "hell-mantis" },
  @{ Source = "batch-02-photo-05.jpg"; File = "ancient-treant" },
  @{ Source = "batch-03-photo-01.jpg"; File = "demon-death-knight" },
  @{ Source = "batch-03-photo-02.jpg"; File = "skeleton-summoner" },
  @{ Source = "batch-03-photo-03.jpg"; File = "doom-executor" },
  @{ Source = "batch-03-photo-04.jpg"; File = "scorpion-knight" },
  @{ Source = "batch-03-photo-05.jpg"; File = "sea-wolf" },
  @{ Source = "batch-04-photo-01.jpg"; File = "abyss-eye" },
  @{ Source = "batch-04-photo-02.jpg"; File = "goblin-soldier" },
  @{ Source = "batch-04-photo-03.jpg"; File = "goblin-chief" },
  @{ Source = "batch-04-photo-04.jpg"; File = "plague-doctor" },
  @{ Source = "batch-04-photo-05.jpg"; File = "ghoul" },
  @{ Source = "batch-05-photo-01.jpg"; File = "yeti" },
  @{ Source = "batch-05-photo-02.jpg"; File = "ice-lord"; Neutral = $true },
  @{ Source = "batch-05-photo-03.jpg"; File = "goblin-commoner" },
  @{ Source = "batch-05-photo-04.jpg"; File = "guardian-seed" },
  @{ Source = "batch-05-photo-05.jpg"; File = "spiderling" },
  @{ Source = "batch-06-photo-01.jpg"; File = "mummy-guardian" },
  @{ Source = "batch-06-photo-02.jpg"; File = "soul-reaper" },
  @{ Source = "batch-06-photo-03.jpg"; File = "death-knight" },
  @{ Source = "batch-06-photo-04.jpg"; File = "mimic" },
  @{ Source = "batch-06-photo-05.jpg"; File = "ice-princess"; Neutral = $true },
  @{ Source = "batch-07-photo-01.jpg"; File = "bone-hound" },
  @{ Source = "batch-07-photo-02.jpg"; File = "hydra" },
  @{ Source = "batch-07-photo-03.jpg"; File = "ogre" },
  @{ Source = "batch-07-photo-04.jpg"; File = "flesh-golem" },
  @{ Source = "batch-07-photo-05.jpg"; File = "forest-fairy" },
  @{ Source = "batch-08-photo-01.jpg"; File = "bone-golem" },
  @{ Source = "batch-08-photo-02.jpg"; File = "goblin-rider" },
  @{ Source = "batch-08-photo-03.jpg"; File = "troll" },
  @{ Source = "batch-08-photo-04.jpg"; File = "abyss-harpy"; Neutral = $true },
  @{ Source = "batch-08-photo-05.jpg"; File = "raging-treant" },
  @{ Source = "batch-09-photo-01.jpg"; File = "poison-mushroom" },
  @{ Source = "batch-09-photo-02.jpg"; File = "cerberus" },
  @{ Source = "plague-maggot-original.jpg"; File = "grave-worm" },
  @{ Source = "siren-original.jpg"; File = "siren"; Neutral = $true }
)

$sourceDirectory = Join-Path $ProjectRoot "art\v2-style\references\cute-grotesque-master-collection\uploaded-originals"
$assetDirectory = Join-Path $ProjectRoot "assets"
$outputDirectory = Join-Path $ProjectRoot "art\v2-style\processed\192"
New-Item -ItemType Directory -Force -Path $assetDirectory, $outputDirectory | Out-Null

foreach ($item in $items) {
  if ($OnlyNeutral -and -not ($item.ContainsKey("Neutral") -and [bool]$item.Neutral)) { continue }
  $sourcePath = Join-Path $sourceDirectory $item.Source
  if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Source image not found: $sourcePath" }
  Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $assetDirectory ($item.File + ".jpg")) -Force
  $outputPath = Join-Path $outputDirectory ($item.File + ".png")
  if ($item.ContainsKey("Neutral") -and [bool]$item.Neutral) {
    [UploadedOriginalProcessor]::ProcessNeutralBackdrop($sourcePath, $outputPath)
  } else {
    [UploadedOriginalProcessor]::Process($sourcePath, $outputPath)
  }
  Write-Output ("Processed: " + $item.File)
}

Write-Output ("Processed originals: " + $(if ($OnlyNeutral) { 4 } else { $items.Count }))
