#!/usr/bin/env python3

import sys
from PIL import Image
import numpy as np

def whiteness_alpha_conversion(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img).astype(np.float32)

    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mask = (a > 0)

    # Compute per-pixel minimum channel
    min_channel = np.minimum.reduce([r, g, b])

    # Compute new alpha
    alpha_new = 1 - (min_channel / 255.0)
    alpha_new = np.clip(alpha_new, 0.0, 1.0)

    # Avoid division by zero
    safe_alpha = np.where(alpha_new > 0, alpha_new, 1.0)

    # Compute new RGB
    r_new = (r - 255 * (1 - safe_alpha)) / safe_alpha
    g_new = (g - 255 * (1 - safe_alpha)) / safe_alpha
    b_new = (b - 255 * (1 - safe_alpha)) / safe_alpha

    # Clamp
    r_new = np.clip(r_new, 0, 255)
    g_new = np.clip(g_new, 0, 255)
    b_new = np.clip(b_new, 0, 255)

    # Compose result
    result = np.zeros_like(arr)
    result[..., 0] = r_new
    result[..., 1] = g_new
    result[..., 2] = b_new
    result[..., 3] = alpha_new * 255

    # Special case: fully black pixels stay black & fully opaque
    black_mask = (r == 0) & (g == 0) & (b == 0) & (a > 0)
    result[black_mask] = [0, 0, 0, 255]

    # Transparent pixels stay transparent
    result[~mask] = [0, 0, 0, 0]

    # Save
    result_img = Image.fromarray(result.astype(np.uint8), 'RGBA')
    result_img.save(output_path)
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: whiteness_alpha.py input.png output.png")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    whiteness_alpha_conversion(input_file, output_file)
