from PIL import Image, ExifTags
from typing import Dict, Any, List

KNOWN_EDITING_SOFTWARE = [
    "photoshop", "gimp", "canva", "corel", "paint.net", "lightroom", 
    "snapseed", "picsart", "pixlr", "affinity", "pixelmator", "pillow",
    "imagemagick", "exiftool"
]

def analyze_metadata(image_pil: Image.Image) -> Dict[str, Any]:
    """
    Examine EXIF metadata tags for manipulation clues:
    - Presence of image editing software signatures
    - Creation/Modification timestamp mismatches
    - Missing camera hardware tags (Make, Model)
    """
    exif_data = {}
    software_flags = []
    suspicious_tags = []
    
    try:
        exif_getter = getattr(image_pil, '_getexif', None) or getattr(image_pil, 'getexif', None)
        if callable(exif_getter):
            raw_exif = exif_getter()
            if hasattr(raw_exif, 'items'):
                for tag_id, value in getattr(raw_exif, 'items')():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    exif_data[tag_name] = str(value)
    except Exception:
        exif_data = {}

    software = exif_data.get("Software", "").lower()
    artist = exif_data.get("Artist", "").lower()
    description = exif_data.get("ImageDescription", "").lower()
    
    has_editing_signature = False
    detected_software = None
    
    for tool in KNOWN_EDITING_SOFTWARE:
        if tool in software or tool in artist or tool in description:
            has_editing_signature = True
            detected_software = tool.capitalize()
            software_flags.append(f"Image processed or exported using {detected_software}")
            break
            
    # Check camera hardware tags
    has_camera_make = "Make" in exif_data or "Model" in exif_data
    
    # Check timestamps
    dt_orig = exif_data.get("DateTimeOriginal")
    dt_mod = exif_data.get("DateTime")
    if dt_orig and dt_mod and dt_orig != dt_mod:
        suspicious_tags.append(f"Timestamp mismatch: Captured {dt_orig} but modified {dt_mod}")
        
    tamper_risk = 0.0
    if has_editing_signature:
        tamper_risk += 65.0
    if suspicious_tags:
        tamper_risk += 25.0
        
    return {
        "has_exif": bool(exif_data),
        "exif_summary": {k: exif_data[k] for k in list(exif_data.keys())[:10]},
        "has_editing_signature": has_editing_signature,
        "detected_software": detected_software,
        "software_flags": software_flags,
        "suspicious_tags": suspicious_tags,
        "metadata_tamper_score": min(100.0, tamper_risk)
    }
