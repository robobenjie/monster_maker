#!/usr/bin/env python3

import sys
from PIL import Image
import numpy as np

def make_black_alpha_image(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img).astype(np.float32)

    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mask = (a > 0)

    # Compute perceptual luminance
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

    # Compute alpha from luminance
    alpha_new = 1 - (luminance / 255.0)
    alpha_new = np.clip(alpha_new, 0.0, 1.0)

    # Compose result: all black pixels with computed alpha
    result = np.zeros_like(arr)
    result[..., 0] = 0
    result[..., 1] = 0
    result[..., 2] = 0
    result[..., 3] = alpha_new * 255

    # Transparent pixels stay transparent
    result[~mask] = [0, 0, 0, 0]

    # Save
    result_img = Image.fromarray(result.astype(np.uint8), 'RGBA')
    result_img.save(output_path)
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: black_alpha_luminance.py input.png output.png")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    make_black_alpha_image(input_file, output_file)
