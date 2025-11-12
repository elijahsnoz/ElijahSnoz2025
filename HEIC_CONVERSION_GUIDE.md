# HEIC Image Conversion Guide

## Why Some Images Aren't Visible

HEIC (High Efficiency Image Container) is Apple's proprietary image format used on iOS devices. While it saves storage space, **HEIC files don't display in web browsers**. They need to be converted to JPG or PNG.

## Your HEIC Files

### Snoz Motif Creative Design (ON) - 12 HEIC files
- IMG_1318.HEIC
- IMG_1341 2.HEIC
- IMG_1367.HEIC
- IMG_1378.HEIC
- IMG_1380.HEIC
- IMG_1387.HEIC
- IMG_1390.HEIC
- IMG_5420 2.HEIC
- IMG_8438.HEIC
- IMG_9261.HEIC
- IMG_9269.HEIC
- IMG_9303.heic

### US Ambassador Collection - 8 HEIC files
- IMG_0848.heic
- IMG_0850.heic
- IMG_2568 2.HEIC
- IMG_2570 2.HEIC
- IMG_2572 2.HEIC
- IMG_2574 2.HEIC
- IMG_2576 2.HEIC
- IMG_2822.HEIC
- IMG_5359.HEIC

## How to Convert HEIC to JPG (macOS)

### Option 1: Using Preview (Built-in)
1. Select all HEIC files in Finder
2. Right-click → Open With → Preview
3. File → Export Selected Images
4. Choose format: JPEG
5. Quality: Best
6. Click "Choose" to save

### Option 2: Using Quick Actions (Bulk Conversion)
1. Select all HEIC files in Finder
2. Right-click → Quick Actions → Convert Image
3. Select "JPEG" format
4. Files will be converted in the same folder

### Option 3: Using Terminal (Fastest for Bulk)
```bash
# Navigate to the folder
cd "/Users/xworld/Desktop/PROGRAMMING/PROGRAMING/alx/ElijahSnoz2025/images/Snoz Motif creative design (ON)"

# Convert all HEIC to JPG using sips (built-in macOS tool)
for file in *.HEIC *.heic; do
    sips -s format jpeg "$file" --out "${file%.*}.jpg"
done
```

### Option 4: Using ImageMagick (If Installed)
```bash
# Install ImageMagick first
brew install imagemagick

# Convert all HEIC files
mogrify -format jpg *.HEIC *.heic
```

## After Conversion

Once converted, you can add these images to your website gallery by updating `index.html`:

```html
<div class="gallery-item">
    <img src="images/Snoz Motif creative design (ON)/IMG_1318.jpg" alt="Snoz Motif" loading="lazy">
    <div class="gallery-overlay">
        <h3>Creative Design</h3>
        <p>Snoz Motif Series</p>
    </div>
</div>
```

## Currently Visible Images

✅ **Working JPG/PNG files:**
- `images/only-one.jpg`
- `images/Studio picture/Art1.jpg` through `Art5.png`
- `images/Studio picture/IMG_0480.jpg` through `IMG_0518.jpg` (34 images)
- `images/Snoz Motif creative design (ON)/IMG_9117.jpg, IMG_9118.jpg, IMG_9119.jpg`
- `images/us ambassador bought some of my art/IMG_8886.jpg, IMG_8887.jpg`

## Need Help?

If you'd like me to add the converted images to your gallery automatically once you've converted them, just let me know!
