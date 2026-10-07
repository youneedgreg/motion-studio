import sys, json
from PIL import Image

STEP = 24
MIN_SAT, MIN_VAL = 0.35, 0.2  # accents: ignore greys, near-whites and near-blacks


def add(buckets, img):
    q = img.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    for count, idx in q.getcolors():
        rgb = pal[idx * 3: idx * 3 + 3]
        key = tuple(c // STEP for c in rgb)
        b = buckets.setdefault(key, [0, 0, 0, 0])
        b[0] += count
        for i in range(3):
            b[i + 1] += rgb[i] * count


def ranked(buckets):
    total = sum(b[0] for b in buckets.values())
    rows = []
    for n, r, g, bl in sorted(buckets.values(), key=lambda b: -b[0])[:10]:
        hexcode = '#{:02x}{:02x}{:02x}'.format(round(r / n), round(g / n), round(bl / n))
        rows.append({'hex': hexcode, 'share': round(n / total, 3)})
    return rows


dominant, accents = {}, {}
for path in sys.argv[1:]:
    img = Image.open(path).convert('RGB')
    img.thumbnail((200, 200))
    add(dominant, img)
    # accents: only saturated, not-too-dark pixels, bucketed the same way
    hsv = img.convert('HSV').get_flattened_data()
    keep = [px for px, (_, s, v) in zip(img.get_flattened_data(), hsv) if s >= MIN_SAT * 255 and v >= MIN_VAL * 255]
    if keep:
        strip = Image.new('RGB', (len(keep), 1))
        strip.putdata(keep)
        add(accents, strip)

json.dump({'dominant': ranked(dominant), 'accents': ranked(accents)}, sys.stdout, indent=1)
print()
