from flask import Flask, jsonify, send_from_directory, request
import os
import json
import time
import math
import random
import yaml
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_YAML = os.path.join(BASE_DIR, "menu.yaml")

def read_menu():
    with open(MENU_YAML, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def env_config():
    return {
        "API_URL": os.getenv("API_URL", "http://localhost:5000"),
        "DEVICE_NAME": os.getenv("DEVICE_NAME", "CONNECT 500"),
        "DEVICE_TYPE": os.getenv("DEVICE_TYPE", "C20"),
        "IP_HOST": os.getenv("IP_HOST", "192.168.1.10"),
        "PORT": int(os.getenv("PORT", "8080")),
        "HARDWARE_MODE": os.getenv("HARDWARE_MODE", "mock")
    }

# Hardware abstraction
try:
    import serial  # type: ignore
except Exception:
    serial = None

def read_hardware_values():
    mode = os.getenv("HARDWARE_MODE", "mock")
    if mode == "serial" and serial is not None:
        port = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
        baud = int(os.getenv("SERIAL_BAUD", "9600"))
        try:
            with serial.Serial(port, baudrate=baud, timeout=0.5) as ser:
                ser.write(b"READ\n")
                line = ser.readline().decode("utf-8").strip()
                low, mid, high = [float(x) for x in line.split(",")]
                return low, mid, high
        except Exception:
            pass

    # Mock data - use static values from menu config
    menu_data = read_menu()
    sensors = menu_data.get("pressure_sensors", {})

    # Add small variations to make it realistic
    t = time.time()
    low = sensors.get("low", {}).get("default_value", 10) + random.uniform(-0.5, 0.5)
    mid = sensors.get("medium", {}).get("default_value", 20) + random.uniform(-0.5, 0.5)
    high = sensors.get("high", {}).get("default_value", 30) + random.uniform(-0.5, 0.5)

    return round(low, 1), round(mid, 1), round(high, 1)

@app.get("/api/menu")
def api_menu():
    return jsonify(read_menu())

@app.get("/api/config")
def api_config():
    return jsonify(env_config())

@app.get("/api/sensors")
def api_sensors():
    low, mid, high = read_hardware_values()
    menu_data = read_menu()
    sensors = menu_data.get("pressure_sensors", {})

    return jsonify({
        "labels": {
            "low": sensors.get("low", {}).get("label", "Low"),
            "mid": sensors.get("medium", {}).get("label", "Medium"),
            "high": sensors.get("high", {}).get("label", "High")
        },
        "values": {
            "low": low,
            "mid": mid,
            "high": high
        },
        "units": {
            "low": sensors.get("low", {}).get("unit", "mbar"),
            "mid": sensors.get("medium", {}).get("unit", "bar"),
            "high": sensors.get("high", {}).get("unit", "bar")
        },
        "device": {
            "name": os.getenv("DEVICE_NAME", "CONNECT 500"),
            "type": os.getenv("DEVICE_TYPE", "C20"),
            "endpoint": f"{os.getenv('IP_HOST','192.168.1.10')}:{os.getenv('PORT','8080')}"
        },
        "status": "System Ready",
        "timestamp": time.strftime("%H:%M:%S")
    })

@app.get("/api/status")
def api_status():
    return jsonify({
        "status": "ok",
        "time": time.time(),
        "uptime": "02:34:21"
    })

@app.post("/api/login")
def api_login():
    data = request.json
    if data.get("username") == "admin" and data.get("password") == "admin":
        return jsonify({"success": True, "role": "operator", "username": "r.arendt"})
    return jsonify({"success": False, "message": "Invalid credentials"})

@app.get("/pages/<path:filename>")
def serve_pages(filename):
    root = os.path.join(os.path.dirname(BASE_DIR), "frontend", "pages")
    return send_from_directory(root, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
