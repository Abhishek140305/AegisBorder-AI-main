import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

WEIGHTS = [7, 3, 1]

def char_to_value(char: str) -> int:
    char = char.upper()
    if char.isdigit():
        return int(char)
    if 'A' <= char <= 'Z':
        return ord(char) - ord('A') + 10
    if char == '<':
        return 0
    return 0

def calculate_check_digit(data: str) -> int:
    total = 0
    for i, char in enumerate(data):
        val = char_to_value(char)
        weight = WEIGHTS[i % 3]
        total += val * weight
    return total % 10

def parse_date(date_str: str, is_expiry: bool = False) -> Tuple[Optional[str], Optional[datetime]]:
    """Convert YYMMDD to YYYY-MM-DD string and datetime object"""
    if len(date_str) != 6 or not date_str.isdigit():
        return None, None
    
    yy = int(date_str[:2])
    mm = int(date_str[2:4])
    dd = int(date_str[4:6])
    
    if mm < 1 or mm > 12 or dd < 1 or dd > 31:
        return None, None
    
    current_year_short = datetime.now().year % 100
    
    if is_expiry:
        century = 2000 if yy <= current_year_short + 40 else 1900
    else:
        century = 1900 if yy > current_year_short else 2000
        
    full_year = century + yy
    try:
        dt = datetime(full_year, mm, dd)
        return dt.strftime("%Y-%m-%d"), dt
    except ValueError:
        return None, None

def clean_mrz_line(line: str) -> str:
    line = line.strip().upper().replace(" ", "")
    line = re.sub(r'[^A-Z0-9<]', '<', line)
    return line

def parse_td3_passport(lines: List[str]) -> Dict[str, Any]:
    """Parse TD3 format (Passport - 2 lines of 44 chars)"""
    line1 = lines[0].ljust(44, '<')[:44]
    line2 = lines[1].ljust(44, '<')[:44]
    
    doc_code = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    
    # Names: Primary << Secondary
    name_section = line1[5:44]
    names = name_section.split('<<')
    surname = names[0].replace('<', ' ').strip() if len(names) > 0 else ""
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    full_name = f"{given_names} {surname}".strip() if given_names else surname
    
    # Line 2 fields
    doc_number_raw = line2[0:9]
    doc_number = doc_number_raw.replace('<', '')
    doc_num_check = line2[9]
    calc_doc_check = str(calculate_check_digit(doc_number_raw))
    is_doc_num_valid = (doc_num_check == calc_doc_check)
    
    nationality = line2[10:13].replace('<', '')
    
    dob_raw = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = str(calculate_check_digit(dob_raw))
    is_dob_valid = (dob_check == calc_dob_check)
    dob_formatted, dob_dt = parse_date(dob_raw, is_expiry=False)
    
    sex = line2[20]
    if sex == '<':
        sex = "Unspecified"
    elif sex == 'M':
        sex = "Male"
    elif sex == 'F':
        sex = "Female"
    
    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    calc_exp_check = str(calculate_check_digit(expiry_raw))
    is_expiry_valid = (expiry_check == calc_exp_check)
    expiry_formatted, exp_dt = parse_date(expiry_raw, is_expiry=True)
    
    optional_data = line2[28:42].replace('<', '')
    composite_check = line2[43]
    
    # Composite check calculation over: line2[0:10] + line2[13:20] + line2[21:43]
    composite_data = line2[0:10] + line2[13:20] + line2[21:43]
    calc_composite_check = str(calculate_check_digit(composite_data))
    is_composite_valid = (composite_check == calc_composite_check)
    
    all_checksums_valid = is_doc_num_valid and is_dob_valid and is_expiry_valid and is_composite_valid
    
    return {
        "format": "TD3",
        "document_type": "Passport",
        "document_code": doc_code or "P",
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": full_name,
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "date_of_birth_raw": dob_raw,
        "sex": sex,
        "date_of_expiry": expiry_formatted,
        "date_of_expiry_raw": expiry_raw,
        "optional_data": optional_data,
        "raw_lines": [line1, line2],
        "checksums": {
            "document_number": {
                "extracted": doc_num_check,
                "calculated": calc_doc_check,
                "valid": is_doc_num_valid
            },
            "date_of_birth": {
                "extracted": dob_check,
                "calculated": calc_dob_check,
                "valid": is_dob_valid
            },
            "date_of_expiry": {
                "extracted": expiry_check,
                "calculated": calc_exp_check,
                "valid": is_expiry_valid
            },
            "composite": {
                "extracted": composite_check,
                "calculated": calc_composite_check,
                "valid": is_composite_valid
            },
            "overall_valid": all_checksums_valid
        }
    }

def parse_td2_visa(lines: List[str]) -> Dict[str, Any]:
    """Parse TD2 format (Visa / ID - 2 lines of 36 chars)"""
    line1 = lines[0].ljust(36, '<')[:36]
    line2 = lines[1].ljust(36, '<')[:36]
    
    doc_code = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    
    name_section = line1[5:36]
    names = name_section.split('<<')
    surname = names[0].replace('<', ' ').strip() if len(names) > 0 else ""
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    full_name = f"{given_names} {surname}".strip() if given_names else surname
    
    doc_number_raw = line2[0:9]
    doc_number = doc_number_raw.replace('<', '')
    doc_num_check = line2[9]
    calc_doc_check = str(calculate_check_digit(doc_number_raw))
    is_doc_num_valid = (doc_num_check == calc_doc_check)
    
    nationality = line2[10:13].replace('<', '')
    dob_raw = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = str(calculate_check_digit(dob_raw))
    is_dob_valid = (dob_check == calc_dob_check)
    dob_formatted, _ = parse_date(dob_raw, is_expiry=False)
    
    sex = line2[20]
    sex_str = "Male" if sex == 'M' else ("Female" if sex == 'F' else "Unspecified")
    
    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    calc_exp_check = str(calculate_check_digit(expiry_raw))
    is_expiry_valid = (expiry_check == calc_exp_check)
    expiry_formatted, _ = parse_date(expiry_raw, is_expiry=True)
    
    all_valid = is_doc_num_valid and is_dob_valid and is_expiry_valid
    
    return {
        "format": "TD2",
        "document_type": "Visa",
        "document_code": doc_code or "V",
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": full_name,
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "sex": sex_str,
        "date_of_expiry": expiry_formatted,
        "raw_lines": [line1, line2],
        "checksums": {
            "document_number": {"extracted": doc_num_check, "calculated": calc_doc_check, "valid": is_doc_num_valid},
            "date_of_birth": {"extracted": dob_check, "calculated": calc_dob_check, "valid": is_dob_valid},
            "date_of_expiry": {"extracted": expiry_check, "calculated": calc_exp_check, "valid": is_expiry_valid},
            "overall_valid": all_valid
        }
    }

def parse_mrz_text(text: str) -> Optional[Dict[str, Any]]:
    """Detect format and parse MRZ text lines"""
    raw_lines = [line.strip().replace(" ", "").upper() for line in text.strip().split('\n') if line.strip()]
    cleaned_lines = [clean_mrz_line(l) for l in raw_lines]
    
    mrz_candidates = [l for l in cleaned_lines if len(l) >= 28 and ('<' in l or len(l) in [30, 36, 44])]
    
    if len(mrz_candidates) >= 2:
        if len(mrz_candidates[-2]) >= 40 or len(mrz_candidates[-1]) >= 40:
            return parse_td3_passport([mrz_candidates[-2], mrz_candidates[-1]])
        elif len(mrz_candidates[-2]) >= 32 or len(mrz_candidates[-1]) >= 32:
            return parse_td2_visa([mrz_candidates[-2], mrz_candidates[-1]])
    
    if len(cleaned_lines) >= 2:
        return parse_td3_passport([cleaned_lines[-2], cleaned_lines[-1]])
        
    return None
