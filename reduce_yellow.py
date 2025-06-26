import os
from PIL import Image
import numpy as np

INPUT_DIR = 'map_assets_old'
OUTPUT_DIR = 'map_assets'
YELLOW_CORRECTION_FACTOR = 0.8  # adjust closer to 0.0 to reduce more yellow

def reduce_yellow_tint(image_array):
    """Reduce yellow tint by operating in CMYK color space, preserving alpha channel."""
    has_alpha = image_array.shape[2] == 4
    if has_alpha:
        rgb_channels = image_array[..., :3]
        alpha_channel = image_array[..., 3]
    else:
        rgb_channels = image_array

    # Convert RGB to float values between 0-1
    rgb = rgb_channels.astype(float) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # Convert RGB to CMYK
    with np.errstate(divide='ignore', invalid='ignore'):
        k = 1 - np.maximum.reduce([r, g, b])
        c = (1 - r - k) / (1 - k)
        m = (1 - g - k) / (1 - k)
        y = (1 - b - k) / (1 - k)
        c, m, y, k = np.nan_to_num(c), np.nan_to_num(m), np.nan_to_num(y), np.nan_to_num(k)

    # Reduce yellow channel
    y *= YELLOW_CORRECTION_FACTOR

    # Convert back to RGB
    r_new = (1 - c) * (1 - k)
    g_new = (1 - m) * (1 - k)
    b_new = (1 - y) * (1 - k)

    # Combine back into an image array
    corrected_rgb = np.stack([r_new, g_new, b_new], axis=-1)
    corrected_rgb = (corrected_rgb * 255).astype(np.uint8)

    if has_alpha:
        return np.dstack((corrected_rgb, alpha_channel))
    else:
        return corrected_rgb

def process_images(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
            path = os.path.join(input_dir, filename)
            print(f"Processing {filename}...")
            image = Image.open(path)
            
            # Use RGBA if image has alpha channel to preserve it
            mode = 'RGBA' if image.mode == 'RGBA' or 'transparency' in image.info else 'RGB'
            image = image.convert(mode)
            
            img_array = np.array(image)
            corrected_array = reduce_yellow_tint(img_array)
            corrected_image = Image.fromarray(corrected_array, mode=mode)
            corrected_image.save(os.path.join(output_dir, filename))
    print("Done.")

if __name__ == "__main__":
    process_images(INPUT_DIR, OUTPUT_DIR)