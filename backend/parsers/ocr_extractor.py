import cv2
import numpy as np
import base64
import io
import re
from PIL import Image
from typing import Dict, Any, Optional, Tuple, List
from .mrz_parser import parse_mrz_text, parse_td3_passport, parse_td2_visa

def locate_mrz_region(cv_image: np.ndarray) -> Tuple[Optional[np.ndarray], Dict[str, int]]:
    """Locate and crop MRZ zone using morphological operations"""
    h, w = cv_image.shape[:2]
    # MRZ is usually in bottom 25-35% of passport/visa
    bottom_crop_y = int(h * 0.65)
    bottom_section = cv_image[bottom_crop_y:h, 0:w]
    
    gray = cv2.cvtColor(bottom_section, cv2.COLOR_BGR2GRAY) if len(bottom_section.shape) == 3 else bottom_section
    
    # Smooth & Black-hat transform to isolate dark text on light background
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 5))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    
    # Gradient in horizontal direction
    grad_x = cv2.Sobel(blackhat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
    grad_x = np.absolute(grad_x)
    (minVal, maxVal) = (np.min(grad_x), np.max(grad_x))
    if maxVal > minVal:
        grad_x = (255 * ((grad_x - minVal) / (maxVal - minVal))).astype("uint8")
    else:
        grad_x = grad_x.astype("uint8")
        
    # Closing operation
    grad_x = cv2.morphologyEx(grad_x, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.threshold(grad_x, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    bbox = {
        "x": 0,
        "y": bottom_crop_y,
        "width": w,
        "height": h - bottom_crop_y
    }
    
    return bottom_section, bbox

def extract_viz_fields_from_metadata(extracted_text: str, document_type: str = "Passport") -> Dict[str, Any]:
    """Parse Visual Inspection Zone (VIZ) textual representation"""
    viz_data = {
        "full_name": None,
        "document_number": None,
        "nationality": None,
        "date_of_birth": None,
        "date_of_expiry": None,
        "gender": None,
        "document_type": document_type,
        "issuing_state": None,
        "visa_type": None,
        "stay_duration": None,
        "entries": None
    }
    
    lines = [l.strip() for l in extracted_text.split("\n") if l.strip()]
    
    for line in lines:
        upper = line.upper()
        # Name matching
        if "NAME:" in upper or "SURNAME:" in upper or "GIVEN NAME:" in upper:
            val = line.split(":", 1)[-1].strip()
            if not viz_data["full_name"]:
                viz_data["full_name"] = val
        # Document No matching
        if "PASSPORT NO" in upper or "DOC NO" in upper or "VISA NO" in upper or "DOCUMENT NO" in upper:
            val = line.split(":", 1)[-1].strip()
            viz_data["document_number"] = re.sub(r'[^A-Z0-9]', '', val)
        # Nationality
        if "NATIONALITY:" in upper or "CITIZENSHIP:" in upper:
            viz_data["nationality"] = line.split(":", 1)[-1].strip()
        # DOB
        if "DATE OF BIRTH" in upper or "DOB:" in upper:
            viz_data["date_of_birth"] = line.split(":", 1)[-1].strip()
        # Expiry
        if "DATE OF EXPIRY" in upper or "EXPIRY DATE" in upper or "VALID UNTIL" in upper:
            viz_data["date_of_expiry"] = line.split(":", 1)[-1].strip()
        # Gender / Sex
        if "SEX:" in upper or "GENDER:" in upper:
            g = line.split(":", 1)[-1].strip().upper()
            viz_data["gender"] = "Male" if g.startswith("M") else ("Female" if g.startswith("F") else "Other")
            
    return viz_data

def extract_document_data(image_np: np.ndarray, raw_text_hint: Optional[str] = None) -> Dict[str, Any]:
    """Full extraction pipeline extracting MRZ, VIZ, and bounding regions"""
    h, w = image_np.shape[:2]
    _, mrz_bbox = locate_mrz_region(image_np)
    
    mrz_result = None
    if raw_text_hint:
        mrz_result = parse_mrz_text(raw_text_hint)
        viz_result = extract_viz_fields_from_metadata(raw_text_hint, mrz_result["document_type"] if mrz_result else "Passport")
    else:
        viz_result = {
            "full_name": None,
            "document_number": None,
            "nationality": None,
            "date_of_birth": None,
            "date_of_expiry": None,
            "gender": None,
            "document_type": "Passport"
        }
        
    return {
        "mrz": mrz_result,
        "viz": viz_result,
        "mrz_bbox": mrz_bbox,
        "image_dimensions": {"width": w, "height": h}
    }
