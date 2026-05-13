"""
api.py
======
FastAPI microservice that exposes the trained ML ensemble as a REST API for the Indian Road Accident Dataset.
"""

import os
import sys
import joblib
import numpy as np
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
from datetime import datetime

# ── Paths ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

app = FastAPI(
    title="Road Accident Severity Prediction API",
    description="Predicts accident severity (Fatal/Major/Minor) using an ML ensemble.",
    version="2.0.0",
)

@app.get("/")
def home():
    return {"message": "ML API Running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Globals ────────────────────────────────────────────────────────
models = {}
SEVERITY_LABELS = {1: "Fatal", 2: "Major", 3: "Minor"}
SEVERITY_COLORS = {1: "#e74c3c", 2: "#f39c12", 3: "#2ecc71"}

# Safety suggestions based on detected risk profile
SAFETY_SUGGESTIONS = {
    "fog_highway": "⚠️ Fog + highway detected. Massive pile-up risk. Maintain huge distance and use fog lights.",
    "urban_peak": "🚦 Urban peak hour traffic. Expect sudden stops. Maintain safe distance.",
    "rain_low_vis": "🌧️ Rain + Low Visibility detected. Drastically reduce speed to avoid hydroplaning.",
    "night_rural": "🌙 Night driving in rural conditions. Extra caution required for stray animals or lack of street lights.",
    "general": "✅ Drive safely, obey traffic signals, and always wear a seatbelt."
}


FEATURE_DEFAULTS = {
    "hour": 12,
    "day_of_week": 1,
    "is_weekend": 0,
    "road_type": 2,
    "lanes": 2,
    "traffic_signal": 1,
    "weather": 1,
    "visibility": 2,
    "temperature": 30,
    "humidity": 50,
    "traffic_density": 2,
    "vehicles_involved": 2,
    "vehicle_type": 2,
    "lighting_condition": 1,
    "road_surface_cond": 1,
    "casualties": 0,
    "is_peak_hour": 0,
    "is_drunk_driving": 0,
    "risk_score": 0.5,
}

FULL_FEATURE_ORDER = [
    "hour",
    "day_of_week",
    "is_weekend",
    "road_type",
    "lanes",
    "traffic_signal",
    "weather",
    "visibility",
    "temperature",
    "humidity",
    "traffic_density",
    "vehicles_involved",
    "vehicle_type",
    "lighting_condition",
    "road_surface_cond",
    "casualties",
    "is_peak_hour",
    "is_drunk_driving",
    "risk_score",
]


def load_models():
    """Load lightweight deployment models into memory."""
    global models

    print("🔄 Loading models...")

    try:
        models["xgb"] = joblib.load(
            os.path.join(MODEL_DIR, "xgboost_model.pkl")
        )
        print("✅ XGBoost loaded")
    except FileNotFoundError:
        print("❌ xgboost_model.pkl not found")
        models["xgb"] = None

    try:
        models["scaler"] = joblib.load(
            os.path.join(MODEL_DIR, "scaler.pkl")
        )

        models["feature_names"] = joblib.load(
            os.path.join(MODEL_DIR, "feature_names.pkl")
        )

        print("✅ Scaler & feature names loaded")

    except FileNotFoundError:
        print("❌ scaler or feature_names not found")
        models["scaler"] = None

    print("✅ Models ready!")

@app.on_event("startup")
def startup():
    load_models()


# ── Request Schema ─────────────────────────────────────────────────
class AccidentInput(BaseModel):
    hour: int = Field(default=12, ge=0, le=23)
    day_of_week: int = Field(default=1, ge=1, le=7) # 1=Mon...7=Sun
    is_weekend: int = Field(default=0, ge=0, le=1)
    road_type: int = Field(default=2, ge=1, le=4) # 1=highway, 2=urban, 3=rural, 4=legacy-rural
    lanes: int = Field(default=2, ge=1, le=6)
    traffic_signal: int = Field(default=1, ge=0, le=1)
    weather: int = Field(default=1, ge=1, le=4) # 1=clear/cloudy, 2=rain, 3=fog, 4=legacy-cloudy
    visibility: int = Field(default=2, ge=1, le=3) # 1=low, 2=medium, 3=high
    temperature: int = Field(default=30)
    humidity: int = Field(default=50)
    traffic_density: int = Field(default=2, ge=1, le=4)
    vehicles_involved: int = Field(default=2, ge=1, le=15)
    vehicle_type: int = Field(default=2, ge=1, le=4)
    lighting_condition: int = Field(default=1, ge=1, le=4)
    road_surface_cond: int = Field(default=1, ge=1, le=4)
    casualties: int = Field(default=0, ge=0, le=25)
    is_peak_hour: int = Field(default=0, ge=0, le=1)
    is_drunk_driving: int = Field(default=0, ge=0, le=1)
    risk_score: float = Field(default=0.5, ge=0.0, le=1.0)

class LiveScanRequest(BaseModel):
    lat: float
    lng: float
    name: str = "Unknown Location"


# ── Feature Engineering ─────────────────────────────────────────────
def build_feature_vector(d: AccidentInput) -> np.ndarray:
    """
    Build the feature vector in the exact order expected by the loaded model.
    Supports both legacy 14-feature artifacts and newer 19-feature artifacts.
    """
    normalized_road_type = 3 if d.road_type == 4 else d.road_type
    normalized_weather = 1 if d.weather == 4 else d.weather

    values = {
        **FEATURE_DEFAULTS,
        "hour": d.hour,
        "day_of_week": d.day_of_week,
        "is_weekend": d.is_weekend,
        "road_type": normalized_road_type,
        "lanes": d.lanes,
        "traffic_signal": d.traffic_signal,
        "weather": normalized_weather,
        "visibility": d.visibility,
        "temperature": d.temperature,
        "humidity": d.humidity,
        "traffic_density": d.traffic_density,
        "vehicles_involved": d.vehicles_involved,
        "vehicle_type": d.vehicle_type,
        "lighting_condition": d.lighting_condition,
        "road_surface_cond": d.road_surface_cond,
        "casualties": d.casualties,
        "is_peak_hour": d.is_peak_hour,
        "is_drunk_driving": d.is_drunk_driving,
        "risk_score": d.risk_score,
    }

    feature_order = models.get("feature_names") or FULL_FEATURE_ORDER
    X = np.array(
        [[values.get(name, FEATURE_DEFAULTS.get(name, 0)) for name in feature_order]],
        dtype=float,
    )

    scaler = models.get("scaler")
    expected = getattr(scaler, "n_features_in_", None)
    if expected is not None and X.shape[1] != expected:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Feature schema mismatch: scaler expects {expected}, "
                f"API built {X.shape[1]}. Retrain models or refresh feature_names.pkl."
            ),
        )
    return X


def get_safety_suggestion(data: AccidentInput) -> str:
    """Return a contextual safety suggestion based on input."""
    road_type = 3 if data.road_type == 4 else data.road_type
    weather = 1 if data.weather == 4 else data.weather

    if weather == 3 and road_type == 1:
        return SAFETY_SUGGESTIONS["fog_highway"]
    if road_type == 2 and data.is_peak_hour == 1:
        return SAFETY_SUGGESTIONS["urban_peak"]
    if weather == 2 and data.visibility == 1:
        return SAFETY_SUGGESTIONS["rain_low_vis"]
    if road_type == 3 and (data.hour >= 20 or data.hour <= 5):
        return SAFETY_SUGGESTIONS["night_rural"]
    return SAFETY_SUGGESTIONS["general"]


def ensemble_predict(X_scaled: np.ndarray):

    if not models.get("xgb"):
        raise HTTPException(
            status_code=503,
            detail="XGBoost model not loaded."
        )

    probabilities = models["xgb"].predict_proba(X_scaled)

    predicted_label = np.argmax(probabilities, axis=1)[0] + 1
    confidence = float(np.max(probabilities[0]))

    return predicted_label, confidence, probabilities[0].tolist()


# ── Endpoints ──────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}
@app.post("/predict")
def predict(data: AccidentInput):

    if models.get("scaler") is None or models.get("xgb") is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Run 'python src/train.py'."
        )
    
    try:
        X = build_feature_vector(data)
        X_scaled = models.get("scaler").transform(X)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature transform failed: {str(e)}")

    severity_code, confidence, probabilities = ensemble_predict(X_scaled)

    label_names = ["Fatal", "Major", "Minor"]
    proba_dict = {label_names[i]: round(float(probabilities[i]), 4) for i in range(3)}

    # Top risk factors calculation based on input
    risks = []
    effective_weather = 1 if data.weather == 4 else data.weather
    effective_road_type = 3 if data.road_type == 4 else data.road_type

    if effective_weather in [2,3]: risks.append("Adverse Weather")
    if data.visibility == 1: risks.append("Poor Visibility")
    if data.traffic_density >= 3: risks.append("High Traffic Density")
    if data.is_peak_hour == 1: risks.append("Peak Hour")
    if data.casualties > 2: risks.append("High Casualties Involved")
    if effective_road_type == 1: risks.append("Highway Speed Variables")

    return {
        "severity": SEVERITY_LABELS[severity_code],
        "severity_code": int(severity_code),
        "confidence": round(confidence, 4),
        "confidence_percent": f"{confidence*100:.1f}%",
        "probabilities": proba_dict,
        "severity_color": SEVERITY_COLORS[severity_code],
        "safety_suggestion": get_safety_suggestion(data),
        "top_risk_factors": risks[:4] if risks else ["Normal Parameters"],
    }
@app.post("/live_scan")
def live_scan(req: LiveScanRequest):

    if models.get("scaler") is None or models.get("xgb") is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded."
        )

    now = datetime.now()
            raise HTTPException(status_code=503, detail="Models not loaded.")

    now = datetime.now()
    hour = now.hour
    day_of_week = now.isoweekday()
    is_weekend = 1 if day_of_week >= 6 else 0
    is_peak_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0

    # 1. Fetch Real Weather Data
    weather = 1 # Default clear
    visibility = 3 # Default high
    temperature = 28
    humidity = 60
    try:
        w_url = f"https://api.open-meteo.com/v1/forecast?latitude={req.lat}&longitude={req.lng}&current=temperature_2m,relative_humidity_2m,weather_code,visibility"
        w_res = requests.get(w_url, timeout=3).json()
        if "current" in w_res:
            c = w_res["current"]
            temperature = int(c.get("temperature_2m", temperature))
            humidity = int(c.get("relative_humidity_2m", humidity))
            w_code = c.get("weather_code", 0)
            if w_code in [45, 48, 71, 73, 75, 77]:
                weather = 3 # Fog/Snow
            elif w_code >= 51:
                weather = 2 # Rain
            
            vis = c.get("visibility", 20000)
            if vis < 500: visibility = 1
            elif vis < 2000: visibility = 2
    except Exception as e:
        print("Weather API Error:", e)

    # 2. Fetch Real Road Data
    road_type = 2 # Default urban
    traffic_density = 2
    try:
        n_url = f"https://nominatim.openstreetmap.org/reverse?lat={req.lat}&lon={req.lng}&format=json"
        headers = {"User-Agent": "LifeLineAI/1.0 (student project)"}
        n_res = requests.get(n_url, headers=headers, timeout=3).json()
        address = n_res.get("address", {})
        if "motorway" in address or "trunk" in address:
            road_type = 1 # Highway
            traffic_density = 3 if is_peak_hour else 2
        elif "village" in address or "county" in address:
            road_type = 3 # Rural
            traffic_density = 1
        elif "city" in address or "suburb" in address:
            road_type = 2 # Urban
            traffic_density = 4 if is_peak_hour else 2
    except Exception as e:
        print("Nominatim API Error:", e)

    # 3. Simulate remaining fields based on location logic to build model input vector
    lanes = 4 if road_type == 1 else (2 if road_type == 2 else 1)
    traffic_signal = 1 if road_type == 2 else 0

    acc_input = AccidentInput(
        hour=hour, day_of_week=day_of_week, is_weekend=is_weekend, road_type=road_type,
        lanes=lanes, traffic_signal=traffic_signal, weather=weather, visibility=visibility,
        temperature=temperature, humidity=humidity, traffic_density=traffic_density,
        vehicles_involved=2, vehicle_type=2, lighting_condition=1 if (6 <= hour <= 18) else 3,
        road_surface_cond=2 if weather == 2 else 1, casualties=0, is_peak_hour=is_peak_hour,
        is_drunk_driving=0, risk_score=(0.8 if weather > 1 or traffic_density > 2 else 0.4)
    )

    X = build_feature_vector(acc_input)
    X_scaled = models.get("scaler").transform(X)
    severity_code, confidence, probabilities = ensemble_predict(X_scaled)
    
    # Calculate an overall risk percentage based on probability of Major/Fatal
    risk_percentage = min(99, int((probabilities[0] + probabilities[1]) * 100))
    
    risk_zone = ""
    if risk_percentage >= 80:
        risk_zone = "Very High Risk Zone"
    elif risk_percentage >= 60:
        risk_zone = "High Risk Zone"
    else:
        risk_zone = f"{'Adverse Weather ' if weather>1 else ''}{'High Traffic ' if traffic_density>2 else 'Standard '} Zone"

    traffic_status = "Standstill / Severe Congestion" if traffic_density == 4 else ("Moderate Traffic Flow" if traffic_density >= 2 else "Light Traffic")
    restriction = "Level 5 (Emergency Only)" if severity_code == 1 else ("Level 2 (Speed Limit 20km/h)" if severity_code == 2 else "Level 0 (Normal Operations)")
    
    # Construct "real" satellite data response matching the older deterministic structure but powered by ML and real APIs
    return {
        "success": True,
        "prediction": {
            "severity": SEVERITY_LABELS[severity_code],
            "severity_code": int(severity_code),
            "confidence": round(confidence, 4),
            "probabilities": { "Fatal": probabilities[0], "Major": probabilities[1], "Minor": probabilities[2] }
        },
        "liveContext": {
            "temperature": temperature,
            "humidity": humidity,
            "weatherType": "Rain" if weather == 2 else ("Fog/Snow" if weather == 3 else "Clear"),
            "roadType": "Highway" if road_type == 1 else ("Urban" if road_type == 2 else "Rural"),
            "isPeakHour": bool(is_peak_hour)
        },
        "mapData": {
            "riskPercentage": risk_percentage,
            "severity": SEVERITY_LABELS[severity_code],
            "trafficStatus": traffic_status,
            "restriction": restriction,
            "riskZoneType": risk_zone
        }
    }


@app.get("/metadata")
def metadata():
    return {
        "model_version": "2.0.0",
        "features": models.get("feature_names", []),
        "classes": SEVERITY_LABELS,
        "description": "Road Accident Severity Prediction using Indian Dataset via ML Ensemble",
    }


if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uvicorn.run("src.api:app", host="0.0.0.0", port=5001, reload=False)
