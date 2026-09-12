param(
  [Parameter(Mandatory = $true)][string]$SheetPath,
  [Parameter(Mandatory = $true)][string]$GeneratedAttackPath,
  [Parameter(Mandatory = $true)][string]$PortraitPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [Parameter(Mandatory = $true)][string]$PortraitOutputPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class AbyssClawHunterProcessor
{
    private static Color RemoveGreen(Color color)
    {
        int excessR = color.G - color.R;
        int excessB = color.G - color.B;
        if (color.G >= 92 && excessR >= 44 && excessB >= 34)
        {
            int edge = Math.Min(excessR - 44, excessB - 34);
            if (edge >= 22) return Color.Transparent;
            int alpha = Math.Max(0, Math.Min(255, (22 - edge) * 11));
            return Color.FromArgb(alpha, Math.Min((int)color.R, 72), Math.Min((int)color.G, 92), Math.Min((int)color.B, 72));
        }
        return color;
    }

    private static Color RemoveWhite(Color color)
    {
        int minimum = Math.Min(color.R, Math.Min(color.G, color.B));
        int maximum = Math.Max(color.R, Math.Max(color.G, color.B));
        if (minimum >= 235 && maximum - minimum <= 18) return Color.Transparent;
        if (minimum >= 215 && maximum - minimum <= 24)
        {
            int alpha = Math.Max(0, Math.Min(255, (235 - minimum) * 13));
            return Color.FromArgb(alpha, color.R, color.G, color.B);
        }
        return color;
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool green, bool mirror, bool isolate = false)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color color = source.GetPixel(cell.X + x, cell.Y + y);
                keyed.SetPixel(x, y, green ? RemoveGreen(color) : RemoveWhite(color));
            }
            if (isolate)
            {
                // Separate neighboring artwork by connectivity, not by cutting through a claw.
                var visited = new bool[cell.Width * cell.Height];
                var largest = new List<int>();
                for (int seed = 0; seed < visited.Length; seed++)
                {
                    if (visited[seed] || keyed.GetPixel(seed % cell.Width, seed / cell.Width).A <= 10) continue;
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
                            if (visited[next] || keyed.GetPixel(nx, ny).A <= 10) continue;
                            visited[next] = true; queue.Enqueue(next);
                        }
                    }
                    if (component.Count > largest.Count) largest = component;
                }
                var keep = new bool[visited.Length];
                foreach (int pixel in largest)
                {
                    int x = pixel % cell.Width, y = pixel / cell.Width;
                    if (x == 0 || y == 0 || x == cell.Width - 1 || y == cell.Height - 1)
                        throw new InvalidOperationException("Sprite touches crop boundary: " + cell);
                    for (int dy = -2; dy <= 2; dy++)
                    for (int dx = -2; dx <= 2; dx++)
                    {
                        int nx = x + dx, ny = y + dy;
                        if (nx >= 0 && ny >= 0 && nx < cell.Width && ny < cell.Height) keep[ny * cell.Width + nx] = true;
                    }
                }
                for (int pixel = 0; pixel < keep.Length; pixel++)
                    if (!keep[pixel]) keyed.SetPixel(pixel % cell.Width, pixel / cell.Width, Color.Transparent);
            }
            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                if (keyed.GetPixel(x, y).A <= 10) continue;
                left = Math.Min(left, x); top = Math.Min(top, y);
                right = Math.Max(right, x); bottom = Math.Max(bottom, y);
            }
            if (right < left || bottom < top) throw new InvalidOperationException("No foreground in " + cell);
            const int padding = 3;
            left = Math.Max(0, left - padding); top = Math.Max(0, top - padding);
            right = Math.Min(cell.Width - 1, right + padding); bottom = Math.Min(cell.Height - 1, bottom + padding);
            var result = keyed.Clone(Rectangle.FromLTRB(left, top, right + 1, bottom + 1), PixelFormat.Format32bppArgb);
            if (mirror) result.RotateFlip(RotateFlipType.RotateNoneFlipX);
            return result;
        }
    }

    private static Bitmap KeyGreenCell(Bitmap source, Rectangle cell)
    {
        var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb);
        for (int y = 0; y < cell.Height; y++)
        for (int x = 0; x < cell.Width; x++)
            keyed.SetPixel(x, y, RemoveGreen(source.GetPixel(cell.X + x, cell.Y + y)));
        return keyed;
    }

    private static Bitmap BuildAttackThree(Bitmap sheet, Rectangle sourceCell, Bitmap generated)
    {
        using (var originalBody = KeyGreenCell(sheet, sourceCell))
        using (var generatedClaw = Extract(
            generated,
            Rectangle.FromLTRB(100, 60, Math.Min(560, generated.Width), Math.Min(650, generated.Height)),
            true, false, false))
        {
            var composite = new Bitmap(sourceCell.Width, sourceCell.Height, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(composite))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;

                // Keep the uploaded third frame pixel-for-pixel. Only the generated raised claw
                // is placed behind its left shoulder, so the original body masks the join.
                graphics.DrawImage(generatedClaw, new Rectangle(8, 4, 104, 132));
                graphics.DrawImageUnscaled(originalBody, 0, 0);
            }
            return composite;
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

    private static void SaveFrame(Bitmap source, Rectangle cell, string outputDirectory, string motion, int index, bool mirror)
    {
        using (var frame = Extract(source, cell, true, mirror, !(motion == "death" && index == 5)))
        using (var canvas = Place(frame, 280, 270, 254, 244, 262))
            canvas.Save(System.IO.Path.Combine(outputDirectory, motion + "-" + index.ToString("00") + ".png"), ImageFormat.Png);
    }

    public static void Process(string sheetPath, string generatedAttackPath, string portraitPath, string outputDirectory, string portraitOutputPath)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle[] attack = {
            Rectangle.FromLTRB(168, 0, 395, 250), Rectangle.FromLTRB(380, 0, 600, 250),
            Rectangle.FromLTRB(580, 0, 830, 250), Rectangle.FromLTRB(815, 0, 1090, 250),
            Rectangle.FromLTRB(1060, 0, 1280, 250)
        };
        Rectangle[] hit = {
            Rectangle.FromLTRB(230, 250, 485, 480), Rectangle.FromLTRB(470, 250, 730, 480),
            Rectangle.FromLTRB(715, 250, 960, 480), Rectangle.FromLTRB(945, 250, 1190, 480)
        };
        Rectangle[] death = {
            Rectangle.FromLTRB(168, 488, 380, 714), Rectangle.FromLTRB(355, 488, 565, 714),
            Rectangle.FromLTRB(550, 488, 815, 714), Rectangle.FromLTRB(805, 488, 1050, 714),
            Rectangle.FromLTRB(1058, 488, 1279, 710)
        };
        using (var sheet = new Bitmap(sheetPath))
        using (var generated = new Bitmap(generatedAttackPath))
        using (var attackThree = BuildAttackThree(sheet, attack[2], generated))
        {
            // Canonical battle art faces right. The first two source attacks and the repaired third attack face left, so mirror them.
            SaveFrame(sheet, attack[0], outputDirectory, "attack", 1, true);
            SaveFrame(sheet, attack[1], outputDirectory, "attack", 2, true);
            SaveFrame(attackThree, new Rectangle(0, 0, attackThree.Width, attackThree.Height), outputDirectory, "attack", 3, true);
            SaveFrame(sheet, attack[3], outputDirectory, "attack", 4, false);
            SaveFrame(sheet, attack[4], outputDirectory, "attack", 5, true);
            SaveFrame(sheet, hit[0], outputDirectory, "hit", 1, true);
            for (int index = 1; index < hit.Length; index++) SaveFrame(sheet, hit[index], outputDirectory, "hit", index + 1, false);
            for (int index = 0; index < death.Length; index++) SaveFrame(sheet, death[index], outputDirectory, "death", index + 1, false);
        }
        using (var portrait = new Bitmap(portraitPath))
        using (var frame = Extract(portrait, new Rectangle(0, 0, portrait.Width, portrait.Height), false, false))
        using (var canvas = Place(frame, 192, 192, 172, 174, 184))
            canvas.Save(portraitOutputPath, ImageFormat.Png);
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
[AbyssClawHunterProcessor]::Process(
  (Resolve-Path $SheetPath),
  (Resolve-Path $GeneratedAttackPath),
  (Resolve-Path $PortraitPath),
  $OutputDirectory,
  $PortraitOutputPath
)
Write-Output "Processed Abyss Claw Hunter: 5 attack, 4 hit, 5 death frames and portrait."
