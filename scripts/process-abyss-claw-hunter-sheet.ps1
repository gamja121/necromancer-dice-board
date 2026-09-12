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

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool green, bool mirror)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color color = source.GetPixel(cell.X + x, cell.Y + y);
                keyed.SetPixel(x, y, green ? RemoveGreen(color) : RemoveWhite(color));
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
        using (var frame = Extract(source, cell, true, mirror))
        using (var canvas = Place(frame, 280, 270, 254, 244, 262))
            canvas.Save(System.IO.Path.Combine(outputDirectory, motion + "-" + index.ToString("00") + ".png"), ImageFormat.Png);
    }

    public static void Process(string sheetPath, string generatedAttackPath, string portraitPath, string outputDirectory, string portraitOutputPath)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        Rectangle[] attack = {
            Rectangle.FromLTRB(168, 8, 386, 241), Rectangle.FromLTRB(378, 8, 616, 241),
            Rectangle.FromLTRB(590, 8, 832, 241), Rectangle.FromLTRB(800, 8, 1065, 241),
            Rectangle.FromLTRB(1050, 8, 1279, 241)
        };
        Rectangle[] hit = {
            Rectangle.FromLTRB(224, 263, 485, 480), Rectangle.FromLTRB(455, 263, 716, 480),
            Rectangle.FromLTRB(700, 263, 954, 480), Rectangle.FromLTRB(938, 263, 1200, 480)
        };
        Rectangle[] death = {
            Rectangle.FromLTRB(178, 488, 382, 710), Rectangle.FromLTRB(372, 488, 576, 710),
            Rectangle.FromLTRB(558, 488, 807, 710), Rectangle.FromLTRB(798, 488, 1040, 710),
            Rectangle.FromLTRB(1030, 488, 1279, 710)
        };
        using (var sheet = new Bitmap(sheetPath))
        using (var generated = new Bitmap(generatedAttackPath))
        {
            // Canonical battle art faces right. The first two source attacks and the repaired third attack face left, so mirror them.
            SaveFrame(sheet, attack[0], outputDirectory, "attack", 1, true);
            SaveFrame(sheet, attack[1], outputDirectory, "attack", 2, true);
            SaveFrame(generated, new Rectangle(0, 0, generated.Width, generated.Height), outputDirectory, "attack", 3, true);
            SaveFrame(sheet, attack[3], outputDirectory, "attack", 4, false);
            SaveFrame(sheet, attack[4], outputDirectory, "attack", 5, false);
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
