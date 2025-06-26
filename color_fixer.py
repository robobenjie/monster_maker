# fix_color.py
import sys
import glob
import os
from PIL import Image, ImageEnhance
import cv2
import numpy as np
from tqdm import tqdm

def adjust_image(input_path, output_dir):
    # Load image with OpenCV (for color manipulation)
    cv_img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if cv_img is None:
        print(f"Failed to open {input_path}")
        return

    # Split the alpha channel if it exists
    if cv_img.shape[-1] == 4:
        bgr = cv_img[..., :3]
        alpha = cv_img[..., 3]
    else:
        bgr = cv_img
        alpha = None

    # Convert BGR to RGB for PIL
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # Optional HSV adjustments
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] - 4) % 180  # Shift hue towards yellow
    hsv[..., 2] *= 0.7  # Darken slightly
    hsv[..., 2] = np.clip(hsv[..., 2], 0, 255)  # Clip values
    rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)

    # Convert to PIL Image for contrast adjustment
    if alpha is not None:
        # Merge the alpha channel back
        cv_img = np.dstack((rgb, alpha))
        pil_img = Image.fromarray(cv_img, 'RGBA')
    else:
        pil_img = Image.fromarray(rgb, 'RGB')

    # Optional contrast adjustment
    enhancer = ImageEnhance.Contrast(pil_img)
    pil_img = enhancer.enhance(1.2)  # adjust contrast factor

    # Save to output directory
    basename = os.path.basename(input_path)
    output_path = os.path.join(output_dir, basename)
    pil_img.save(output_path)
    print(f"Saved: {output_path}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 fix_color.py '<input_glob>' <output_dir>")
        sys.exit(1)

    input_glob = sys.argv[1]
    output_dir = sys.argv[2]

    os.makedirs(output_dir, exist_ok=True)
    input_files = glob.glob(input_glob)

    if not input_files:
        print("No input files matched.")
        sys.exit(1)

    for file_path in tqdm(input_files, desc="Processing images", unit="image"):
        adjust_image(file_path, output_dir)

if __name__ == "__main__":
    main()
