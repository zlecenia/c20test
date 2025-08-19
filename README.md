# C20 Testing System - SCBA Complete Test Platform

System testowania aparatów oddechowych (SCBA) z pełną infrastrukturą Docker, interfejsem użytkownika i systemem zarządzania testami.

## 🚀 Szybki Start

### Uruchomienie systemu
```bash
# Sklonuj repozytorium
git clone <repository-url>
cd c20test

# Uruchom wszystkie serwisy
docker compose up -d --build

# Sprawdź status
docker compose ps
```

### Dostęp do aplikacji
- **Frontend (UI)**: http://localhost:80
- **Backend API**: http://localhost:5000 (dostępne przez proxy)
- **Node.js API**: http://localhost:3001 (pomocniczy serwis)

## 📋 Architektura Systemu

### Komponenty
```
c20test/
├── frontend/           # Nginx + HTML/CSS/JS
├── backend/           # Flask API + Python
├── nodejs-api/        # Node.js serwis pomocniczy
├── docs/             # Dokumentacja (26 stron PNG)
└── scripts/          # Skrypty instalacyjne
```

### Serwisy Docker
1. **frontend** - Nginx (port 80)
   - Serwuje interfejs użytkownika
   - Proxy dla `/api` → backend:5000
   - Zaawansowany UI z menu dynamicznym

2. **backend** - Flask API (port 5000)
   - REST API dla menu, konfiguracji, sensorów
   - Obsługa hardware mock/serial
   - Zarządzanie sesjami i logowaniem

3. **nodejs-api** - Node.js (port 3001)
   - Pomocniczy serwis dla dodatkowych funkcji
   - Status endpoint i proxy funkcje

## 🎯 Funkcjonalności

### Główne Menu (zgodne z menu.yaml)
- **Menu Główne** - System Start (strona 1)
- **Menu Użytkownika** - Logowanie QR/manual (strony 3, 8)
- **Menu Testowe** - Wybór klienta i urządzeń (strony 5, 19, 25)
- **Menu Serwisowe** - Diagnostyka i zarządzanie
- **Autodiagnostyka** - 3-stopniowy test systemu (strony 2, 21, 22, 9)

### Interaktywne Strony
- **Strona 1** - System Start z paskiem postępu
- **Strona 2** - Autodiagnostyka główna
- **Strona 3** - Scanner QR/kodów kreskowych
- **Strona 8** - Logowanie ręczne (admin/admin)
- **Strona 9** - Test pneumatyki z wizualizacją
- **Strona 21** - Test sensorów z danymi real-time
- **Strona 22** - Test aktuatorów z kontrolami
- **Strona 5** - Wybór klienta z wyszukiwarką
- **Strona 19** - Wybór rodzaju urządzenia
- **Strona 25** - Wybór typu urządzenia ze specyfikacjami

### Panel Główny
- **Lewa kolumna** - Menu dynamiczne z YAML
- **Środek** - Iframe z stronami testowymi
- **Prawa kolumna** - Sensory i status urządzenia

## ⚙️ Konfiguracja

### Zmienne środowiskowe (.env)
```bash
# Backend API
DEVICE_NAME=TesterMSA
DEVICE_TYPE=PressureSystem
IP_HOST=localhost
PORT=8080

# Hardware Mode
HARDWARE_MODE=mock          # 'mock' lub 'serial'
SERIAL_PORT=/dev/ttyUSB0    # tylko dla serial
SERIAL_BAUD=9600           # tylko dla serial

# Flask
FLASK_ENV=production
```

### Tryby Hardware
- **mock** - Symulowane dane sensorów (domyślne)
- **serial** - Rzeczywiste dane z portu szeregowego (CSV: low,mid,high)

## 🔧 API Endpoints

### Backend Flask (/api)
- `GET /api/menu` - Struktura menu z YAML
- `GET /api/config` - Konfiguracja systemu
- `GET /api/sensors` - Dane sensorów (mock/serial)
- `GET /api/status` - Status systemu i uptime
- `POST /api/login` - Logowanie (admin/admin)
- `GET /pages/<filename>` - Serwuje strony HTML

### Node.js API
- `GET /status` - Status serwisu
- `POST /echo` - Echo endpoint

## 🧪 Testowanie

### Scenarios testowe
1. **Login Flow**: strona 3 (QR) → strona 8 (manual)
2. **Diagnostic Flow**: strona 2 → 21 → 22 → 9
3. **Test Flow**: strona 5 → 19 → 25 → 13
4. **Real-time sensors**: każda strona pokazuje live dane

### Demo credentials
- Username: `admin`
- Password: `admin`

## 📁 Struktura Plików

### Frontend
```
frontend/
├── index.html          # Główny interfejs
├── nginx.conf          # Konfiguracja proxy
├── Dockerfile          # Nginx container
└── pages/              # 26 interaktywnych stron
    ├── 1.html          # System Start
    ├── 2.html          # Autodiagnostyka
    ├── 3.html          # QR Scanner
    ├── 8.html          # Manual Login
    ├── 9.html          # Test Pneumatyki
    ├── 21.html         # Test Sensorów
    ├── 22.html         # Test Aktuatorów
    └── ...             # + 19 innych stron
```

### Backend
```
backend/
├── app.py              # Flask aplikacja
├── menu.yaml           # Definicja menu
├── requirements.txt    # Python dependencies
└── Dockerfile          # Python container
```

### Dokumentacja
```
docs/
├── menu_testowania.pdf # Oryginalny PDF
└── page-01.png         # 26 stron jako PNG
    ...
    page-26.png
```

## 🔍 Rozwój i Debugowanie

### Logi serwisów
```bash
# Wszystkie logi
docker compose logs -f

# Konkretny serwis
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nodejs-api
```

### Rebuild po zmianach
```bash
# Rebuild i restart
docker compose down
docker compose up -d --build

# Tylko konkretny serwis
docker compose up -d --build backend
```

### Dostęp do kontenerów
```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh
```

## 🛠️ Dodawanie Nowych Funkcji

### Nowa strona HTML
1. Utwórz `frontend/pages/X.html`
2. Dodaj wpis w `backend/menu.yaml`
3. Restart aplikacji

### Nowy endpoint API
1. Dodaj route w `backend/app.py`
2. Zaktualizuj frontend JavaScript
3. Rebuild backend

### Hardware integration
1. Ustaw `HARDWARE_MODE=serial`
2. Podaj `SERIAL_PORT` i `SERIAL_BAUD`
3. Urządzenie musi wysyłać CSV: `low,mid,high`

## 📊 Monitoring

### Health checks
- Frontend: http://localhost:80
- Backend: http://localhost:80/api/status
- Node.js: http://localhost:3001/status

### Kluczowe metryki
- Sensory: real-time przez WebSocket
- Status połączenia: indicator w prawym panelu
- Uptime: endpoint /api/status

## 🔐 Bezpieczeństwo

- Logowanie przez QR lub manual
- Session management w Flask
- CORS skonfigurowany dla localhost
- Environment variables dla wrażliwych danych

## 📝 Changelog

### v1.0.0 (aktualna)
- ✅ Kompletny system Docker
- ✅ 26 interaktywnych stron HTML
- ✅ Menu dynamiczne z YAML
- ✅ Real-time sensory (mock/serial)
- ✅ QR Scanner + manual login
- ✅ 3-etapowa autodiagnostyka
- ✅ Wybór klientów i urządzeń
- ✅ Nginx proxy configuration
- ✅ Node.js helper service

## 🤝 Wsparcie

Dla problemów technicznych:
1. Sprawdź logi: `docker compose logs -f`
2. Sprawdź status: `docker compose ps`
3. Restart: `docker compose restart`

