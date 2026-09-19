import cv2
import numpy as np
from typing import Dict, Any, Tuple, List

def analyze_noise_inconsistency(image_np: np.ndarray, block_size: int = 32) -> Tuple[np.ndarray, float, List[Dict[str, Any]]]:
    """
    Analyze high-frequency noise variance across image blocks.
    Manipulated regions (cloned, pasted, digitally altered) exhibit mismatched noise levels.
    """
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_np.copy()
        
    # Apply Laplacian high-pass filter to extract sensor noise & edge residuals
    laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=3)
    abs_laplacian = np.absolute(laplacian)
    
    h, w = gray.shape
    grid_h = h // block_size
    grid_w = w // block_size
    
    noise_grid = np.zeros((grid_h, grid_w))
    
    for r in range(grid_h):
        for c in range(grid_w):
            y1 = r * block_size
            y2 = (r + 1) * block_size
            x1 = c * block_size
            x2 = (c + 1) * block_size
            
            block = abs_laplacian[y1:y2, x1:x2]
            noise_grid[r, c] = np.var(block)
            
    # Normalize noise map
    mean_noise = np.mean(noise_grid)
    std_noise = np.std(noise_grid)
    
    # Identify anomaly blocks (noise deviates by > 2.2 std from median)
    median_noise = np.median(noise_grid)
    anomaly_blocks = []
    
    # Generate full resolution noise map for visualizer
    min_lap, max_lap = float(np.min(abs_laplacian)), float(np.max(abs_laplacian))
    if max_lap > min_lap:
        norm_laplacian = ((abs_laplacian - min_lap) / (max_lap - min_lap) * 255.0).astype(np.uint8)
    else:
        norm_laplacian = abs_laplacian.astype(np.uint8)
    noise_visual = cv2.applyColorMap(norm_laplacian, cv2.COLORMAP_VIRIDIS)
    noise_visual_rgb = cv2.cvtColor(noise_visual, cv2.COLOR_BGR2RGB)
    
    for r in range(grid_h):
        for c in range(grid_w):
            val = noise_grid[r, c]
            if abs(val - median_noise) > (2.2 * std_noise + 1e-5):
                x = c * block_size
                y = r * block_size
                anomaly_blocks.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(block_size),
                    "height": int(block_size),
                    "deviation": float(abs(val - median_noise)),
                    "type": "Sensor Noise Variance Mismatch"
                })
                
    # Anomaly score based on standard deviation of block variances
    noise_discrepancy_score = min(100.0, (len(anomaly_blocks) / (grid_h * grid_w + 1)) * 300.0 + (std_noise / (mean_noise + 1e-4) * 20.0))
    
    return noise_visual_rgb, float(noise_discrepancy_score), anomaly_blocks
