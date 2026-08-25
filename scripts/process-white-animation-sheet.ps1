param(
  [Parameter(Mandatory = $true)][string]$InputPath,
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
using System.IO;

public static class WhiteAnimationSheetProcessor
{
    private struct Span { public int Start, End; public Span(int start, int end) { Start = start; End = end; } }

    private static bool IsLine(Color c)
    {
        int high = Math.Max(c.R, Math.Max(c.G, c.B));
        int low = Math.Min(c.R, Math.Min(c.G, c.B));
        return high < 75 && high - low < 28;
    }

    private static int HorizontalScore(Bitmap source, int y)
    {
        int score = 0, run = 0;
        int minimumRun = Math.Max(70, source.Width / 18);
        for (int x = 0; x < source.Width; x++)
        {
            if (IsLine(source.GetPixel(x, y))) run++;
            else { if (run >= minimumRun) score += run * 10; run = 0; }
        }
        if (run >= minimumRun) score += run * 10;
        return score;
    }

    private static List<Span> HorizontalRuns(Bitmap source, int y)
    {
        var result = new List<Span>();
        int start = -1;
        int minimumRun = Math.Max(70, source.Width / 18);
        for (int x = 0; x <= source.Width; x++)
        {
            bool line = x < source.Width && IsLine(source.GetPixel(x, y));
            if (line && start < 0) start = x;
            if (!line && start >= 0)
            {
                if (x - start >= minimumRun) result.Add(new Span(start, x - 1));
                start = -1;
            }
        }
        return result;
    }

    private static List<int> HorizontalLines(Bitmap source)
    {
        var groups = new List<List<int>>();
        for (int y = 0; y < source.Height; y++)
        {
            int score = HorizontalScore(source, y);
            if (score <= 0) continue;
            if (groups.Count == 0 || y - groups[groups.Count - 1][groups[groups.Count - 1].Count - 1] > 2)
                groups.Add(new List<int>());
            groups[groups.Count - 1].Add(y);
        }
        var result = new List<int>();
        foreach (var group in groups)
        {
            int bestY = group[0], bestScore = -1;
            foreach (int y in group)
            {
                int score = HorizontalScore(source, y);
                if (score > bestScore) { bestScore = score; bestY = y; }
            }
            result.Add(bestY);
        }
        return result;
    }

    private static List<Span> VerticalLines(Bitmap source, int top, int bottom)
    {
        var values = new List<int>();
        int height = Math.Max(1, bottom - top + 1);
        for (int x = 0; x < source.Width; x++)
        {
            int matches = 0;
            for (int y = top; y <= bottom; y++) if (IsLine(source.GetPixel(x, y))) matches++;
            if (matches >= height * .56) values.Add(x);
        }
        var groups = new List<Span>();
        foreach (int x in values)
        {
            if (groups.Count == 0 || x - groups[groups.Count - 1].End > 1) groups.Add(new Span(x, x));
            else { Span span = groups[groups.Count - 1]; span.End = x; groups[groups.Count - 1] = span; }
        }
        return groups;
    }

    private static List<Rectangle> DetectFrames(Bitmap source, int row, int expected)
    {
        var horizontal = HorizontalLines(source);
        double[,] topRanges = { { 0.00, 0.16 }, { 0.20, 0.52 }, { 0.50, 0.82 } };
        List<Rectangle> bestFrames = null;
        double bestError = Double.MaxValue;
        var diagnostics = new List<string>();
        for (int topIndex = 0; topIndex < horizontal.Count; topIndex++)
        {
            int top = horizontal[topIndex];
            double topRatio = (double)top / source.Height;
            if (topRatio < topRanges[row, 0] || topRatio > topRanges[row, 1]) continue;
            var bottomCandidates = new List<int>();
            for (int candidateIndex = topIndex + 1; candidateIndex < horizontal.Count; candidateIndex++)
                bottomCandidates.Add(horizontal[candidateIndex]);
            if (row == 2 && (bottomCandidates.Count == 0 || bottomCandidates[bottomCandidates.Count - 1] < source.Height - 2))
                bottomCandidates.Add(source.Height - 1);
            for (int bottomIndex = 0; bottomIndex < bottomCandidates.Count; bottomIndex++)
            {
                int bottom = bottomCandidates[bottomIndex];
                int frameHeight = bottom - top;
                if (frameHeight < source.Height * .17 || frameHeight > source.Height * .46) continue;
                var topRuns = HorizontalRuns(source, top);
                var bottomRuns = HorizontalRuns(source, bottom);
                var frames = new List<Rectangle>();
                bool imageEdgeIsBottom = bottom >= source.Height - 2;
                if (topRuns.Count == expected && (imageEdgeIsBottom || (bottomRuns.Count >= expected - 1 && bottomRuns.Count <= expected + 2)))
                {
                    for (int index = 0; index < expected; index++)
                    {
                        const int inset = 6;
                        Span upper = topRuns[index];
                        int left = upper.Start + inset;
                        int right = upper.End - inset;
                        frames.Add(Rectangle.FromLTRB(left, top + inset, right, bottom - inset));
                    }
                }
                diagnostics.Add(top + "-" + bottom + ":topRuns=" + topRuns.Count + ",bottomRuns=" + bottomRuns.Count + ",frames=" + frames.Count);
                if (frames.Count != expected) continue;
                double targetTop = row == 0 ? .01 : row == 1 ? .34 : .68;
                double error = Math.Abs(topRatio - targetTop) + Math.Abs(frameHeight - source.Height * .30) / source.Height * .15;
                if (error < bestError) { bestError = error; bestFrames = frames; }
            }
        }
        if (bestFrames == null)
            throw new InvalidOperationException("Expected " + expected + " frame boxes for row " + row + ". Horizontal=" +
                String.Join(",", horizontal) + "; candidates=" + String.Join(" | ", diagnostics));
        return bestFrames;
    }

    private static Bitmap Extract(Bitmap source, Rectangle rectangle)
    {
        using (var crop = source.Clone(rectangle, PixelFormat.Format32bppArgb))
        {
            // Some uploaded sheets are clipped at the image edge, leaving part of the
            // printed frame box inside the crop. Remove only long, dark, straight runs
            // close to an edge; character contours are shorter and irregular.
            int edgeBand = Math.Min(42, Math.Min(crop.Width, crop.Height) / 5);
            for (int y = crop.Height - edgeBand; y < crop.Height; y++)
            {
                int longest = 0, run = 0;
                for (int x = 0; x < crop.Width; x++)
                {
                    if (IsLine(crop.GetPixel(x, y))) { run++; longest = Math.Max(longest, run); }
                    else run = 0;
                }
                if (longest < crop.Width * .60) continue;
                for (int clearY = Math.Max(0, y - 3); clearY <= Math.Min(crop.Height - 1, y + 3); clearY++)
                    for (int x = 0; x < crop.Width; x++) crop.SetPixel(x, clearY, Color.Transparent);
            }

            int left = crop.Width, top = crop.Height, right = -1, bottom = -1;
            for (int y = 0; y < crop.Height; y++)
            {
                for (int x = 0; x < crop.Width; x++)
                {
                    Color color = crop.GetPixel(x, y);
                    int high = Math.Max(color.R, Math.Max(color.G, color.B));
                    int low = Math.Min(color.R, Math.Min(color.G, color.B));
                    if (low >= 238 && high - low <= 22)
                    {
                        crop.SetPixel(x, y, Color.FromArgb(0, color.R, color.G, color.B));
                        continue;
                    }
                    if (color.A > 0) { left = Math.Min(left, x); top = Math.Min(top, y); right = Math.Max(right, x); bottom = Math.Max(bottom, y); }
                }
            }
            if (right < left || bottom < top) throw new InvalidOperationException("No foreground remained in a frame.");
            int pad = 2;
            left = Math.Max(0, left - pad); top = Math.Max(0, top - pad);
            right = Math.Min(crop.Width - 1, right + pad); bottom = Math.Min(crop.Height - 1, bottom + pad);
            Rectangle bounds = Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
            using (var foreground = crop.Clone(bounds, PixelFormat.Format32bppArgb))
            {
                var output = new Bitmap(384, 384, PixelFormat.Format32bppArgb);
                using (var graphics = Graphics.FromImage(output))
                {
                    graphics.Clear(Color.Transparent);
                    graphics.CompositingMode = CompositingMode.SourceOver;
                    graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    graphics.SmoothingMode = SmoothingMode.HighQuality;
                    double scale = Math.Min(356.0 / foreground.Width, 350.0 / foreground.Height);
                    int width = Math.Max(1, (int)Math.Round(foreground.Width * scale));
                    int height = Math.Max(1, (int)Math.Round(foreground.Height * scale));
                    graphics.DrawImage(foreground, new Rectangle((384 - width) / 2, 374 - height, width, height));
                }
                return output;
            }
        }
    }

    public static void Process(string inputPath, string outputDirectory, string previewPath)
    {
        Directory.CreateDirectory(outputDirectory);
        using (var sourceFile = new Bitmap(inputPath))
        using (var source = new Bitmap(sourceFile.Width, sourceFile.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source)) graphics.DrawImageUnscaled(sourceFile, 0, 0);
            string[] motions = { "attack", "hit", "death" };
            int[] counts = { 5, 4, 6 };
            var previewFrames = new List<List<Bitmap>>();
            for (int row = 0; row < 3; row++)
            {
                var motionFrames = new List<Bitmap>();
                var rectangles = DetectFrames(source, row, counts[row]);
                for (int index = 0; index < rectangles.Count; index++)
                {
                    Bitmap frame = Extract(source, rectangles[index]);
                    string output = Path.Combine(outputDirectory, motions[row] + "-" + (index + 1).ToString("00") + ".png");
                    frame.Save(output, ImageFormat.Png);
                    motionFrames.Add(frame);
                }
                previewFrames.Add(motionFrames);
            }
            if (!String.IsNullOrWhiteSpace(previewPath))
            {
                using (var preview = new Bitmap(1100, 660, PixelFormat.Format32bppArgb))
                using (var graphics = Graphics.FromImage(preview))
                {
                    graphics.Clear(Color.FromArgb(45, 17, 12));
                    graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    for (int row = 0; row < previewFrames.Count; row++)
                    {
                        int cellWidth = 1100 / previewFrames[row].Count;
                        for (int index = 0; index < previewFrames[row].Count; index++)
                            graphics.DrawImage(previewFrames[row][index], new Rectangle(index * cellWidth + 4, row * 220 + 4, cellWidth - 8, 212));
                    }
                    preview.Save(previewPath, ImageFormat.Png);
                }
            }
            foreach (var motionFrames in previewFrames)
                foreach (Bitmap frame in motionFrames) frame.Dispose();
        }
    }
}
"@

Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
$resolvedPreview = if ($PreviewPath) { [System.IO.Path]::GetFullPath($PreviewPath) } else { "" }
[WhiteAnimationSheetProcessor]::Process($resolvedInput, $resolvedOutput, $resolvedPreview)
Write-Output "Processed: $resolvedInput -> $resolvedOutput"
