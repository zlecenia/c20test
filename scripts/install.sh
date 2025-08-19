#!/usr/bin/env bash
# Installer for local development dependencies
# - System packages: Python, pip/venv, poppler-utils (pdftoppm), ImageMagick, jq
# - Python venv in backend/.venv and pip install -r backend/requirements.txt
# - Prepare .env from env.example if missing
# Usage: bash scripts/install.sh

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

log() { printf "\033[1;34m[install]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[error]\033[0m %s\n" "$*" 1>&2; }

need_sudo() {
  if [[ $EUID -ne 0 ]]; then
    if command -v sudo >/dev/null 2>&1; then
      echo sudo
    else
      err "This script requires root privileges to install system packages. Re-run as root or install sudo."
      exit 1
    fi
  else
    echo ""
  fi
}

PKG=""
if command -v apt-get >/dev/null 2>&1; then PKG=apt;
elif command -v dnf >/dev/null 2>&1;   then PKG=dnf;
elif command -v yum >/dev/null 2>&1;    then PKG=yum;
elif command -v pacman >/dev/null 2>&1; then PKG=pacman;
elif command -v zypper >/dev/null 2>&1; then PKG=zypper;
fi

if [[ -z "$PKG" ]]; then
  err "Unsupported Linux distribution (no apt/dnf/yum/pacman/zypper detected)."
  exit 2
fi

SUDO=$(need_sudo)

log "Installing system packages using: $PKG"
case "$PKG" in
  apt)
    $SUDO apt-get update -y
    $SUDO apt-get install -y python3 python3-venv python3-pip poppler-utils imagemagick jq
    ;;
  dnf)
    $SUDO dnf -y install python3 python3-pip poppler-utils ImageMagick jq
    ;;
  yum)
    $SUDO yum -y install python3 python3-pip poppler-utils ImageMagick jq
    ;;
  pacman)
    $SUDO pacman -Sy --noconfirm --needed python python-pip poppler imagemagick jq
    ;;
  zypper)
    $SUDO zypper refresh
    # poppler-tools provides pdftoppm on openSUSE; ImageMagick pkg name is ImageMagick
    $SUDO zypper install -y python3 python3-pip poppler-tools ImageMagick jq || true
    # venv tooling may be in a separate pkg on some variants
    $SUDO zypper install -y python3-venv python3-virtualenv || true
    ;;
esac

hash -r || true

# Verify tools
if ! command -v pdftoppm >/dev/null 2>&1; then
  err "pdftoppm not found after install. Please install 'poppler-utils' (Debian/Fedora) or 'poppler'/'poppler-tools' for your distro."
  exit 3
fi
if ! command -v mogrify >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1 && ! command -v magick >/dev/null 2>&1; then
  err "ImageMagick not found after install. Please install 'imagemagick'."
  exit 4
fi

# Ensure scripts are executable
chmod +x "$ROOT_DIR/scripts/pdf_to_png_rotate_crop.sh" 2>/dev/null || true

# Python environment for backend
log "Setting up Python venv in backend/.venv"
cd "$ROOT_DIR/backend"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv || {
    err "Failed to create venv. Ensure python3-venv (Debian) or a venv-capable Python is installed."
    exit 5
  }
fi
"$ROOT_DIR/backend/.venv/bin/pip" install --upgrade pip
"$ROOT_DIR/backend/.venv/bin/pip" install -r requirements.txt

# Prepare .env
if [[ ! -f "$ROOT_DIR/.env" && -f "$ROOT_DIR/env.example" ]]; then
  cp "$ROOT_DIR/env.example" "$ROOT_DIR/.env"
  log "Created .env from env.example"
fi

log "All set. You can now:"
cat <<EOF
  - Backend (local):   $ROOT_DIR/backend/.venv/bin/python $ROOT_DIR/backend/app.py
  - Frontend (docker): docker compose up --build  (UI: http://localhost:3000, API: http://localhost:5000)
  - PDF → PNG script:  scripts/pdf_to_png_rotate_crop.sh menu.pdf frontend/pages/png
EOF
