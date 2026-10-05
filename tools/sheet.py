"""Tile frames into a labelled contact sheet: sheet.py out.png cols thumb_width img1 img2 ..."""
import sys, re
from PIL import Image, ImageDraw

out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
paths = sys.argv[4:]
ims = [Image.open(p).convert('RGB') for p in paths]
th = round(ims[0].height * tw / ims[0].width)
rows = -(-len(ims) // cols)
pad, lab = 6, 22
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (60, 60, 60))
d = ImageDraw.Draw(sheet)
for k, (p, im) in enumerate(zip(paths, ims)):
    x = pad + (k % cols) * (tw + pad)
    y = pad + (k // cols) * (th + lab + pad)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + lab))
    m = re.search(r'([\d.]+)\.png$', p)
    d.text((x + 2, y + 4), m.group(1) if m else p, fill=(230, 230, 230))
sheet.save(out)
print(out, sheet.size)
