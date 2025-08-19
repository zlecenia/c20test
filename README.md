# SCBA Test Menu – Dockerized

## Uruchomienie
1. Zmień parametry w pliku `.env` jeśli potrzeba.
2. `docker compose up --build`
3. Wejdź na `http://localhost:3000` (frontend). API działa na `http://localhost:5000`.

## Struktura
- `backend/` – Flask API
  - czyta `menu.yaml` (podstawa menu)
  - endpointy: `/api/menu`, `/api/config`, `/api/sensors`, `/api/status`
  - obsługa mock/serial (pyserial) poprzez `HARDWARE_MODE`
- `frontend/` – statyczny panel (HTML+JS)
  - lewa kolumna – menu (sekcje z YAML)
  - środek – iframe z plikami HTML odpowiadającymi **kolejnym stronom PDF**
  - prawa kolumna – dane sensorów (etykiety + wartości)

## Mapowanie PDF → iframe
Pliki HTML umieść w `frontend/pages/` jako `1.html`, `2.html`, ... Kliknięcia w sekcje menu przełączają widok.

## Sprzęt
- Ustaw `HARDWARE_MODE=serial` oraz `SERIAL_PORT` i `SERIAL_BAUD` w `.env` aby czytać dane z urządzenia (CSV: `low,mid,high`).

