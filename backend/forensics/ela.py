import cv2
import numpy as np
import io
import base64
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, Tuple, List

def perform_ela(image_pil: Image.Image, quality: int = 90, scale: int = 25) -> Tuple[np.ndarray, float, List[Dict[str, Any]]]:
    """
    Perform Error Level Analysis (ELA).
    Saves image at specific quality, computes absolute difference, amplifies differences.
    Returns: (ELA RGB image as numpy array, tamper_score [0-100], suspicious_bboxes)
    """
    # Ensure RGB
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
        
    # Compress in-memory
    buffer = io.BytesIO()
    image_pil.save(buffer, 'JPEG', quality=quality)
    buffer.seek(0)
    resaved_pil = Image.open(buffer)
    
    # Calculate difference
    ela_pil = ImageChops.difference(image_pil, resaved_pil)
    
    # Calculate maximum difference and scale
    extrema = ela_pil.getextrema()
    max_vals = []
    if extrema:
        for ex in extrema:
            if isinstance(ex, (tuple, list)):
                max_vals.append(ex[1])
            elif isinstance(ex, (int, float)):
                max_vals.append(ex)
    max_diff = max(max_vals) if max_vals else 1
    if max_diff == 0:
        max_diff = 1
    
    # Scale difference for visibility
    scale_factor = min(255.0 / max_diff, scale)
    enhancer = ImageEnhance.Brightness(ela_pil)
    ela_enhanced = enhancer.enhance(scale_factor)
    
    ela_np = np.array(ela_enhanced)
    gray_ela = cv2.cvtColor(ela_np, cv2.COLOR_RGB2GRAY)
    
    # Statistical analysis of error levels
    mean_error = np.mean(gray_ela)
    std_error = np.std(gray_ela)
    max_error = np.max(gray_ela)
    
    # High local variance indicates digital manipulation/splicing
    # Threshold for finding high-error clusters
    thresh_val = min(240, max(60, mean_error + 2.0 * std_error))
    _, mask = cv2.threshold(gray_ela, int(thresh_val), 255, cv2.THRESH_BINARY)
    
    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask_cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours of high error regions
    contours, _ = cv2.findContours(mask_cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    h, w = gray_ela.shape
    total_area = h * w
    suspicious_bboxes = []
    
    total_suspicious_pixels = np.sum(mask_cleaned > 0)
    area_ratio = (total_suspicious_pixels / total_area) * 100.0
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 120:  # Minimum anomaly size
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Local error score within bounding box
            roi_error = np.mean(gray_ela[y:y+bh, x:x+bw])
            suspicious_bboxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "area": float(area),
                "local_intensity": float(roi_error),
                "type": "Compression Anomaly / Spliced Region"
            })
            
    # Calculate composite ELA tamper score (0-100)
    # Natural images have uniform low-to-mid ELA with consistent noise
    # Spliced images have distinct bright high-error patches
    score = min(100.0, (area_ratio * 4.5) + (std_error * 0.8) + (len(suspicious_bboxes) * 3.5))
    
    return ela_np, float(score), suspicious_bboxes

def generate_heatmap_overlay(original_np: np.ndarray, ela_np: np.ndarray) -> np.ndarray:
    """Generate color jet heatmap overlaid onto original image"""
    gray = cv2.cvtColor(ela_np, cv2.COLOR_RGB2GRAY)
    min_v, max_v = float(np.min(gray)), float(np.max(gray))
    if max_v > min_v:
        norm_gray = ((gray.astype(np.float32) - min_v) / (max_v - min_v) * 255.0).astype(np.uint8)
    else:
        norm_gray = gray.astype(np.uint8)
    heatmap = cv2.applyColorMap(norm_gray, cv2.COLORMAP_JET)
    
    # Blend 60% original + 40% heatmap
    if original_np.shape != heatmap.shape:
        heatmap = cv2.resize(heatmap, (original_np.shape[1], original_np.shape[0]))
        
    orig_bgr = cv2.cvtColor(original_np, cv2.COLOR_RGB2BGR) if len(original_np.shape) == 3 else original_np
    blended = cv2.addWeighted(orig_bgr, 0.55, heatmap, 0.45, 0)
    return cv2.cvtColor(blended, cv2.COLOR_BGR2RGB)

def image_to_base64(img_np: np.ndarray) -> str:
    """Convert RGB numpy array to base64 jpeg string"""
    pil_img = Image.fromarray(img_np.astype('uint8'))
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=88)
    encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded}"
