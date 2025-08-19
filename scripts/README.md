# Scripts Guide (Linux, macOS, Windows)

This folder contains helper scripts for setting up the project and processing the PDF into PNG pages.

- `install.sh` – sets up system dependencies (Linux distros), Python venv, and project requirements.
- `pdf_to_png_rotate_crop.sh` – converts PDF pages to PNG, rotates each by 270°, and crops the bottom half.

Supported systems
- Linux: Debian/Ubuntu (apt), Fedora (dnf), RHEL/CentOS (yum), Arch (pacman), openSUSE (zypper), Alpine (apk)
- macOS: Homebrew (brew) is supported by `install.sh`
- Windows: WSL (Ubuntu) recommended, or Git Bash/PowerShell with manual dependencies

If you use Windows, the recommended path is WSL (Windows Subsystem for Linux) or Git Bash to run these scripts.

## 1) Installation

### Linux (Debian/Ubuntu, Fedora, RHEL/CentOS, Arch, openSUSE, Alpine)
- The installer auto-detects your package manager (`apt`, `dnf`, `yum`, `pacman`, `zypper`, `apk`).
- What it does:
  - Installs: Python 3 + venv, poppler-utils (pdftoppm), ImageMagick, jq
  - Creates Python virtualenv in `backend/.venv` and installs `backend/requirements.txt`
  - Creates `.env` from `env.example` if missing

Run (may ask for sudo password):
```bash
bash scripts/install.sh
```

Skip system packages (no sudo), only Python env + requirements:
```bash
bash scripts/install.sh --skip-system
# or
SKIP_SYSTEM=1 bash scripts/install.sh
```

### macOS
- Use Homebrew to install dependencies:
```bash
# Install Homebrew if needed: https://brew.sh/
brew update
brew install python poppler imagemagick jq
```
- Or simply run the installer on macOS (Homebrew will be auto-detected, no sudo required):
```bash
bash scripts/install.sh
```
- Create venv and install Python deps:
```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt
```
Notes:
- ImageMagick on macOS sometimes exposes `magick` instead of legacy `convert/mogrify`. Our script supports both (`magick mogrify` fallback).
- We process only PNGs with ImageMagick, so no PDF policy changes are required.

### Windows
Recommended: run scripts under WSL (Ubuntu) for best compatibility.

- Option A: WSL (Ubuntu)
  1) Enable WSL and install Ubuntu from Microsoft Store.
  2) In Ubuntu terminal, clone the repo and run Linux steps:
  ```bash
  sudo apt-get update && sudo apt-get install -y poppler-utils imagemagick python3 python3-venv python3-pip jq
  bash scripts/install.sh --skip-system   # optional, since you just installed system deps
  ```

- Option B: Git Bash (native Windows)
  - Install dependencies manually:
    - Poppler for Windows (provides `pdftoppm`) – add its `bin/` to PATH.
    - ImageMagick – during install, enable legacy utilities or use `magick mogrify`.
    - Python 3 – ensure `python`/`python3` in PATH.
  - Then in Git Bash:
  ```bash
  python -m venv backend/.venv
  backend/.venv/Scripts/pip install --upgrade pip
  backend/.venv/Scripts/pip install -r backend/requirements.txt
  ```
  - You can now run `bash scripts/pdf_to_png_rotate_crop.sh ...` from Git Bash.

- Option C: Chocolatey (PowerShell)
  - Install dependencies (run in elevated PowerShell):
  ```powershell
  choco install -y python jq imagemagick poppler
  ```
  - For ImageMagick, enable legacy utilities during install or use the `magick` command.
  - Create venv and install Python deps:
  ```powershell
  python -m venv backend\.venv
  backend\.venv\Scripts\pip install --upgrade pip
  backend\.venv\Scripts\pip install -r backend\requirements.txt
  ```

## 2) PDF → PNG conversion

Script: `scripts/pdf_to_png_rotate_crop.sh`

- Input: a PDF file.
- Output: `page-1.png`, `page-2.png`, ... in target folder.
- Operations: rotate 270°, crop bottom X% (default 50%).

Usage:
```bash
scripts/pdf_to_png_rotate_crop.sh input.pdf output_dir [dpi=200] [rotate_deg=270] [crop_bottom_percent=50]
```
Example:
```bash
scripts/pdf_to_png_rotate_crop.sh menu.pdf frontend/pages/png 200 270 50
```
This produces: `frontend/pages/png/page-1.png`, `page-2.png`, ... already rotated and cropped.

Verification:
```bash
pdftoppm -v || true
mogrify -version || convert -version || magick -version
```

## 3) Frontend integration (iframe pages)

- The UI uses `frontend/pages/*.html` inside an iframe.
- To show the generated PNGs, you can create simple wrappers, e.g. `frontend/pages/1.html`:
```html
<!doctype html>
<html><body>
  <img src="./png/page-1.png" style="width:100%;height:auto;border:0;" />
</body></html>
```
- Repeat per page, or let me generate a helper script to auto-build these HTML files from the PNG directory.

## 4) Running the app

- Docker Compose:
```bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```
- Local backend (without Docker):
```bash
backend/.venv/bin/python backend/app.py
# or on Windows (Git Bash/CMD/PowerShell): backend/.venv/Scripts/python backend/app.py
```

## 5) Troubleshooting

- Sudo prompts in non-interactive shells:
  - Run `scripts/install.sh` from your terminal so sudo can prompt for a password.
  - Or use `--skip-system` and install system packages manually.

- ImageMagick "not authorized" errors on PDFs:
  - Our flow uses `pdftoppm` to produce PNGs; ImageMagick only touches PNGs (safe).
  - If you try to process PDFs directly with ImageMagick, adjust its security policy or keep using `pdftoppm` first.

- Commands not found:
  - Ensure `pdftoppm` (Poppler) and `mogrify`/`convert`/`magick` are in PATH (restart shell after install).

## 6) Environment config

- `.env` is created from `env.example` by the installer if missing.
- Relevant variables (backend):
  - `API_URL` (default `http://localhost:5000`)
  - `DEVICE_NAME`, `DEVICE_TYPE`
  - `HARDWARE_MODE` (`mock` or `serial`)

## Appendix: Extra systems and manual install cheat sheet

- FreeBSD / OpenBSD (manual example):
  - FreeBSD (as root):
  ```sh
  pkg update
  pkg install -y python3 py39-pip poppler ImageMagick7 jq
  ```
  - OpenBSD (packages may vary by release):
  ```sh
  pkg_add python%3 jq imagemagick poppler
  ```
  - Then create venv and install Python deps (paths like Linux/macOS).

- NixOS (shell with tools; project remains unchanged):
  ```sh
  nix-shell -p python3 python3Packages.virtualenv poppler_utils imagemagick jq
  # inside shell
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -r backend/requirements.txt
  ```

- Manual system package commands (copy-paste):
  - apt (Debian/Ubuntu):
  ```sh
  sudo apt-get update && sudo apt-get install -y python3 python3-venv python3-pip poppler-utils imagemagick jq
  ```
  - dnf (Fedora):
  ```sh
  sudo dnf -y install python3 python3-pip poppler-utils ImageMagick jq
  ```
  - yum (RHEL/CentOS):
  ```sh
  sudo yum -y install python3 python3-pip poppler-utils ImageMagick jq
  ```
  - pacman (Arch):
  ```sh
  sudo pacman -Sy --noconfirm --needed python python-pip poppler imagemagick jq
  ```
  - zypper (openSUSE):
  ```sh
  sudo zypper refresh && sudo zypper install -y python3 python3-pip poppler-tools ImageMagick jq
  sudo zypper install -y python3-venv python3-virtualenv || true
  ```
  - apk (Alpine):
  ```sh
  sudo apk update && sudo apk add --no-cache python3 py3-pip poppler-utils imagemagick jq
  ```
  - brew (macOS):
  ```sh
  brew update && brew install python poppler imagemagick jq
  ```

---
If you want, I can add a helper to auto-generate `frontend/pages/{n}.html` for every generated PNG.
