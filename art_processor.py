# art_processor.py
"""
Necromancer 12-Janggi Art Post-Processing Engine
Performs automated white-background removal, character bounding box normalization,
scaling (82% height), bottom alignment (8% margin), multi-resolution output, and HTML report generation.
"""

import os
import json
import math
import numpy as np
from PIL import Image, ImageFilter, ImageOps

class ArtProcessor:
    def __init__(self, workspace_dir=None):
        if workspace_dir is None:
            workspace_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_dir = workspace_dir
        self.art_dir = os.path.join(workspace_dir, "art")
        self.masters_dir = os.path.join(self.art_dir, "masters")
        self.approved_dir = os.path.join(self.art_dir, "approved")
        self.processed_dir = os.path.join(self.art_dir, "processed")
        self.reference_dir = os.path.join(self.art_dir, "reference")
        self.assets_dir = os.path.join(workspace_dir, "assets")
        self.registry_path = os.path.join(self.art_dir, "art_registry.json")
        
        # Ensure directories exist
        for d in [self.masters_dir, self.approved_dir, self.processed_dir, 
                  self.reference_dir, os.path.join(self.processed_dir, "512"),
                  os.path.join(self.processed_dir, "192"), os.path.join(self.processed_dir, "96")]:
            os.makedirs(d, exist_ok=True)
            
        self.registry = self.load_registry()

    def load_registry(self):
        if os.path.exists(self.registry_path):
            with open(self.registry_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def get_item(self, key):
        key_clean = key.lower().replace(".jpg", "").replace(".png", "")
        for item in self.registry:
            g_clean = item["game_filename"].lower().replace(".jpg", "").replace(".png", "")
            m_clean = item["master_filename"].lower().replace("-master.png", "")
            if key_clean == g_clean or key_clean == m_clean or key_clean == item["name"].lower():
                return item
        return None

    def remove_white_background(self, img, white_threshold=245, feather_range=15):
        """
        Converts white/near-white background pixels to transparent alpha channel
        with smooth anti-aliased edge matting to prevent white halos.
        """
        img = img.convert("RGBA")
        arr = np.array(img, dtype=np.float32)
        r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
        
        # Calculate brightness / distance from pure white (255, 255, 255)
        dist_from_white = np.sqrt((255.0 - r)**2 + (255.0 - g)**2 + (255.0 - b)**2)
        
        # Threshold: pure white (dist=0) -> alpha=0. Dark pixels (dist > feather_range) -> alpha=255
        alpha_map = np.clip((dist_from_white / float(feather_range)) * 255.0, 0, 255)
        
        # Combine with existing alpha if present
        final_alpha = np.minimum(a, alpha_map).astype(np.uint8)
        arr[:,:,3] = final_alpha
        
        processed_img = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
        return processed_img

    def find_bounding_box(self, img, alpha_threshold=10):
        """
        Returns (left, top, right, bottom) of non-transparent pixel bounding box.
        """
        alpha = np.array(img.split()[3])
        non_zero = np.argwhere(alpha > alpha_threshold)
        if non_zero.size == 0:
            return 0, 0, img.width, img.height
        
        top, left = non_zero.min(axis=0)
        bottom, right = non_zero.max(axis=0)
        return int(left), int(top), int(right + 1), int(bottom + 1)

    def normalize_canvas(self, transparent_img, target_size=2048, height_ratio=0.82, bottom_margin_ratio=0.08):
        """
        Normalizes character height to 82% of target_size, centers horizontally,
        aligns bottom foot to 8% margin from the bottom of target canvas.
        """
        left, top, right, bottom = self.find_bounding_box(transparent_img)
        bbox_w = right - left
        bbox_h = bottom - top
        
        if bbox_w <= 0 or bbox_h <= 0:
            return Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
            
        cropped_char = transparent_img.crop((left, top, right, bottom))
        
        # Target character height
        target_char_h = int(round(target_size * height_ratio))
        scale = target_char_h / float(bbox_h)
        target_char_w = int(round(bbox_w * scale))
        
        resized_char = cropped_char.resize((target_char_w, target_char_h), Image.Resampling.LANCZOS)
        
        # Canvas creation
        canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        
        # Alignment
        pos_x = (target_size - target_char_w) // 2
        bottom_margin = int(round(target_size * bottom_margin_ratio))
        pos_y = target_size - bottom_margin - target_char_h
        
        canvas.paste(resized_char, (pos_x, pos_y), resized_char)
        return canvas

    def process_master_image(self, input_path, item=None, deploy=False):
        """
        Full post-processing pipeline for a master image file.
        Generates 2048x2048 approved PNG, 512x512, 192x192, 96x96 images, and updates assets if deploy=True.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
            
        filename = os.path.basename(input_path)
        if item is None:
            item = self.get_item(filename)
            
        game_filename = item["game_filename"] if item else filename.replace("-master.png", ".jpg")
        base_name = os.path.splitext(game_filename)[0]
        
        raw_img = Image.open(input_path)
        
        # 1. Remove background
        transparent_img = self.remove_white_background(raw_img)
        
        # 2. Normalize canvas at 2048x2048
        master_2048 = self.normalize_canvas(transparent_img, target_size=2048, height_ratio=0.82, bottom_margin_ratio=0.08)
        
        # 3. Save approved master
        approved_path = os.path.join(self.approved_dir, f"{base_name}.png")
        master_2048.save(approved_path, "PNG")
        
        # 4. Generate multi-resolution PNG and JPG outputs
        res_outputs = {}
        for sz in [512, 192, 96]:
            sz_dir = os.path.join(self.processed_dir, str(sz))
            sz_img = master_2048.resize((sz, sz), Image.Resampling.LANCZOS)
            
            # Save PNG (transparent)
            png_path = os.path.join(sz_dir, f"{base_name}.png")
            sz_img.save(png_path, "PNG")
            
            # Save JPG (white background for legacy compatibility)
            jpg_bg = Image.new("RGB", (sz, sz), (255, 255, 255))
            jpg_bg.paste(sz_img, (0, 0), sz_img)
            jpg_path = os.path.join(sz_dir, f"{base_name}.jpg")
            jpg_bg.save(jpg_path, "JPEG", quality=95)
            
            res_outputs[sz] = {"png": png_path, "jpg": jpg_path}
            
        # 5. Optionally deploy to assets directory
        if deploy:
            target_asset_jpg = os.path.join(self.assets_dir, f"{base_name}.jpg")
            res_outputs[512]["jpg"] = target_asset_jpg
            # Create JPG copy at 512 quality in assets
            sz_512 = master_2048.resize((512, 512), Image.Resampling.LANCZOS)
            jpg_deploy = Image.new("RGB", (512, 512), (255, 255, 255))
            jpg_deploy.paste(sz_512, (0, 0), sz_512)
            jpg_deploy.save(target_asset_jpg, "JPEG", quality=95)
            
        return {
            "name": base_name,
            "game_filename": game_filename,
            "approved_png": approved_path,
            "outputs": res_outputs
        }

    def generate_html_report(self, output_report_path=None):
        """
        Generates an interactive HTML audit report comparing masters, processed images,
        and asset statuses across all 53 items in the registry.
        """
        if output_report_path is None:
            output_report_path = os.path.join(self.processed_dir, "report.html")
            
        rows_html = []
        stats = {"total": len(self.registry), "masters": 0, "approved": 0, "assets": 0}
        
        for item in self.registry:
            g_fn = item["game_filename"]
            base_name = os.path.splitext(g_fn)[0]
            master_fn = item["master_filename"]
            
            master_path = os.path.join(self.masters_dir, master_fn)
            approved_path = os.path.join(self.approved_dir, f"{base_name}.png")
            p512_path = os.path.join(self.processed_dir, "512", f"{base_name}.png")
            asset_path = os.path.join(self.assets_dir, g_fn)
            
            has_master = os.path.exists(master_path)
            has_approved = os.path.exists(approved_path)
            has_asset = os.path.exists(asset_path)
            
            if has_master: stats["masters"] += 1
            if has_approved: stats["approved"] += 1
            if has_asset: stats["assets"] += 1
            
            status_badge = '<span style="background:#10B981;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">✅ Deployed</span>' if has_asset else '<span style="background:#EF4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">Missing</span>'
            
            # Asset preview source
            asset_src = f"../../assets/{g_fn}" if has_asset else ""
            approved_src = f"../approved/{base_name}.png" if has_approved else ""
            p512_src = f"512/{base_name}.png" if os.path.exists(p512_path) else ""
            
            row = f"""
            <tr>
                <td style="padding:10px;border-bottom:1px solid #333;">
                    <strong>{item['name']}</strong><br/>
                    <code style="color:#A7F3D0;">{g_fn}</code><br/>
                    <small style="color:#9CA3AF;">{item['grade_legion']}</small>
                </td>
                <td style="padding:10px;border-bottom:1px solid #333;text-align:center;">
                    {f'<img src="{asset_src}" width="80" height="80" style="border-radius:6px;border:1px solid #555;object-fit:cover;"/>' if has_asset else '<span style="color:#666;">N/A</span>'}
                </td>
                <td style="padding:10px;border-bottom:1px solid #333;text-align:center;">
                    {f'<img src="{approved_src}" width="80" height="80" style="background:#fff;border-radius:6px;border:1px solid #555;object-fit:contain;"/>' if has_approved else '<span style="color:#666;">N/A</span>'}
                </td>
                <td style="padding:10px;border-bottom:1px solid #333;text-align:center;">
                    {f'<img src="{p512_src}" width="80" height="80" style="background:#111;border-radius:6px;border:1px solid #555;object-fit:contain;"/>' if p512_src else '<span style="color:#666;">N/A</span>'}
                </td>
                <td style="padding:10px;border-bottom:1px solid #333;">
                    <div style="font-size:12px;color:#D1D5DB;max-width:320px;max-height:80px;overflow-y:auto;">{item['description']}</div>
                    <span style="display:inline-block;width:12px;height:12px;background:{item['accent_color']};border-radius:50%;margin-top:4px;"></span>
                    <small style="color:#9CA3AF;">{item['accent_color']}</small>
                </td>
                <td style="padding:10px;border-bottom:1px solid #333;text-align:center;">{status_badge}</td>
            </tr>
            """
            rows_html.append(row)
            
        html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>네크로멘서 십이장기 - 상용 원화 후처리 검수 보고서</title>
    <style>
        body {{ background:#0F172A; color:#E2E8F0; font-family:system-ui,-apple-system,sans-serif; margin:0; padding:20px; }}
        h1 {{ color:#F8FAFC; border-bottom:2px solid #3B82F6; padding-bottom:10px; }}
        .stats-card {{ display:flex; gap:20px; margin-bottom:20px; }}
        .stat-box {{ background:#1E293B; padding:15px 25px; border-radius:8px; border:1px solid #334155; text-align:center; }}
        .stat-box .num {{ font-size:28px; font-weight:bold; color:#60A5FA; }}
        table {{ width:100%; border-collapse:collapse; background:#1E293B; border-radius:8px; overflow:hidden; }}
        th {{ background:#0F172A; color:#94A3B8; text-align:left; padding:12px 10px; font-size:14px; }}
    </style>
</head>
<body>
    <h1>🛡️ 네크로멘서 십이장기 상용 원화 후처리 검수 보고서</h1>
    <div class="stats-card">
        <div class="stat-box"><div class="num">{stats['total']}</div><div>전체 대상 유닛/토템</div></div>
        <div class="stat-box"><div class="num">{stats['masters']}</div><div>Gemini 마스터 (PNG)</div></div>
        <div class="stat-box"><div class="num">{stats['approved']}</div><div>승인 투명 원화 (2048)</div></div>
        <div class="stat-box"><div class="num">{stats['assets']}</div><div>게임 전장 배치 완료</div></div>
    </div>
    <table>
        <thead>
            <tr>
                <th>유닛/토템 명칭</th>
                <th style="text-align:center;">기존 게임 에셋</th>
                <th style="text-align:center;">승인 마스터 (2048)</th>
                <th style="text-align:center;">후처리 512 (투명)</th>
                <th>개별 유닛 묘사 & 군단색</th>
                <th style="text-align:center;">상태</th>
            </tr>
        </thead>
        <tbody>
            {"".join(rows_html)}
        </tbody>
    </table>
</body>
</html>
"""
        with open(output_report_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"HTML comparison report generated at: {output_report_path}")
        return output_report_path
