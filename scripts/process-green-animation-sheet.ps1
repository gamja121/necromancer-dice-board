param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [string]$UnitName = "death-knight"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class GreenAnimationProcessor
{
    private static Color RemoveChroma(Color c, bool magenta)
    {
        if (magenta)
        {
            int baseChannel = Math.Max(c.G, Math.Min(c.R, c.B) / 3);
            int magentaExcess = Math.Min(c.R, c.B) - c.G;
            if (c.R >= 58 && c.B >= 54 && magentaExcess >= 14)
            {
                if (magentaExcess >= 34) return Color.Transparent;
                int alpha = (int)Math.Round(255.0 * (34 - magentaExcess) / 20.0);
                alpha = Math.Max(0, Math.Min(255, alpha));
                int red = Math.Min(c.R, baseChannel + 10);
                int blue = Math.Min(c.B, baseChannel + 10);
                return Color.FromArgb(alpha, red, c.G, blue);
            }
            return c;
        }

        int other = Math.Max(c.R, c.B);
        int excess = c.G - other;
        if (c.G >= 65 && excess >= 28)
        {
            if (excess >= 48) return Color.Transparent;
            int alpha = (int)Math.Round(255.0 * (48 - excess) / 20.0);
            alpha = Math.Max(0, Math.Min(255, alpha));
            int green = Math.Min(c.G, other + 8);
            return Color.FromArgb(alpha, c.R, green, c.B);
        }
        return c;
    }

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool magenta, bool clearWhite = false)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color input = source.GetPixel(cell.X + x, cell.Y + y);
                Color output = clearWhite && input.R >= 242 && input.G >= 242 && input.B >= 242
                    ? Color.Transparent
                    : RemoveChroma(input, magenta);

                // The Stone Golem's first death pose overlaps the white label gutter.
                // Remove the divider above/below the arm and neutral white residue beside it.
                if (clearWhite && cell.X + x < 122)
                {
                    int globalY = cell.Y + y;
                    int neutralRange = Math.Max(input.R, Math.Max(input.G, input.B))
                        - Math.Min(input.R, Math.Min(input.G, input.B));
                    if (globalY < 552 || globalY > 660 ||
                        (Math.Min(input.R, Math.Min(input.G, input.B)) > 178 && neutralRange < 22))
                        output = Color.Transparent;
                }
                keyed.SetPixel(x, y, output);
                if (output.A > 8)
                {
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }

            if (right < left || bottom < top)
                throw new InvalidOperationException("No foreground in " + cell);

            const int cropPadding = 3;
            left = Math.Max(0, left - cropPadding); top = Math.Max(0, top - cropPadding);
            right = Math.Min(cell.Width - 1, right + cropPadding);
            bottom = Math.Min(cell.Height - 1, bottom + cropPadding);
            Rectangle bounds = Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
            using (var cropped = keyed.Clone(bounds, PixelFormat.Format32bppArgb))
            {
                const int safeBorder = 12;
                var output = new Bitmap(cropped.Width + safeBorder * 2, cropped.Height + safeBorder * 2, PixelFormat.Format32bppArgb);
                using (var g = Graphics.FromImage(output))
                {
                    g.Clear(Color.Transparent);
                    g.CompositingMode = CompositingMode.SourceCopy;
                    g.DrawImageUnscaled(cropped, safeBorder, safeBorder);
                }
                return output;
            }
        }
    }

    private static Rectangle[][] GetCells(string unitName)
    {
        if (String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(121, 17, 338, 231), Rectangle.FromLTRB(348, 17, 567, 231),
                    Rectangle.FromLTRB(578, 17, 795, 231), Rectangle.FromLTRB(807, 17, 1025, 231),
                    Rectangle.FromLTRB(1036, 17, 1254, 231)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(121, 248, 338, 467), Rectangle.FromLTRB(348, 248, 567, 467),
                    Rectangle.FromLTRB(578, 248, 795, 467), Rectangle.FromLTRB(807, 248, 1025, 467)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(121, 483, 302, 698), Rectangle.FromLTRB(312, 483, 493, 698),
                    Rectangle.FromLTRB(502, 483, 683, 698), Rectangle.FromLTRB(692, 483, 873, 698),
                    Rectangle.FromLTRB(883, 483, 1064, 698), Rectangle.FromLTRB(1074, 483, 1254, 698)
                }
            };
        }

        if (String.Equals(unitName, "goblin-rider", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(75, 0, 355, 210), Rectangle.FromLTRB(356, 0, 615, 210),
                    Rectangle.FromLTRB(616, 0, 830, 210), Rectangle.FromLTRB(831, 0, 1060, 210),
                    Rectangle.FromLTRB(1061, 0, 1280, 210)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(75, 211, 340, 407), Rectangle.FromLTRB(341, 211, 590, 407),
                    Rectangle.FromLTRB(591, 211, 830, 407), Rectangle.FromLTRB(831, 211, 1060, 407)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(75, 408, 330, 575), Rectangle.FromLTRB(331, 408, 580, 575),
                    Rectangle.FromLTRB(581, 408, 810, 575), Rectangle.FromLTRB(811, 408, 1050, 575),
                    Rectangle.FromLTRB(1051, 408, 1280, 575)
                }
            };
        }

        if (String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(118, 14, 341, 233), Rectangle.FromLTRB(347, 14, 569, 233),
                    Rectangle.FromLTRB(575, 14, 798, 233), Rectangle.FromLTRB(804, 14, 1027, 233),
                    Rectangle.FromLTRB(1033, 14, 1256, 233)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(118, 246, 341, 467), Rectangle.FromLTRB(347, 246, 569, 467),
                    Rectangle.FromLTRB(575, 246, 798, 467), Rectangle.FromLTRB(804, 246, 1027, 467)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(88, 481, 303, 676), Rectangle.FromLTRB(309, 481, 495, 676),
                    Rectangle.FromLTRB(501, 481, 685, 676), Rectangle.FromLTRB(691, 481, 873, 676),
                    Rectangle.FromLTRB(882, 481, 1064, 676), Rectangle.FromLTRB(1073, 481, 1256, 676)
                }
            };
        }

        if (String.Equals(unitName, "ancient-treant", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(118, 2, 312, 190), Rectangle.FromLTRB(322, 2, 514, 190),
                    Rectangle.FromLTRB(522, 2, 724, 190), Rectangle.FromLTRB(734, 2, 1010, 190),
                    Rectangle.FromLTRB(1012, 2, 1202, 190)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(112, 192, 312, 390), Rectangle.FromLTRB(322, 192, 512, 390),
                    Rectangle.FromLTRB(522, 192, 718, 390), Rectangle.FromLTRB(728, 192, 926, 390)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(112, 392, 310, 573), Rectangle.FromLTRB(316, 392, 500, 573),
                    Rectangle.FromLTRB(500, 392, 684, 573), Rectangle.FromLTRB(680, 392, 876, 573),
                    Rectangle.FromLTRB(878, 392, 1068, 573), Rectangle.FromLTRB(1092, 392, 1276, 573)
                }
            };
        }

        if (String.Equals(unitName, "skeleton-spear", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(96, 23, 314, 241), Rectangle.FromLTRB(324, 23, 540, 241),
                    Rectangle.FromLTRB(552, 23, 791, 241), Rectangle.FromLTRB(804, 23, 1027, 241),
                    Rectangle.FromLTRB(1038, 23, 1252, 241)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(96, 259, 313, 474), Rectangle.FromLTRB(324, 259, 527, 474),
                    Rectangle.FromLTRB(538, 259, 745, 474), Rectangle.FromLTRB(756, 259, 965, 474)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(96, 490, 280, 693), Rectangle.FromLTRB(289, 490, 475, 693),
                    Rectangle.FromLTRB(485, 490, 669, 693), Rectangle.FromLTRB(679, 490, 868, 693),
                    Rectangle.FromLTRB(878, 490, 1062, 693), Rectangle.FromLTRB(1071, 490, 1254, 693)
                }
            };
        }

        return new Rectangle[][] {
            new Rectangle[] {
                Rectangle.FromLTRB(4, 2, 238, 230), Rectangle.FromLTRB(242, 2, 478, 230),
                Rectangle.FromLTRB(482, 2, 775, 230), Rectangle.FromLTRB(779, 2, 1040, 230),
                Rectangle.FromLTRB(1044, 2, 1276, 230)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(4, 236, 238, 458), Rectangle.FromLTRB(242, 236, 477, 458),
                Rectangle.FromLTRB(481, 236, 711, 458), Rectangle.FromLTRB(715, 236, 941, 458)
            },
            new Rectangle[] {
                Rectangle.FromLTRB(4, 464, 212, 658), Rectangle.FromLTRB(216, 464, 426, 658),
                Rectangle.FromLTRB(430, 464, 638, 658), Rectangle.FromLTRB(642, 464, 852, 658),
                Rectangle.FromLTRB(856, 464, 1064, 658), Rectangle.FromLTRB(1068, 464, 1276, 658)
            }
        };
    }

    private static Bitmap PlaceOnCanvas(Bitmap frame, int width, int height)
    {
        var canvas = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(canvas))
        {
            g.Clear(Color.Transparent);
            g.CompositingMode = CompositingMode.SourceCopy;
            int x = (width - frame.Width) / 2;
            int y = height - frame.Height;
            g.DrawImageUnscaled(frame, x, y);
        }
        return canvas;
    }

    public static string[] Process(string inputPath, string outputDirectory, string unitName)
    {
        System.IO.Directory.CreateDirectory(outputDirectory);
        var outputs = new List<string>();
        using (var source = new Bitmap(inputPath))
        {
            Rectangle[][] cells = GetCells(unitName);
            bool magenta = String.Equals(unitName, "ancient-treant", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase);
            string[] names = { "attack", "hit", "death" };
            int[] counts = String.Equals(unitName, "skeleton-spear", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "goblin-rider", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase)
                ? new int[] { 5, 4, 5 }
                : new int[] { 5, 4, 6 };

            for (int row = 0; row < 3; row++)
            for (int frame = 0; frame < counts[row]; frame++)
            {
                Rectangle cell = cells[row][frame];
                bool clearWhite = String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
                    && row == 2 && frame == 0;
                using (var output = Extract(source, cell, magenta, clearWhite))
                {
                    // The Ancient Treant's final death pose should face the opposite direction.
                    // Keep this deterministic adjustment here so regenerating the frames preserves it.
                    if (String.Equals(unitName, "ancient-treant", StringComparison.OrdinalIgnoreCase)
                        && row == 2 && frame == 5)
                    {
                        output.RotateFlip(RotateFlipType.RotateNoneFlipX);
                    }

                    string path = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png");
                    if (String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase))
                    {
                        using (var normalized = PlaceOnCanvas(output, 250, 250))
                            normalized.Save(path, ImageFormat.Png);
                    }
                    else
                    {
                        output.Save(path, ImageFormat.Png);
                    }
                    outputs.Add(path);
                }
            }
        }
        return outputs.ToArray();
    }

    public static void CreatePreview(string[] paths, string unitName, string previewPath)
    {
        const int columns = 6, cellWidth = 280, cellHeight = 250, headerHeight = 64;
        int[] counts = String.Equals(unitName, "skeleton-spear", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "goblin-rider", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase)
            ? new int[] { 5, 4, 5 }
            : new int[] { 5, 4, 6 };
        string[] labels = { "ATTACK", "HIT", "DEATH" };
        using (var preview = new Bitmap(columns * cellWidth, headerHeight + 3 * cellHeight, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(preview))
        using (var title = new Font("Malgun Gothic", 22, FontStyle.Bold))
        using (var label = new Font("Malgun Gothic", 14, FontStyle.Bold))
        using (var brush = new SolidBrush(Color.FromArgb(238, 234, 220)))
        using (var pen = new Pen(Color.FromArgb(94, 98, 88), 2))
        {
            g.Clear(Color.FromArgb(25, 28, 26));
            g.DrawString(unitName + " / GREEN SCREEN REVIEW", title, brush, 20, 14);
            int index = 0;
            for (int row = 0; row < 3; row++)
            for (int col = 0; col < counts[row]; col++, index++)
            {
                int x = col * cellWidth, y = headerHeight + row * cellHeight;
                g.DrawRectangle(pen, x + 4, y + 4, cellWidth - 8, cellHeight - 8);
                g.DrawString(labels[row] + " " + (col + 1), label, brush, x + 12, y + 10);
                using (var frame = new Bitmap(paths[index]))
                {
                    int aw = cellWidth - 24, ah = cellHeight - 48;
                    double scale = Math.Min(1.0, Math.Min((double)aw / frame.Width, (double)ah / frame.Height));
                    int dw = (int)Math.Round(frame.Width * scale), dh = (int)Math.Round(frame.Height * scale);
                    g.DrawImage(frame, new Rectangle(x + (cellWidth - dw) / 2, y + cellHeight - 10 - dh, dw, dh));
                }
            }
            preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$paths = [GreenAnimationProcessor]::Process($resolvedInput, $resolvedOutput, $UnitName)
$preview = Join-Path $resolvedOutput ($UnitName + "-preview.png")
[GreenAnimationProcessor]::CreatePreview($paths, $UnitName, $preview)
Write-Output ("Processed: {0}" -f $UnitName)
Write-Output ("Frames: {0}" -f $paths.Count)
Write-Output ("Preview: {0}" -f $preview)
