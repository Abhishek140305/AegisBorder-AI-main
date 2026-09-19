import cv2
import numpy as np
import base64
import io
import re
import time
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Dict, Any, List, Tuple, Optional
from parsers.mrz_parser import calculate_check_digit

def generate_icao_mrz(
    full_name: str,
    doc_number: str,
    nationality: str,
    dob_iso: str,
    expiry_iso: str,
    sex: str,
    is_visa: bool = False,
    tamper_checksum: bool = False
) -> str:
    """Generate standard ICAO 9303 compliant TD3 (Passport) or TD2 (Visa) MRZ string"""
    nat = re.sub(r'[^A-Z]', '', (nationality or "UTO").upper())[:3].ljust(3, '<')
    
    # Clean names
    clean_name = re.sub(r'[^A-Z\s]', '', full_name.upper()).strip()
    parts = [p for p in clean_name.split() if p]
    if len(parts) > 1:
        surname = parts[-1]
        given_names = "<".join(parts[:-1])
        name_field = f"{surname}<<{given_names}"
    elif len(parts) == 1:
        name_field = parts[0]
    else:
        name_field = "PASSENGER<<UNKNOWN"

    # Format DOB and Expiry to YYMMDD
    dob_clean = re.sub(r'[^0-9]', '', dob_iso)
    if len(dob_clean) == 8: # YYYYMMDD
        dob_raw = dob_clean[2:]
    elif len(dob_clean) == 6:
        dob_raw = dob_clean
    else:
        dob_raw = "900101"

    exp_clean = re.sub(r'[^0-9]', '', expiry_iso)
    if len(exp_clean) == 8: # YYYYMMDD
        exp_raw = exp_clean[2:]
    elif len(exp_clean) == 6:
        exp_raw = exp_clean
    else:
        exp_raw = "320101"

    s_char = sex.upper()[:1] if sex and sex.upper()[:1] in ['M', 'F'] else '<'
    clean_doc = re.sub(r'[^A-Z0-9]', '', doc_number.upper()).ljust(9, '<')[:9]
    
    doc_cd = str(calculate_check_digit(clean_doc))
    if tamper_checksum:
        doc_cd = str((int(doc_cd) + 5) % 10)

    dob_cd = str(calculate_check_digit(dob_raw))
    exp_cd = str(calculate_check_digit(exp_raw))

    if not is_visa:
        # TD3: 2 lines of 44 chars
        line1 = f"P<{nat}{name_field}".ljust(44, '<')[:44]
        opt = '<' * 14
        opt_cd = '<'
        l2_head = f"{clean_doc}{doc_cd}{nat}{dob_raw}{dob_cd}{s_char}{exp_raw}{exp_cd}{opt}{opt_cd}"
        comp_data = l2_head[0:10] + l2_head[13:20] + l2_head[21:43]
        comp_cd = str(calculate_check_digit(comp_data))
        line2 = f"{l2_head}{comp_cd}"
        return f"{line1}\n{line2}"
    else:
        # TD2: 2 lines of 36 chars
        line1 = f"V<{nat}{name_field}".ljust(36, '<')[:36]
        opt = '<' * 7
        line2 = f"{clean_doc}{doc_cd}{nat}{dob_raw}{dob_cd}{s_char}{exp_raw}{exp_cd}{opt}".ljust(36, '<')[:36]
        return f"{line1}\n{line2}"

def create_synthetic_passport_image(
    full_name: str,
    doc_number: str,
    nationality: str,
    dob_mrz: str, # YYMMDD
    dob_viz: str, # DD.MM.YYYY or YYYY-MM-DD
    expiry_mrz: str,
    expiry_viz: str,
    sex: str,
    mrz_lines: List[str],
    tamper_photo: bool = False,
    tamper_text: bool = False,
    is_visa: bool = False,
    portrait_image: Optional[Image.Image] = None
) -> Tuple[np.ndarray, str]:
    """Create a realistic high-definition synthetic travel document for live testing"""
    width, height = 750, 480
    img = Image.new('RGB', (width, height), color=(244, 240, 232) if not is_visa else (236, 244, 248))
    draw = ImageDraw.Draw(img)
    
    # Background security guilloché pattern simulation
    for y in range(0, height, 8):
        draw.line([(0, y), (width, y)], fill=(230, 226, 218) if not is_visa else (220, 234, 242), width=1)
    for x in range(0, width, 12):
        draw.line([(x, 0), (x, height)], fill=(230, 226, 218) if not is_visa else (220, 234, 242), width=1)
        
    # Document Header
    header_color = (20, 35, 65) if not is_visa else (15, 60, 45)
    draw.rectangle([(0, 0), (width, 55)], fill=header_color)
    draw.text((25, 14), "FEDERAL REPUBLIC / PASSPORT" if not is_visa else "SCHENGEN VISA / TYPE-C ENTRY PERMIT", fill=(255, 255, 255))
    draw.text((width - 150, 14), f"CODE: {nationality}", fill=(200, 220, 255))
    
    # Portrait Box (Left Side)
    px, py, pw, ph = 40, 80, 190, 240
    if portrait_image is not None:
        try:
            resized_face = portrait_image.convert('RGB').resize((pw, ph), Image.Resampling.LANCZOS)
            img.paste(resized_face, (px, py))
            draw.rectangle([(px, py), (px + pw, py + ph)], outline=(100, 110, 120), width=2)
        except Exception:
            portrait_image = None

    if portrait_image is None:
        # Draw avatar face
        draw.rectangle([(px, py), (px + pw, py + ph)], fill=(210, 215, 220), outline=(100, 110, 120), width=2)
        cx, cy = px + pw // 2, py + 95
        draw.ellipse([(cx - 45, cy - 50), (cx + 45, cy + 40)], fill=(185, 145, 125) if not tamper_photo else (140, 160, 185))
        draw.ellipse([(cx - 70, py + 150), (cx + 70, py + 270)], fill=(45, 60, 90) if not tamper_photo else (90, 45, 45))
        # Eyes & smile
        draw.ellipse([(cx - 20, cy - 10), (cx - 10, cy - 2)], fill=(30, 30, 30))
        draw.ellipse([(cx + 10, cy - 10), (cx + 20, cy - 2)], fill=(30, 30, 30))
        draw.arc([(cx - 20, cy + 8), (cx + 20, cy + 24)], 0, 180, fill=(40, 40, 40), width=2)
    
    if tamper_photo:
        # Simulate pasted photo sticker with visible sharp border & digital artifact
        draw.rectangle([(px - 4, py - 4), (px + pw + 4, py + ph + 4)], outline=(255, 50, 50), width=3)
        # Add random high-compression noise box
        noise_box = Image.new('RGB', (pw - 20, 60), color=(240, 180, 180))
        img.paste(noise_box, (px + 10, py + 10))
    
    # Text Fields (Right Side)
    tx = 265

    draw.text((tx, 75), "SURNAME / GIVEN NAMES:", fill=(110, 115, 125))
    draw.text((tx, 95), full_name, fill=(20, 25, 35))
    
    draw.text((tx, 130), "PASSPORT / VISA NO:", fill=(110, 115, 125))
    draw.text((tx, 150), doc_number, fill=(20, 25, 35))
    
    draw.text((tx + 220, 130), "NATIONALITY:", fill=(110, 115, 125))
    draw.text((tx + 220, 150), nationality, fill=(20, 25, 35))
    
    draw.text((tx, 185), "DATE OF BIRTH:", fill=(110, 115, 125))
    # If text is tampered, alter printed DOB visually
    draw.text((tx, 205), dob_viz if not tamper_text else "01.01.1999 [MODIFIED]", fill=(20, 25, 35) if not tamper_text else (180, 20, 20))
    
    draw.text((tx + 220, 185), "SEX:", fill=(110, 115, 125))
    draw.text((tx + 220, 205), sex, fill=(20, 25, 35))
    
    draw.text((tx, 240), "DATE OF EXPIRY:", fill=(110, 115, 125))
    draw.text((tx, 260), expiry_viz, fill=(20, 25, 35))
    
    draw.text((tx + 220, 240), "AUTHORITY:", fill=(110, 115, 125))
    draw.text((tx + 220, 260), "IMMIGRATION BUREAU", fill=(20, 25, 35))
    
    # Stamp / Hologram
    draw.ellipse([(width - 130, 230), (width - 40, 320)], outline=(40, 120, 80) if not is_visa else (150, 60, 40), width=3)
    draw.text((width - 118, 265), "OFFICIAL\nSEAL", fill=(40, 120, 80) if not is_visa else (150, 60, 40))
    
    # MRZ Zone (Bottom)
    mrz_bg_y = 350
    draw.rectangle([(0, mrz_bg_y), (width, height)], fill=(255, 255, 255), outline=(200, 200, 200))
    
    # Draw MRZ lines with monospace look
    if len(mrz_lines) >= 2:
        draw.text((30, mrz_bg_y + 25), mrz_lines[0], fill=(15, 20, 30))
        draw.text((30, mrz_bg_y + 65), mrz_lines[1], fill=(15, 20, 30))
        
    np_img = np.array(img)
    
    # Convert to base64
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
    
    return np_img, b64

# PRESET DEFINITIONS
PRESETS = [
    {
        "id": "preset_genuine_passport",
        "title": "Preset 1: Genuine German Passport",
        "badge": "LOW RISK / AUTHENTIC",
        "badge_color": "emerald",
        "document_type": "Passport",
        "holder_name": "SARAH HELENA SCHMIDT",
        "doc_number": "C44L28901",
        "nationality": "DEU",
        "dob": "1991-04-18",
        "expiry": "2031-04-17",
        "sex": "Female",
        "description": "Standard authentic passport. All ICAO 9303 checksums pass, zero tampering detected, biometrics match, clear watchlist record.",
        "mrz_raw": "P<DEUSCHMIDT<<SARAH<HELENA<<<<<<<<<<<<<<<<<<\nC44L289015DEU9104185F3104172<<<<<<<<<<<<<<<6",
        "tamper_photo": False,
        "tamper_text": False
    },
    {
        "id": "preset_photo_tampered",
        "title": "Preset 2: Tampered Photo (Replaced Avatar)",
        "badge": "FORGERY / ELA ALERT",
        "badge_color": "rose",
        "document_type": "Passport",
        "holder_name": "ALEXANDER CROSS",
        "doc_number": "P90812455",
        "nationality": "GBR",
        "dob": "1988-09-12",
        "expiry": "2029-09-11",
        "sex": "Male",
        "description": "Passport with digitally spliced and replaced portrait sticker. Detected by Error Level Analysis (ELA) and boundary edge jump.",
        "mrz_raw": "P<GBRCROSS<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<\nP908124552GBR8809121M2909117<<<<<<<<<<<<<<<8",
        "tamper_photo": True,
        "tamper_text": False
    },
    {
        "id": "preset_forged_visa_checksum",
        "title": "Preset 3: Forged Visa (Invalid Checksum)",
        "badge": "CHECKSUM FAILED",
        "badge_color": "amber",
        "document_type": "Visa",
        "holder_name": "TARIQ MANSUR",
        "doc_number": "V33918204",
        "nationality": "EGY",
        "dob": "1994-06-25",
        "expiry": "2027-12-31",
        "sex": "Male",
        "description": "Counterfeit Schengen visa with mathematically invalid ICAO 9303 check digits, tampered document number and stay permit.",
        "mrz_raw": "VNFRUMANSUR<<TARIQ<<<<<<<<<<<<<<<<<<\nV339182049EGY9406253M2712318<<<<<<<9", # Tampered check digit '9' instead of correct '3'
        "tamper_photo": False,
        "tamper_text": False,
        "is_visa": True
    },
    {
        "id": "preset_dob_mismatch",
        "title": "Preset 4: Date of Birth Inconsistency",
        "badge": "CROSS-FIELD FRAUD",
        "badge_color": "orange",
        "document_type": "Passport",
        "holder_name": "DMITRI VOLKOV",
        "doc_number": "N77109234",
        "nationality": "RUS",
        "dob": "1985-03-14",
        "expiry": "2030-03-13",
        "sex": "Male",
        "description": "Printed visual inspection zone indicates DOB '01.01.1999' but encoded MRZ reveals '1985-03-14' to conceal age / identity.",
        "mrz_raw": "P<RUSVOLKOV<<DMITRI<<<<<<<<<<<<<<<<<<<<<<<<<\nN771092346RUS8503146M3003131<<<<<<<<<<<<<<<8",
        "tamper_photo": False,
        "tamper_text": True
    },
    {
        "id": "preset_interpol_blacklist",
        "title": "Preset 5: Interpol Red Notice (Viktor K.)",
        "badge": "CRITICAL / DETAIN",
        "badge_color": "rose",
        "document_type": "Passport",
        "holder_name": "VIKTOR KORSHIKOV",
        "doc_number": "L898902C3",
        "nationality": "RUS",
        "dob": "1974-08-12",
        "expiry": "2032-04-15",
        "sex": "Male",
        "description": "High-profile fugitive on Interpol Red Notice & global watchlist for transnational fraud and document forgery. Immediate detention.",
        "mrz_raw": "P<RUSKORSHIKOV<<VIKTOR<<<<<<<<<<<<<<<<<<<<<<\nL898902C36RUS7408122M3204159ZE184226B<<<<<10",
        "tamper_photo": False,
        "tamper_text": False
    }
]

CUSTOM_PASSENGERS: List[Dict[str, Any]] = []

def decode_b64_to_pil(b64_str: str) -> Optional[Image.Image]:
    """Safely decode base64 data URL to PIL image"""
    try:
        if not b64_str:
            return None
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return None

def add_custom_passenger(data: Dict[str, Any]) -> Dict[str, Any]:
    """Register a new passenger entry for real-world IRL testing and analysis"""
    holder_name = data.get("holder_name", "UNKNOWN TRAVELER").upper().strip()
    doc_number = data.get("doc_number", "P10000000").upper().strip()
    nationality = data.get("nationality", "USA").upper().strip()
    dob = data.get("dob", "1990-01-01")
    expiry = data.get("expiry", "2030-01-01")
    sex = data.get("sex", "Male")
    doc_type = data.get("document_type", "Passport")
    is_visa = (doc_type.lower() == "visa")
    tamper_scenario = data.get("tamper_scenario", "none")
    
    custom_id = f"custom_psg_{int(time.time() * 1000)}"
    
    tamper_photo = (tamper_scenario == "tamper_photo")
    tamper_text = (tamper_scenario == "tamper_text")
    tamper_checksum = (tamper_scenario == "tamper_checksum")
    
    # If Watchlist alert requested, register in border intelligence
    if tamper_scenario == "watchlist":
        try:
            from validators.watchlist_db import add_watchlist_entry
            add_watchlist_entry({
                "document_number": doc_number,
                "name": holder_name,
                "nationality": nationality,
                "dob": dob,
                "alert_type": "INTERPOL RED NOTICE / IRL ALERT",
                "severity": "CRITICAL",
                "reason": "Flagged in border intelligence database for transnational biometric alert",
                "action_required": "IMMEDIATE DETENTION & SUPERVISOR ESCORT"
            })
        except Exception:
            pass

    # Generate or accept custom MRZ
    mrz_raw = data.get("mrz_raw")
    if not mrz_raw or not mrz_raw.strip():
        mrz_raw = generate_icao_mrz(
            full_name=holder_name,
            doc_number=doc_number,
            nationality=nationality,
            dob_iso=dob,
            expiry_iso=expiry,
            sex=sex,
            is_visa=is_visa,
            tamper_checksum=tamper_checksum
        )

    # Document & Live Passenger Images
    doc_b64 = data.get("document_image_b64")
    live_b64 = data.get("live_passenger_b64")
    portrait_pil = decode_b64_to_pil(live_b64) if live_b64 else None

    if doc_b64 and doc_b64.strip():
        pil_doc = decode_b64_to_pil(doc_b64)
        if pil_doc is not None:
            image_np = np.array(pil_doc)
            image_b64 = doc_b64 if doc_b64.startswith("data:") else f"data:image/jpeg;base64,{doc_b64}"
        else:
            image_np, image_b64 = create_synthetic_passport_image(
                full_name=holder_name,
                doc_number=doc_number,
                nationality=nationality,
                dob_mrz=dob.replace("-", "")[2:],
                dob_viz=dob,
                expiry_mrz=expiry.replace("-", "")[2:],
                expiry_viz=expiry,
                sex=sex,
                mrz_lines=mrz_raw.split("\n"),
                tamper_photo=tamper_photo,
                tamper_text=tamper_text,
                is_visa=is_visa,
                portrait_image=portrait_pil
            )
    else:
        image_np, image_b64 = create_synthetic_passport_image(
            full_name=holder_name,
            doc_number=doc_number,
            nationality=nationality,
            dob_mrz=dob.replace("-", "")[2:],
            dob_viz=dob,
            expiry_mrz=expiry.replace("-", "")[2:],
            expiry_viz=expiry,
            sex=sex,
            mrz_lines=mrz_raw.split("\n"),
            tamper_photo=tamper_photo,
            tamper_text=tamper_text,
            is_visa=is_visa,
            portrait_image=portrait_pil
        )

    # Badging
    badge_map = {
        "tamper_photo": ("IRL / TAMPERED PHOTO", "rose"),
        "tamper_checksum": ("IRL / CHECKSUM FAIL", "amber"),
        "tamper_text": ("IRL / DOB MISMATCH", "orange"),
        "watchlist": ("IRL / WATCHLIST HIT", "red"),
        "expired": ("IRL / EXPIRED DOC", "orange"),
        "none": ("IRL / VERIFIED", "emerald")
    }
    badge, badge_color = badge_map.get(tamper_scenario, ("IRL PASSENGER", "emerald"))

    description = data.get("notes") or f"Custom real-life test passenger ({holder_name}, {nationality}) registered via border ingestion terminal."

    passenger_record = {
        "id": custom_id,
        "title": f"IRL: {holder_name}",
        "badge": badge,
        "badge_color": badge_color,
        "document_type": doc_type,
        "holder_name": holder_name,
        "doc_number": doc_number,
        "nationality": nationality,
        "dob": dob,
        "expiry": expiry,
        "sex": sex,
        "description": description,
        "mrz_raw": mrz_raw,
        "image_b64": image_b64,
        "image_np": image_np,
        "live_passenger_b64": live_b64,
        "tamper_photo": tamper_photo,
        "tamper_text": tamper_text,
        "tamper_scenario": tamper_scenario,
        "is_custom": True,
        "created_at": time.time()
    }

    CUSTOM_PASSENGERS.insert(0, passenger_record)
    return passenger_record

def delete_custom_passenger(passenger_id: str) -> bool:
    """Remove a custom passenger from session"""
    global CUSTOM_PASSENGERS
    initial_len = len(CUSTOM_PASSENGERS)
    CUSTOM_PASSENGERS = [p for p in CUSTOM_PASSENGERS if p["id"] != passenger_id]
    return len(CUSTOM_PASSENGERS) < initial_len

def get_all_presets() -> List[Dict[str, Any]]:
    """Return all presets including dynamically created custom passengers"""
    return CUSTOM_PASSENGERS + PRESETS

def get_preset_by_id(preset_id: str) -> Dict[str, Any]:
    """Find preset in custom passengers or built-in presets"""
    for p in CUSTOM_PASSENGERS:
        if p["id"] == preset_id:
            return p
    for p in PRESETS:
        if p["id"] == preset_id:
            mrz_lines = p["mrz_raw"].split("\n")
            img_np, b64_img = create_synthetic_passport_image(
                full_name=p["holder_name"],
                doc_number=p["doc_number"],
                nationality=p["nationality"],
                dob_mrz=p["dob"].replace("-", "")[2:],
                dob_viz=p["dob"],
                expiry_mrz=p["expiry"].replace("-", "")[2:],
                expiry_viz=p["expiry"],
                sex=p["sex"],
                mrz_lines=mrz_lines,
                tamper_photo=p.get("tamper_photo", False),
                tamper_text=p.get("tamper_text", False),
                is_visa=p.get("is_visa", False)
            )
            return {
                **p,
                "image_b64": b64_img,
                "image_np": img_np
            }
    return PRESETS[0]

