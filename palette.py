import sys, json
from PIL import Image

STEP = 24
buckets = {}

for path in sys.argv[1:]:
    img = Image.open(path).convert('RGB')
    img.thumbnail((200, 200))
    q = img.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    for count, idx in q.getcolors():
        rgb = pal[idx * 3: idx * 3 + 3]
        key = tuple(c // STEP for c in rgb)
        b = buckets.setdefault(key, [0, 0, 0, 0])
        b[0] += count
        for i in range(3):
            b[i + 1] += rgb[i] * count

total = sum(b[0] for b in buckets.values())
rows = []
for n, r, g, bl in sorted(buckets.values(), key=lambda b: -b[0])[:10]:
    hexcode = '#{:02x}{:02x}{:02x}'.format(round(r / n), round(g / n), round(bl / n))
    rows.append({'hex': hexcode, 'share': round(n / total, 3)})
json.dump(rows, sys.stdout, indent=1)
print()
