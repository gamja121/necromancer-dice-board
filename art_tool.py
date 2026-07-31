# art_tool.py
"""
Necromancer 12-Janggi Commercial Art Management CLI Tool
Commands:
  prompt <unit_key>  : Generates copyable Gemini image prompt for target unit/totem
  list               : Lists all 53 registered artwork items and status
  process <file>     : Post-processes target master image (or --all)
  report             : Generates HTML audit report
  test               : Runs Phase 1 benchmark test suite
"""

import sys
import os
import json
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from art_processor import ArtProcessor

MASTER_PROMPT_TEMPLATE = """첨부한 첫 번째 원본 캐릭터를 상용 모바일 다크 판타지 전략 게임의 정식 유닛 원화로 다시 그려주세요.
첨부한 두 번째 기준 예시와 동일한 흑백 판화풍, 잉크 외곽선, 회색 5단계 명암, 금속과 뼈의 재질 표현을 사용하세요.

[개별 유닛 설명]
{description}
군단 강조색: {accent_color_info}

구도 규칙:
- 정사각형 1:1 이미지
- 캐릭터의 전신이 반드시 모두 보이게
- 원본의 캐릭터 정체성, 종족, 얼굴, 무기, 장비, 자세와 핵심 실루엣 유지
- 정면에 가까운 3/4 시점
- 캐릭터 높이는 화면의 약 82%
- 발 또는 몸의 최하단을 화면 하단에서 8% 높이에 정렬
- 좌우와 머리 위에 충분한 여백 유지
- 작은 전장 아이콘으로 축소해도 머리, 몸, 무기가 명확히 분리되게

화풍 규칙:
- 굵고 선명한 검은 외곽선
- 내부선은 외곽선보다 가늘게
- 흰색, 회색, 검정 중심의 고대 괴물 도감 판화
- 제한적인 군단 강조색만 사용 (전체 면적의 10% 이하)
- 광택은 절제하고 재질은 명확하게
- 귀엽거나 코믹하지 않고 위엄 있고 불길하게

배경 규칙:
- 배경은 완전히 균일한 순백색 #FFFFFF
- 바닥, 그림자, 풍경, 안개, 빛줄기, 테두리, 카드 프레임을 넣지 말 것

금지:
- 글자, 숫자, 로고, 워터마크 금지
- 추가 캐릭터, 추가 무기, 추가 팔다리 금지
- 신체나 무기가 이미지 밖으로 잘리지 않게
- 원본에 없는 왕관, 날개, 뿔, 불꽃을 임의로 추가하지 말 것
- 두 번째 기준 이미지의 해골 기병과 말 형태를 복사하지 말 것
- 사실적인 사진, 3D 렌더, 애니메이션 셀화, 색칠 공부 도안처럼 만들지 말 것
"""

def command_prompt(processor, key):
    item = processor.get_item(key)
    if not item:
        print(f"❌ Error: Item '{key}' not found in art_registry.json!")
        sys.exit(1)
        
    accent_info = f"{item['accent_color']} ({', '.join(item['legions'])} 군단)"
    prompt = MASTER_PROMPT_TEMPLATE.format(
        description=item['description'],
        accent_color_info=accent_info
    )
    
    print("\n" + "="*80)
    print(f"🎯 GEMINI ART GENERATION PROMPT: {item['name']} ({item['game_filename']})")
    print("="*80)
    print(prompt)
    print("="*80 + "\n")
    return prompt

def command_list(processor):
    items = processor.registry
    print("\n" + "="*90)
    print(f"{'유닛/토템 명칭':<18} | {'게임 파일명':<24} | {'군단/등급':<16} | {'강조색':<10} | {'에셋 상태'}")
    print("="*90)
    
    counts = {"total": len(items), "master": 0, "approved": 0, "assets": 0}
    
    for item in items:
        g_fn = item["game_filename"]
        base_name = os.path.splitext(g_fn)[0]
        m_fn = item["master_filename"]
        
        has_master = os.path.exists(os.path.join(processor.masters_dir, m_fn))
        has_appr = os.path.exists(os.path.join(processor.approved_dir, f"{base_name}.png"))
        has_asset = os.path.exists(os.path.join(processor.assets_dir, g_fn))
        
        if has_master: counts["master"] += 1
        if has_appr: counts["approved"] += 1
        if has_asset: counts["assets"] += 1
        
        status = "✅ Deployed" if has_asset else ("🟡 Approved" if has_appr else ("🔵 Master Ready" if has_master else "⚪ Pending"))
        
        print(f"{item['name']:<16} | {g_fn:<24} | {item['grade_legion']:<14} | {item['accent_color']:<10} | {status}")
        
    print("="*90)
    print(f"📊 Summary: {counts['total']} Total | {counts['master']} Masters | {counts['approved']} Approved | {counts['assets']} Assets Deployed")
    print("="*90 + "\n")

def command_process(processor, target, deploy=False):
    if target == "--all" or target == "all":
        masters = [os.path.join(processor.masters_dir, f) for f in os.listdir(processor.masters_dir) if f.endswith(".png")]
        if not masters:
            print("⚠️ No master files found in art/masters/")
            return
        print(f"🔄 Processing {len(masters)} master files...")
        for m_path in masters:
            res = processor.process_master_image(m_path, deploy=deploy)
            print(f"  └─ Processed: {res['name']} -> {res['approved_png']}")
    else:
        m_path = target
        if not os.path.isabs(m_path) and not os.path.exists(m_path):
            m_path = os.path.join(processor.masters_dir, target)
        res = processor.process_master_image(m_path, deploy=deploy)
        print(f"✅ Processed successfully: {res['name']}")

def command_report(processor):
    path = processor.generate_html_report()
    print(f"📊 Report generated successfully: {path}")

def command_test(processor):
    print("🧪 Running Phase 1 benchmark test suite...")
    # Benchmark 6 units
    benchmarks = ["skeleton-spear.jpg", "death-knight.jpg", "flesh-golem.jpg", 
                  "spider-queen.jpg", "ancient-treant.jpg", "plague-doctor.jpg"]
                  
    processed_count = 0
    for g_fn in benchmarks:
        item = processor.get_item(g_fn)
        if item:
            # Check if asset exists to test pipeline
            asset_path = os.path.join(processor.assets_dir, g_fn)
            if os.path.exists(asset_path):
                # Run post-processing on asset as mock master
                mock_master = os.path.join(processor.masters_dir, item["master_filename"])
                from PIL import Image
                img = Image.open(asset_path)
                img.save(mock_master, "PNG")
                
                res = processor.process_master_image(mock_master, item=item, deploy=True)
                print(f"  └─ Tested & normalized: {item['name']} ({g_fn})")
                processed_count += 1
                
    report_path = processor.generate_html_report()
    print(f"\n✅ Phase 1 Benchmark Test completed! ({processed_count}/6 units processed)")
    print(f"   View audit report at: {report_path}\n")

def main():
    parser = argparse.ArgumentParser(description="Necromancer 12-Janggi Art Management CLI Tool")
    subparsers = parser.add_subparsers(dest="command")
    
    p_prompt = subparsers.add_parser("prompt", help="Get Gemini prompt for unit")
    p_prompt.add_argument("key", help="Unit key, name, or filename")
    
    p_list = subparsers.add_parser("list", help="List all registry items")
    
    p_process = subparsers.add_parser("process", help="Process master image(s)")
    p_process.add_argument("target", help="Master filename, path, or 'all'")
    p_process.add_argument("--deploy", action="store_true", help="Deploy JPG/PNG directly to assets/")
    
    p_report = subparsers.add_parser("report", help="Generate HTML report")
    
    p_test = subparsers.add_parser("test", help="Run Phase 1 benchmark tests")
    
    args = parser.parse_args()
    processor = ArtProcessor()
    
    if args.command == "prompt":
        command_prompt(processor, args.key)
    elif args.command == "list":
        command_list(processor)
    elif args.command == "process":
        command_process(processor, args.target, deploy=args.deploy)
    elif args.command == "report":
        command_report(processor)
    elif args.command == "test":
        command_test(processor)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
