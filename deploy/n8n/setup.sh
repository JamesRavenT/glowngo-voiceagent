#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_USER="${SUDO_USER:-${USER:?Unable to determine the invoking user}}"

log() {
  printf '[setup] %s\n' "$*"
}

docker_command() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

log "Updating Ubuntu packages"
sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine and the Compose plugin"
  if ! command -v curl >/dev/null 2>&1; then
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl
  fi
  curl -fsSL https://get.docker.com | sudo sh
else
  log "Docker is already installed"
fi

if ! id -nG "$TARGET_USER" | tr ' ' '\n' | grep -qx docker; then
  log "Adding ${TARGET_USER} to the docker group"
  sudo usermod -aG docker "$TARGET_USER"
  log "Log out and back in for docker group membership to take effect"
else
  log "${TARGET_USER} is already in the docker group"
fi

if ! swapon --show --noheadings | grep -q .; then
  if [[ ! -e /swapfile ]]; then
    log "Creating a 2 GB swap file"
    if ! sudo fallocate -l 2G /swapfile; then
      log "fallocate failed; creating the swap file with dd"
      sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    fi
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
  else
    log "Activating the existing /swapfile"
    sudo swapon /swapfile
  fi
else
  log "Swap is already active"
fi

if [[ -f /swapfile ]] && ! grep -Eq '^[[:space:]]*/swapfile[[:space:]]+none[[:space:]]+swap[[:space:]]+sw[[:space:]]+0[[:space:]]+0([[:space:]]|$)' /etc/fstab; then
  log "Adding /swapfile to /etc/fstab"
  printf '%s\n' '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

if [[ ! -f /etc/sysctl.d/99-swappiness.conf ]] || ! grep -qx 'vm.swappiness=10' /etc/sysctl.d/99-swappiness.conf; then
  log "Setting vm.swappiness to 10"
  printf '%s\n' 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
fi
if [[ "$(sysctl -n vm.swappiness)" != "10" ]]; then
  sudo sysctl -w vm.swappiness=10 >/dev/null
fi

cd "$SCRIPT_DIR"
mkdir -p "$SCRIPT_DIR/backups"

if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  log "ERROR: $SCRIPT_DIR/.env is missing."
  log "Run 'cp .env.example .env', fill in every value, generate N8N_ENCRYPTION_KEY with"
  log "'openssl rand -hex 24', then re-run this script. Containers were not started."
  exit 1
fi

key_line="$(grep -E '^[[:space:]]*N8N_ENCRYPTION_KEY[[:space:]]*=' "$SCRIPT_DIR/.env" | tail -n 1 || true)"
key_value="${key_line#*=}"
key_value="$(printf '%s' "$key_value" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
if [[ -z "$key_line" || -z "$key_value" || "$key_value" == "''" || "$key_value" == '""' ]]; then
  log "ERROR: N8N_ENCRYPTION_KEY is missing or empty in $SCRIPT_DIR/.env."
  log "Generate it with 'openssl rand -hex 24', add it to .env, then re-run this script."
  log "Containers were not started."
  exit 1
fi

log "Starting n8n and Caddy"
docker_command compose up -d

log "Container status"
docker_command compose ps
