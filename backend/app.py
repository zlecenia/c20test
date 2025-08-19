from flask import Flask, jsonify, send_from_directory, request
import os, json, time, math, random, yaml
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_YAML = os.path.join(BASE_DIR, "menu.yaml")

def read_menu():
    with open(MENU_YAML, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def env_config():
    return {
        "API_URL": os.getenv("API_URL", "http://localhost:5000"),
        "DEVICE_NAME": os.getenv("DEVICE_NAME", "TesterMSA"),
        "DEVICE_TYPE": os.getenv("DEVICE_TYPE", "PressureSystem"),
        "IP_HOST": os.getenv("IP_HOST", "localhost"),
        "PORT": int(os.getenv("PORT", "8080")),
        "HARDWARE_MODE": os.getenv("HARDWARE_MODE", "mock")
    }

# --- hardware abstraction ---
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
                # expected CSV: low,mid,high
                low, mid, high = [float(x) for x in line.split(",")]
                return low, mid, high
        except Exception as e:
            # fallback to mock on error
            pass

    # mock data: smoothly varying + noise
    t = time.time()
    low = 50 + 20*math.sin(t/3.0) + random.uniform(-1,1)
    mid = 150 + 30*math.sin(t/5.0) + random.uniform(-2,2)
    high = 300 + 50*math.sin(t/7.0) + random.uniform(-3,3)
    return round(low,2), round(mid,2), round(high,2)

@app.get("/api/menu")
def api_menu():
    return jsonify(read_menu())

@app.get("/api/config")
def api_config():
    return jsonify(env_config())

@app.get("/api/sensors")
def api_sensors():
    low, mid, high = read_hardware_values()
    return jsonify({
        "labels": {
            "low": "etykieta niskiego ciśnienia",
            "mid": "etykieta średniego ciśnienia",
            "high": "etykieta wysokiego ciśnienia"
        },
        "values": {
            "low": low,
            "mid": mid,
            "high": high
        },
        "unit": "kPa",
        "device": {
            "name": os.getenv("DEVICE_NAME", "TesterMSA"),
            "type": os.getenv("DEVICE_TYPE", "PressureSystem"),
            "endpoint": f"{os.getenv('IP_HOST','localhost')}:{os.getenv('PORT','8080')}"
        }
    })

@app.get("/api/status")
def api_status():
    return jsonify({"status":"ok","time":time.time()})

# static passthrough to serve the PDF-derived pages if mounted
@app.get("/pages/<path:filename>")
def serve_pages(filename):
    root = os.getenv("PAGES_DIR", os.path.join(os.path.dirname(BASE_DIR), "frontend", "pages"))
    return send_from_directory(root, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
