import json
import random
import os
from datetime import datetime, timedelta

def generate_operations(date, depth):
    ops = []
    current_time = 0
    while current_time < 24:
        duration = random.uniform(1, 6)
        if current_time + duration > 24:
            duration = 24 - current_time
        
        start_time_str = f"{int(current_time):02d}:{int((current_time % 1) * 60):02d}"
        end_time = current_time + duration
        end_time_str = f"{int(end_time):02d}:{int((end_time % 1) * 60):02d}"
        if end_time == 24: end_time_str = "00:00"
        
        ops.append({
            "from": start_time_str,
            "to": end_time_str,
            "elapsed": round(duration, 2),
            "endMd": round(depth, 1),
            "code": random.choice(["3-2-3", "3-6-4", "4-12-1", "LOG", "SERV"]),
            "desc": random.choice([
                f"Drilled 10-5/8\" hole from {depth-50:.0f}' to {depth:.0f}'.",
                "Tripped in the hole with 5-3/4\" slick assembly.",
                "Circulated bottoms up.",
                "Rigged up and run Triple-Combo.",
                "Serviced rig. Repaired top drive.",
                "Slide drilled 5-3/4\" section."
            ])
        })
        current_time = end_time
    return ops

def generate_ddr(rig_name, well_name, day, current_depth):
    date_str = (datetime(2024, 8, 1) + timedelta(days=day)).strftime("%d-%b-%y")
    return {
        "reportNo": day + 1,
        "date": date_str,
        "operator": "WELLS.INTEL",
        "rig": rig_name,
        "wellName": well_name,
        "measuredDepth": round(current_depth, 1),
        "verticalDepth": round(current_depth * 0.98, 1),
        "holeMade": round(random.uniform(50, 300), 1),
        "drillingDays": f"{day+1}/30",
        "currentOps": "Drilling ahead.",
        "plannedOps": "Continue to drill hole section.",
        "safetySummary": "Conducted BOP Test, Crown Check, Safety Meeting. 0 Incidents.",
        "operations": generate_operations(date_str, current_depth),
        "managementSummary": f"Drilled hole from {current_depth-100:.0f}' to {current_depth:.0f}'. Circulated hole clean. Serviced rig.",
        "casing": [
            {"size": "16.000", "topMd": 0, "botMd": 416, "grade": "K-55", "lot": 0.61},
            {"size": "11.750", "topMd": 0, "botMd": 2990, "grade": "J-55", "lot": 11.70},
        ],
        "mud": {
            "density": round(random.uniform(8.3, 11.5), 2),
            "pv": random.randint(15, 30),
            "yp": random.randint(10, 20),
            "solids": random.randint(5, 12),
            "chlorides": random.randint(600, 1000)
        },
        "bha": {
            "make": "NOV",
            "model": "TKC83",
            "diam": "10.625",
            "wob": random.randint(20, 65),
            "rpm": random.randint(30, 80),
            "flow": random.randint(200, 800),
            "press": random.randint(2000, 3500)
        }
    }

def main():
    data = {"OIL-NH-12": [], "OIL-NH-04": [], "OIL-NH-07": []}
    
    # 30 days for NH-12
    depth = 5000.0
    for i in range(30):
        depth += random.uniform(50, 200)
        data["OIL-NH-12"].append(generate_ddr("SE-802", "OIL-NH-12", i, depth))
        
    # 60 days for offsets
    depth4 = 1000.0
    depth7 = 1000.0
    for i in range(60):
        depth4 += random.uniform(50, 150)
        depth7 += random.uniform(50, 150)
        data["OIL-NH-04"].append(generate_ddr("SE-801", "OIL-NH-04", i, depth4))
        data["OIL-NH-07"].append(generate_ddr("SE-805", "OIL-NH-07", i, depth7))

    os.makedirs("frontend/public", exist_ok=True)
    with open("frontend/public/mock_ddrs.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    main()
