#!/bin/bash

# Image Compression Script for Mobile Performance
# Compresses all JPG/JPEG images to optimal size for web

echo "🖼️  Image Compression Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt-get install imagemagick"
    echo ""
    echo "Or use online tool: https://tinypng.com"
    exit 1
fi

# Use 'magick' on newer ImageMagick, 'convert' on older
MAGICK_CMD="magick"
if ! command -v magick &> /dev/null; then
    MAGICK_CMD="convert"
fi

# Configuration
MAX_WIDTH=1200
MAX_HEIGHT=1200
QUALITY=85
BACKUP_DIR="images_backup_$(date +%Y%m%d_%H%M%S)"

echo "📋 Settings:"
echo "   Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}px"
echo "   Quality: ${QUALITY}%"
echo "   Backup location: $BACKUP_DIR"
echo ""

# Ask for confirmation
read -p "❓ Create backup and compress images? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Create backup
echo "💾 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r images "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR/images"
echo ""

# Count files
TOTAL_FILES=$(find images -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
echo "📊 Found $TOTAL_FILES images to compress"
echo ""

# Track progress
CURRENT=0
TOTAL_BEFORE=0
TOTAL_AFTER=0

# Compress images
echo "🔄 Compressing..."
find images -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read img; do
    CURRENT=$((CURRENT + 1))
    
    # Get original size
    BEFORE=$(du -k "$img" | cut -f1)
    TOTAL_BEFORE=$((TOTAL_BEFORE + BEFORE))
    
    # Get filename
    FILENAME=$(basename "$img")
    
    # Compress
    $MAGICK_CMD "$img" \
        -strip \
        -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" \
        -quality $QUALITY \
        -interlace Plane \
        "$img.tmp" 2>/dev/null
    
    if [ -f "$img.tmp" ]; then
        mv "$img.tmp" "$img"
        
        # Get new size
        AFTER=$(du -k "$img" | cut -f1)
        TOTAL_AFTER=$((TOTAL_AFTER + AFTER))
        
        # Calculate savings
        SAVED=$((BEFORE - AFTER))
        PERCENT=$((100 - (AFTER * 100 / BEFORE)))
        
        echo "   [$CURRENT/$TOTAL_FILES] $FILENAME: ${BEFORE}KB → ${AFTER}KB (-${PERCENT}%)"
    else
        echo "   [$CURRENT/$TOTAL_FILES] ❌ Failed: $FILENAME"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Compression Complete!"
echo ""
echo "📊 Results:"
echo "   Files processed: $TOTAL_FILES"
echo "   Before: $(du -sh images | cut -f1)"
echo "   After:  Recalculating..."

# Recalculate actual size
ACTUAL_SIZE=$(du -sh images | cut -f1)
echo "   After:  $ACTUAL_SIZE"
echo ""
echo "💡 Next steps:"
echo "   1. Test your site locally"
echo "   2. If satisfied: git add images/ && git commit -m 'Optimize images'"
echo "   3. If not: rm -rf images && mv $BACKUP_DIR/images ."
echo ""
echo "🚀 Your images are now optimized for mobile!"
