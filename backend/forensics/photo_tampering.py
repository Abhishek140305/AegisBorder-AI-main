import cv2
import numpy as np
from typing import Dict, Any, Tuple, List, Optional

def detect_photo_replacement(image_np: np.ndarray, face_bbox: Optional[Dict[str, int]] = None) -> Dict[str, Any]:
    """
    Detect portrait replacement, edge splicing, or physical sticker/photo paste.
    Checks edge sharpness and color gradient discontinuities along the photo border.
    """
    h, w = image_np.shape[:2]
    
    # If face_bbox is not provided, estimate standard passport portrait location (typically left 35%)
    if not face_bbox:
        face_bbox = {
            "x": int(w * 0.05),
            "y": int(h * 0.15),
            "width": int(w * 0.32),
            "height": int(h * 0.45)
        }
        
    x = max(0, face_bbox["x"])
    y = max(0, face_bbox["y"])
    bw = min(w - x, face_bbox["width"])
    bh = min(h - y, face_bbox["height"])
    
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY) if len(image_np.shape) == 3 else image_np
    
    # Border margin around photo region
    pad = 12
    outer_x1 = max(0, x - pad)
    outer_y1 = max(0, y - pad)
    outer_x2 = min(w, x + bw + pad)
    outer_y2 = min(h, y + bh + pad)
    
    # Extract outer ring around photo
    photo_roi = gray[y:y+bh, x:x+bw]
    surrounding_roi = gray[outer_y1:outer_y2, outer_x1:outer_x2]
    
    # Sobel gradient analysis on photo boundaries
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edge_mag = np.sqrt(sobel_x**2 + sobel_y**2)
    
    # Boundary edge intensity (top, bottom, left, right borders of avatar)
    border_edges = []
    # Top border
    if y > 2:
        border_edges.append(np.mean(edge_mag[max(0, y-3):min(h, y+3), x:x+bw]))
    # Bottom border
    if y + bh < h - 2:
        border_edges.append(np.mean(edge_mag[max(0, y+bh-3):min(h, y+bh+3), x:x+bw]))
    # Left border
    if x > 2:
        border_edges.append(np.mean(edge_mag[y:y+bh, max(0, x-3):min(w, x+3)]))
    # Right border
    if x + bw < w - 2:
        border_edges.append(np.mean(edge_mag[y:y+bh, max(0, x+bw-3):min(w, x+bw+3)]))
        
    avg_border_gradient = float(np.mean(border_edges)) if border_edges else 0.0
    
    # Color histogram comparison between portrait and background
    if len(image_np.shape) == 3:
        hsv = cv2.cvtColor(image_np, cv2.COLOR_RGB2HSV)
        photo_hsv = hsv[y:y+bh, x:x+bw]
        bg_hsv = hsv[int(h*0.6):h, int(w*0.5):w] # sample lower right
        
        hist_p = cv2.calcHist([photo_hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
        hist_bg = cv2.calcHist([bg_hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
        cv2.normalize(hist_p, hist_p, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_bg, hist_bg, 0, 1, cv2.NORM_MINMAX)
        color_divergence = cv2.compareHist(hist_p, hist_bg, cv2.HISTCMP_BHATTACHARYYA)
    else:
        color_divergence = 0.5
        
    # Unnatural sharp border + distinct color distribution suggests pasted avatar
    is_spliced = avg_border_gradient > 65.0
    photo_tamper_score = min(100.0, max(0.0, (avg_border_gradient * 0.8) + (color_divergence * 25.0)))
    
    # Boundary overlay visual
    min_e, max_e = float(np.min(edge_mag)), float(np.max(edge_mag))
    if max_e > min_e:
        edge_norm = ((edge_mag - min_e) / (max_e - min_e) * 255.0).astype(np.uint8)
    else:
        edge_norm = edge_mag.astype(np.uint8)
    edge_color = cv2.applyColorMap(edge_norm, cv2.COLORMAP_MAGMA)
    # Draw photo box
    cv2.rectangle(edge_color, (x, y), (x+bw, y+bh), (0, 255, 255), 2)
    edge_color_rgb = cv2.cvtColor(edge_color, cv2.COLOR_BGR2RGB)
    
    return {
        "photo_tamper_score": float(photo_tamper_score),
        "is_photo_tampered": bool(photo_tamper_score > 60.0),
        "avg_border_gradient": float(avg_border_gradient),
        "color_divergence": float(color_divergence),
        "portrait_bbox": {"x": x, "y": y, "width": bw, "height": bh},
        "edge_map_rgb": edge_color_rgb
    }
