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
    private static void ClearEdgeStrip(Bitmap bitmap, int leftWidth, int rightWidth)
    {
        for (int y = 0; y < bitmap.Height; y++)
        {
            for (int x = 0; x < leftWidth; x++)
                bitmap.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
            for (int x = Math.Max(0, bitmap.Width - rightWidth); x < bitmap.Width; x++)
                bitmap.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
        }
    }

    private static void KeepLargestComponent(Bitmap bitmap)
    {
        var visited = new bool[bitmap.Width, bitmap.Height];
        List<Point> largest = null;
        for (int y = 0; y < bitmap.Height; y++)
        for (int x = 0; x < bitmap.Width; x++)
        {
            if (visited[x, y] || bitmap.GetPixel(x, y).A <= 8) continue;
            var component = new List<Point>();
            var queue = new Queue<Point>();
            queue.Enqueue(new Point(x, y));
            visited[x, y] = true;
            while (queue.Count > 0)
            {
                Point point = queue.Dequeue();
                component.Add(point);
                int[] dx = { -1, 1, 0, 0 };
                int[] dy = { 0, 0, -1, 1 };
                for (int i = 0; i < 4; i++)
                {
                    int nx = point.X + dx[i], ny = point.Y + dy[i];
                    if (nx < 0 || ny < 0 || nx >= bitmap.Width || ny >= bitmap.Height || visited[nx, ny]) continue;
                    visited[nx, ny] = true;
                    if (bitmap.GetPixel(nx, ny).A > 8) queue.Enqueue(new Point(nx, ny));
                }
            }
            if (largest == null || component.Count > largest.Count) largest = component;
        }

        var keep = new HashSet<int>();
        if (largest != null)
            foreach (Point point in largest) keep.Add(point.Y * bitmap.Width + point.X);
        for (int y = 0; y < bitmap.Height; y++)
        for (int x = 0; x < bitmap.Width; x++)
            if (!keep.Contains(y * bitmap.Width + x)) bitmap.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
    }

    private static Color RemoveChroma(Color c, bool magenta, bool strictMagenta = false)
    {
        if (magenta)
        {
            if (strictMagenta)
            {
                int strictExcess = Math.Min(c.R, c.B) - c.G;
                if (c.R >= 120 && c.B >= 112 && c.G <= 130 && strictExcess >= 42)
                {
                    if (strictExcess >= 82) return Color.Transparent;
                    int strictAlpha = (int)Math.Round(255.0 * (82 - strictExcess) / 40.0);
                    strictAlpha = Math.Max(0, Math.Min(255, strictAlpha));
                    int neutral = Math.Max(c.G, Math.Min(c.R, c.B) / 3);
                    return Color.FromArgb(strictAlpha, Math.Min(c.R, neutral + 10), c.G, Math.Min(c.B, neutral + 10));
                }
                if (c.R >= 48 && c.B >= 44 && strictExcess >= 10)
                {
                    int spillBase = Math.Max(c.G, Math.Min(c.R, c.B) / 3);
                    return Color.FromArgb(c.A, Math.Min(c.R, spillBase + 10), c.G, Math.Min(c.B, spillBase + 10));
                }
                return c;
            }

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

    private static Bitmap Extract(Bitmap source, Rectangle cell, bool magenta, bool clearWhite = false, bool strictMagenta = false, bool clearNeutralWhite = false)
    {
        using (var keyed = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb))
        {
            int left = cell.Width, top = cell.Height, right = -1, bottom = -1;
            for (int y = 0; y < cell.Height; y++)
            for (int x = 0; x < cell.Width; x++)
            {
                Color input = source.GetPixel(cell.X + x, cell.Y + y);
                int inputMax = Math.Max(input.R, Math.Max(input.G, input.B));
                int inputMin = Math.Min(input.R, Math.Min(input.G, input.B));
                int inputRange = inputMax - inputMin;
                bool removeWhite = clearWhite && (inputMin >= 242
                    || (clearNeutralWhite && inputMin >= 168 && inputRange <= 18));
                Color output = removeWhite
                    ? Color.Transparent
                    : RemoveChroma(input, magenta, strictMagenta);

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
        if (String.Equals(unitName, "soul-reaper", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(50, 0, 205, 250), Rectangle.FromLTRB(295, 0, 465, 250),
                    Rectangle.FromLTRB(540, 0, 835, 250), Rectangle.FromLTRB(835, 0, 975, 250),
                    Rectangle.FromLTRB(1060, 0, 1270, 250)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(70, 245, 215, 500), Rectangle.FromLTRB(315, 245, 480, 500),
                    Rectangle.FromLTRB(560, 245, 720, 500), Rectangle.FromLTRB(800, 245, 955, 500)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(45, 480, 195, 714), Rectangle.FromLTRB(240, 480, 435, 714),
                    Rectangle.FromLTRB(440, 480, 645, 714), Rectangle.FromLTRB(645, 480, 850, 714),
                    Rectangle.FromLTRB(870, 480, 1065, 714), Rectangle.FromLTRB(1065, 480, 1275, 714)
                }
            };
        }

        if (String.Equals(unitName, "skeleton-cavalry", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(0, 0, 345, 270), Rectangle.FromLTRB(345, 0, 590, 270),
                    Rectangle.FromLTRB(590, 0, 830, 270), Rectangle.FromLTRB(830, 0, 1065, 270),
                    Rectangle.FromLTRB(1065, 0, 1280, 270)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(0, 245, 350, 500), Rectangle.FromLTRB(350, 245, 585, 500),
                    Rectangle.FromLTRB(585, 245, 815, 500), Rectangle.FromLTRB(815, 245, 1080, 500)
                },
                new Rectangle[] {
                    // The death poses have clean vertical gaps between them. Crop inside
                    // those gaps so no sword, horse, or debris leaks from a neighbour.
                    Rectangle.FromLTRB(120, 480, 309, 714), Rectangle.FromLTRB(316, 480, 495, 714),
                    Rectangle.FromLTRB(506, 480, 686, 714), Rectangle.FromLTRB(698, 480, 878, 714),
                    Rectangle.FromLTRB(888, 480, 1068, 714), Rectangle.FromLTRB(1083, 480, 1270, 714)
                }
            };
        }

        if (String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(0, 0, 285, 270), Rectangle.FromLTRB(285, 0, 510, 270),
                    Rectangle.FromLTRB(510, 0, 755, 270), Rectangle.FromLTRB(755, 0, 1010, 270),
                    Rectangle.FromLTRB(1010, 0, 1280, 270)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(0, 260, 285, 495), Rectangle.FromLTRB(285, 260, 505, 495),
                    Rectangle.FromLTRB(505, 260, 725, 495), Rectangle.FromLTRB(725, 260, 975, 495)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(0, 495, 255, 714), Rectangle.FromLTRB(255, 495, 460, 714),
                    Rectangle.FromLTRB(460, 495, 660, 714), Rectangle.FromLTRB(660, 495, 870, 714),
                    Rectangle.FromLTRB(870, 495, 1080, 714), Rectangle.FromLTRB(1080, 495, 1280, 714)
                }
            };
        }

        if (String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 7, 321, 248), Rectangle.FromLTRB(328, 7, 520, 248),
                    Rectangle.FromLTRB(528, 7, 797, 248), Rectangle.FromLTRB(804, 7, 1046, 248),
                    Rectangle.FromLTRB(1054, 7, 1273, 248)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 260, 301, 484), Rectangle.FromLTRB(306, 260, 496, 484),
                    Rectangle.FromLTRB(501, 260, 696, 484), Rectangle.FromLTRB(701, 260, 895, 484)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 495, 280, 691), Rectangle.FromLTRB(285, 495, 470, 691),
                    Rectangle.FromLTRB(475, 495, 655, 691), Rectangle.FromLTRB(660, 495, 842, 691),
                    Rectangle.FromLTRB(846, 495, 1040, 691), Rectangle.FromLTRB(1045, 495, 1230, 691)
                }
            };
        }

        if (String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 8, 318, 247), Rectangle.FromLTRB(329, 8, 518, 247),
                    Rectangle.FromLTRB(529, 8, 794, 247), Rectangle.FromLTRB(805, 8, 1042, 247),
                    Rectangle.FromLTRB(1055, 8, 1272, 247)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 263, 298, 482), Rectangle.FromLTRB(310, 263, 510, 482),
                    Rectangle.FromLTRB(532, 263, 698, 482), Rectangle.FromLTRB(712, 263, 894, 482)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(104, 500, 278, 688), Rectangle.FromLTRB(290, 500, 468, 688),
                    Rectangle.FromLTRB(480, 500, 662, 688), Rectangle.FromLTRB(674, 500, 838, 688),
                    Rectangle.FromLTRB(850, 500, 1036, 688), Rectangle.FromLTRB(1048, 500, 1228, 688)
                }
            };
        }

        if (String.Equals(unitName, "ice-lord", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(90, 140, 305, 395), Rectangle.FromLTRB(305, 140, 520, 395),
                    Rectangle.FromLTRB(520, 140, 750, 395), Rectangle.FromLTRB(750, 140, 995, 395),
                    Rectangle.FromLTRB(995, 140, 1265, 395)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(90, 395, 305, 600), Rectangle.FromLTRB(305, 395, 515, 600),
                    Rectangle.FromLTRB(515, 395, 725, 600), Rectangle.FromLTRB(725, 395, 935, 600)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(90, 600, 290, 825), Rectangle.FromLTRB(290, 600, 485, 825),
                    Rectangle.FromLTRB(485, 600, 680, 825), Rectangle.FromLTRB(680, 600, 875, 825),
                    Rectangle.FromLTRB(875, 600, 1070, 825), Rectangle.FromLTRB(1070, 600, 1275, 825)
                }
            };
        }

        if (String.Equals(unitName, "goblin-commoner", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(110, 0, 320, 205), Rectangle.FromLTRB(320, 0, 520, 205),
                    Rectangle.FromLTRB(520, 0, 735, 205), Rectangle.FromLTRB(735, 0, 985, 205),
                    Rectangle.FromLTRB(985, 0, 1170, 205)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(110, 205, 320, 405), Rectangle.FromLTRB(320, 205, 510, 405),
                    Rectangle.FromLTRB(510, 205, 730, 405), Rectangle.FromLTRB(730, 205, 930, 405)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(100, 405, 300, 575), Rectangle.FromLTRB(300, 405, 490, 575),
                    Rectangle.FromLTRB(490, 405, 690, 575), Rectangle.FromLTRB(690, 405, 890, 575),
                    Rectangle.FromLTRB(890, 405, 1095, 575), Rectangle.FromLTRB(1095, 495, 1280, 575)
                }
            };
        }

        if (String.Equals(unitName, "boulder-ogre", StringComparison.OrdinalIgnoreCase))
        {
            return new Rectangle[][] {
                new Rectangle[] {
                    Rectangle.FromLTRB(120, 18, 338, 242), Rectangle.FromLTRB(348, 18, 568, 242),
                    Rectangle.FromLTRB(578, 18, 797, 242), Rectangle.FromLTRB(807, 18, 1027, 242),
                    Rectangle.FromLTRB(1036, 18, 1255, 242)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(120, 252, 339, 475), Rectangle.FromLTRB(348, 252, 569, 475),
                    Rectangle.FromLTRB(578, 252, 798, 475), Rectangle.FromLTRB(807, 252, 1028, 475)
                },
                new Rectangle[] {
                    Rectangle.FromLTRB(120, 493, 303, 714), Rectangle.FromLTRB(311, 493, 493, 714),
                    Rectangle.FromLTRB(501, 493, 683, 714), Rectangle.FromLTRB(691, 493, 873, 714),
                    Rectangle.FromLTRB(882, 493, 1064, 714), Rectangle.FromLTRB(1073, 493, 1255, 714)
                }
            };
        }

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
                || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "ice-lord", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "skeleton-cavalry", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "soul-reaper", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "goblin-commoner", StringComparison.OrdinalIgnoreCase);
            bool strictMagenta = String.Equals(unitName, "ice-lord", StringComparison.OrdinalIgnoreCase);
            string[] names = { "attack", "hit", "death" };
            int[] counts = String.Equals(unitName, "skeleton-spear", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "goblin-rider", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase)
                || String.Equals(unitName, "boulder-ogre", StringComparison.OrdinalIgnoreCase)
                ? new int[] { 5, 4, 5 }
                : new int[] { 5, 4, 6 };

            for (int row = 0; row < 3; row++)
            for (int frame = 0; frame < counts[row]; frame++)
            {
                Rectangle cell = cells[row][frame];
                bool clearWhite = (String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
                    && row == 2 && frame == 0)
                    || String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
                    || String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase);
                bool clearNeutralWhite = String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
                    || String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase);
                using (var output = Extract(source, cell, magenta, clearWhite, strictMagenta, clearNeutralWhite))
                {
                    // The Ancient Treant's final death pose should face the opposite direction.
                    // Keep this deterministic adjustment here so regenerating the frames preserves it.
                    if (String.Equals(unitName, "ancient-treant", StringComparison.OrdinalIgnoreCase)
                        && row == 2 && frame == 5)
                    {
                        output.RotateFlip(RotateFlipType.RotateNoneFlipX);
                    }

                    string path = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png");
                    if (String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase) && row != 1)
                        path = System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 2).ToString("00") + ".png");
                    if (String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "boulder-ogre", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "ice-lord", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "skeleton-cavalry", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "soul-reaper", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(unitName, "goblin-commoner", StringComparison.OrdinalIgnoreCase))
                    {
                        int canvasWidth = String.Equals(unitName, "skeleton-cavalry", StringComparison.OrdinalIgnoreCase)
                            ? 320
                            : String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase) ? 300 : 250;
                        int canvasHeight = String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase) ? 270 : 250;
                        using (var normalized = PlaceOnCanvas(output, canvasWidth, canvasHeight))
                        {
                            // Ice Lord hit poses sit very close together in the source sheet.
                            // Remove only the detached scythe tips leaking in from adjacent cells.
                            if (String.Equals(unitName, "ice-lord", StringComparison.OrdinalIgnoreCase) && row == 1)
                            {
                                if (frame == 1) ClearEdgeStrip(normalized, 28, 0);
                                if (frame == 2) ClearEdgeStrip(normalized, 32, 26);
                            }
                            if (String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
                                || String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase))
                                KeepLargestComponent(normalized);
                            if (String.Equals(unitName, "ghoul", StringComparison.OrdinalIgnoreCase)
                                && row == 2 && frame == 5)
                            {
                                // Remove only the disconnected Gemini sparkle above the final corpse.
                                for (int y = 0; y < 92; y++)
                                for (int x = 145; x < normalized.Width; x++)
                                    normalized.SetPixel(x, y, Color.Transparent);
                            }
                            normalized.Save(path, ImageFormat.Png);
                        }
                    }
                    else
                    {
                        output.Save(path, ImageFormat.Png);
                    }
                    outputs.Add(path);
                }
            }

            if (String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase))
            {
                string hitStart = System.IO.Path.Combine(outputDirectory, "hit-01.png");
                System.IO.File.Copy(hitStart, System.IO.Path.Combine(outputDirectory, "attack-01.png"), true);
                System.IO.File.Copy(hitStart, System.IO.Path.Combine(outputDirectory, "death-01.png"), true);
                outputs.Clear();
                int[] yetiCounts = { 6, 4, 7 };
                for (int row = 0; row < 3; row++)
                for (int frame = 0; frame < yetiCounts[row]; frame++)
                    outputs.Add(System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png"));
            }

            if (String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase))
            {
                // Duplicate the settled fifth attack pose at the front, shifting the
                // original five frames right so no source pose is discarded or resampled.
                for (int frame = 5; frame >= 1; frame--)
                {
                    string sourcePath = System.IO.Path.Combine(outputDirectory, "attack-" + frame.ToString("00") + ".png");
                    string shiftedPath = System.IO.Path.Combine(outputDirectory, "attack-" + (frame + 1).ToString("00") + ".png");
                    System.IO.File.Copy(sourcePath, shiftedPath, true);
                }
                System.IO.File.Copy(
                    System.IO.Path.Combine(outputDirectory, "attack-06.png"),
                    System.IO.Path.Combine(outputDirectory, "attack-01.png"),
                    true);
                outputs.Clear();
                int[] minotaurCounts = { 6, 4, 6 };
                for (int row = 0; row < 3; row++)
                for (int frame = 0; frame < minotaurCounts[row]; frame++)
                    outputs.Add(System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png"));
            }

            if (String.Equals(unitName, "skeleton-cavalry", StringComparison.OrdinalIgnoreCase))
            {
                // Requested attack order: source 1, 2, 3, 5, 1. Keep all copied
                // frames byte-identical and discard source attack frame 4.
                string attack01 = System.IO.Path.Combine(outputDirectory, "attack-01.png");
                string attack04 = System.IO.Path.Combine(outputDirectory, "attack-04.png");
                string attack05 = System.IO.Path.Combine(outputDirectory, "attack-05.png");
                byte[] firstAttack = System.IO.File.ReadAllBytes(attack01);
                System.IO.File.Copy(attack05, attack04, true);
                System.IO.File.WriteAllBytes(attack05, firstAttack);
            }

            if (String.Equals(unitName, "soul-reaper", StringComparison.OrdinalIgnoreCase))
            {
                // Requested attack order: source 5, 1, 2, 3, 4, 5.
                // Shift the original five frames right, then duplicate source 5 at front.
                for (int frame = 5; frame >= 1; frame--)
                {
                    string sourcePath = System.IO.Path.Combine(outputDirectory, "attack-" + frame.ToString("00") + ".png");
                    string shiftedPath = System.IO.Path.Combine(outputDirectory, "attack-" + (frame + 1).ToString("00") + ".png");
                    System.IO.File.Copy(sourcePath, shiftedPath, true);
                }
                System.IO.File.Copy(
                    System.IO.Path.Combine(outputDirectory, "attack-06.png"),
                    System.IO.Path.Combine(outputDirectory, "attack-01.png"),
                    true);
                outputs.Clear();
                int[] soulReaperCounts = { 6, 4, 6 };
                for (int row = 0; row < 3; row++)
                for (int frame = 0; frame < soulReaperCounts[row]; frame++)
                    outputs.Add(System.IO.Path.Combine(outputDirectory, names[row] + "-" + (frame + 1).ToString("00") + ".png"));
            }
        }
        return outputs.ToArray();
    }

    public static void CreatePreview(string[] paths, string unitName, string previewPath)
    {
        int columns = String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase) ? 7 : 6;
        const int cellWidth = 280, cellHeight = 250, headerHeight = 64;
        int[] counts = String.Equals(unitName, "yeti", StringComparison.OrdinalIgnoreCase)
            ? new int[] { 6, 4, 7 }
            : String.Equals(unitName, "minotaur", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "soul-reaper", StringComparison.OrdinalIgnoreCase)
            ? new int[] { 6, 4, 6 }
            : String.Equals(unitName, "skeleton-spear", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "stone-golem", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "goblin-rider", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "orc-warrior", StringComparison.OrdinalIgnoreCase)
            || String.Equals(unitName, "boulder-ogre", StringComparison.OrdinalIgnoreCase)
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
