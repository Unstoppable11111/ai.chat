from __future__ import annotations

import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "artifacts" / "screenshots"
OUT_DIR = ROOT / "artifacts" / "short-video"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1920
FPS = 12


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


FONT_HERO = font(82, True)
FONT_TITLE = font(58, True)
FONT_SUB = font(34)
FONT_BODY = font(28)
FONT_SMALL = font(22)


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    iw, ih = image.size
    sw, sh = size
    scale = max(sw / iw, sh / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    image = image.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - sw) // 2
    top = (nh - sh) // 2
    return image.crop((left, top, left + sw, top + sh))


def rounded_paste(base: Image.Image, image: Image.Image, box: tuple[int, int], radius: int) -> None:
    x, y = box
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, image.size[0], image.size[1]), radius=radius, fill=255)
    base.paste(image, (x, y), mask)


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    max_width: int,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    line_gap: int = 12,
) -> int:
    x, y = xy
    line = ""
    lines: list[str] = []
    for char in text:
        test = line + char
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            line = test
        else:
            lines.append(line)
            line = char
    if line:
        lines.append(line)
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def frame_from_scene(scene: dict, t: float) -> Image.Image:
    src = Image.open(SCREENSHOTS / scene["image"]).convert("RGB")
    bg = fit_cover(src, (W, H)).filter(ImageFilter.GaussianBlur(26))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (244, 248, 252)), 0.48)
    frame = bg.convert("RGBA")

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((-150, 140, 520, 820), fill=(14, 165, 233, 46))
    gdraw.ellipse((540, 0, 1240, 760), fill=(139, 92, 246, 38))
    gdraw.ellipse((200, 1300, 980, 2050), fill=(101, 163, 13, 32))
    frame.alpha_composite(glow.filter(ImageFilter.GaussianBlur(54)))

    zoom = 1.0 + 0.045 * t
    card_w, card_h = 930, 1380
    crop = fit_cover(src, (card_w, card_h))
    crop = crop.resize((int(card_w * zoom), int(card_h * zoom)), Image.Resampling.LANCZOS)
    cx, cy = crop.size[0] // 2, crop.size[1] // 2
    crop = crop.crop((cx - card_w // 2, cy - card_h // 2, cx + card_w // 2, cy + card_h // 2))

    shadow = Image.new("RGBA", (card_w + 48, card_h + 48), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle((24, 24, card_w + 24, card_h + 24), radius=44, fill=(15, 23, 42, 42))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    frame.alpha_composite(shadow, (51, 330))
    rounded_paste(frame, crop.convert("RGBA"), (75, 350), 38)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rounded_rectangle((64, 92, 1016, 286), radius=40, fill=(255, 255, 255, 224), outline=(14, 165, 233, 52), width=2)
    odraw.rounded_rectangle((64, 1636, 1016, 1800), radius=36, fill=(15, 23, 42, 230))
    frame.alpha_composite(overlay)

    draw = ImageDraw.Draw(frame)
    draw.text((94, 114), scene["kicker"], font=FONT_SMALL, fill=(14, 165, 233))
    draw_wrapped(draw, scene["title"], (94, 148), 860, FONT_TITLE, (15, 23, 42), 8)
    draw_wrapped(draw, scene["caption"], (94, 1668), 880, FONT_BODY, (244, 247, 251), 10)

    progress_w = int(880 * scene["progress"])
    draw.rounded_rectangle((100, 1830, 980, 1840), radius=999, fill=(203, 213, 225))
    draw.rounded_rectangle((100, 1830, 100 + progress_w, 1840), radius=999, fill=(14, 165, 233))
    draw.text((100, 1860), "CHEN AI STUDIO / AI 创作工作台", font=FONT_SMALL, fill=(71, 85, 105))

    return frame.convert("RGB")


def jpeg_bytes(image: Image.Image) -> bytes:
    from io import BytesIO

    buf = BytesIO()
    image.save(buf, format="JPEG", quality=86, optimize=True)
    return buf.getvalue()


def write_mjpeg_avi(path: Path, frames: list[Image.Image]) -> None:
    jpgs = [jpeg_bytes(frame) for frame in frames]
    frame_count = len(jpgs)
    max_bytes = max(len(jpg) for jpg in jpgs)
    usec_per_frame = int(1_000_000 / FPS)

    def chunk(tag: bytes, data: bytes) -> bytes:
        pad = b"\0" if len(data) % 2 else b""
        return tag + struct.pack("<I", len(data)) + data + pad

    avih = struct.pack(
        "<IIIIIIIIII4I",
        usec_per_frame,
        max_bytes * FPS,
        0,
        0x10,
        frame_count,
        0,
        1,
        max_bytes,
        W,
        H,
        0,
        0,
        0,
        0,
    )
    strh = struct.pack(
        "<4s4sIHHIIIIIIIIhhhh",
        b"vids",
        b"MJPG",
        0,
        0,
        0,
        0,
        1,
        FPS,
        0,
        frame_count,
        max_bytes,
        0xFFFFFFFF,
        0,
        0,
        0,
        W,
        H,
    )
    strf = struct.pack(
        "<IiiHH4sIiiII",
        40,
        W,
        H,
        1,
        24,
        b"MJPG",
        W * H * 3,
        0,
        0,
        0,
        0,
    )
    strl = b"LIST" + struct.pack("<I", 4 + len(chunk(b"strh", strh)) + len(chunk(b"strf", strf))) + b"strl" + chunk(b"strh", strh) + chunk(b"strf", strf)
    hdrl = b"LIST" + struct.pack("<I", 4 + len(chunk(b"avih", avih)) + len(strl)) + b"hdrl" + chunk(b"avih", avih) + strl

    movi_data = b""
    idx = []
    offset = 4
    for jpg in jpgs:
        data = chunk(b"00dc", jpg)
        idx.append((offset, len(jpg)))
        movi_data += data
        offset += len(data)
    movi = b"LIST" + struct.pack("<I", 4 + len(movi_data)) + b"movi" + movi_data

    idx_data = b"".join(
        struct.pack("<4sIII", b"00dc", 0x10, off, size) for off, size in idx
    )
    idx1 = chunk(b"idx1", idx_data)
    riff_data = b"AVI " + hdrl + movi + idx1
    path.write_bytes(b"RIFF" + struct.pack("<I", len(riff_data)) + riff_data)


def main() -> None:
    scenes = [
        {
            "image": "home-vertical.png",
            "kicker": "01 / 首页",
            "title": "不是博客，是 AI 创作工作台",
            "caption": "我把个人网站做成一个持续运转的 AI Studio，展示视觉实验、提示词、项目和构建过程。",
        },
        {
            "image": "ai-lab-vertical.png",
            "kicker": "02 / AI Lab",
            "title": "每一次生成，都被记录成实验",
            "caption": "AI Lab 不是单纯放图，而是把分类、工具、标签和提示词思路都沉淀下来。",
        },
        {
            "image": "prompts-vertical.png",
            "kicker": "03 / Prompt Library",
            "title": "提示词变成可复用资产",
            "caption": "每张卡片都能搜索、筛选、复制，后面还可以继续扩展成真正的创作工具。",
        },
        {
            "image": "detail-vertical.png",
            "kicker": "04 / Build Log",
            "title": "把过程也产品化",
            "caption": "构建日志记录决策、代码、提示词和踩坑，让作品不只是结果，也能看到方法。",
        },
        {
            "image": "projects-vertical.png",
            "kicker": "05 / Projects",
            "title": "从实验走向项目案例",
            "caption": "项目案例承接产品思考、设计系统和技术栈，让个人网站更像创业操作台。",
        },
        {
            "image": "about-vertical.png",
            "kicker": "06 / About",
            "title": "个人介绍也不写成简历",
            "caption": "它更像一份工作画像：我是谁、我怎么做事、我现在关注什么、如何联系我。",
        },
        {
            "image": "stack-vertical.png",
            "kicker": "07 / Stack",
            "title": "下一步：接入动态 API",
            "caption": "GitHub、RSS、Newsletter 和社交动态都能接进来，让网站自己长出内容。",
        },
    ]

    for i, scene in enumerate(scenes):
        scene["progress"] = (i + 1) / len(scenes)

    frames: list[Image.Image] = []
    frames_per_scene = 28
    for scene in scenes:
        for i in range(frames_per_scene):
            t = i / max(frames_per_scene - 1, 1)
            eased = 0.5 - math.cos(t * math.pi) / 2
            frames.append(frame_from_scene(scene, eased))

    cover = frames[0]
    cover.save(OUT_DIR / "cover.png")
    frames[::4][0].save(
        OUT_DIR / "chen-ai-studio-short.gif",
        save_all=True,
        append_images=frames[1::4],
        duration=int(1000 / (FPS / 4)),
        loop=0,
        optimize=True,
    )
    write_mjpeg_avi(OUT_DIR / "chen-ai-studio-short.avi", frames)

    voiceover = """口播稿：
我最近把自己的个人网站，做成了一个 AI 原生创作工作台。
它不是传统博客，也不是简历式作品集。
首页展示的是我正在构建什么，AI Lab 记录每一次生图实验，提示词库把好用的 prompt 沉淀成可复制的资产。
构建日志会记录我怎么做决策、怎么写代码、怎么把页面搭起来。
项目案例负责展示真正被做出来的系统和产品方向。
对我来说，下一代个人网站应该是一个活的系统：想法在这里被验证，图像在这里被生成，产品在这里被塑形。
后面我还会继续接入 GitHub、RSS 和自动化内容流，让这个网站从展示页面，变成一个会持续更新的 AI 创作中枢。
"""
    (OUT_DIR / "voiceover.md").write_text(voiceover, encoding="utf-8")


if __name__ == "__main__":
    main()
