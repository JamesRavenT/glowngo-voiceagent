#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_PATH="$BACKUP_DIR/n8n-backup-$TIMESTAMP.tar.gz"
STAGING_DIR=""
N8N_STOPPED=false
BACKUP_COMPLETE=false

umask 077

log() {
  printf '[backup] %s\n' "$*"
}

docker_command() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

cleanup() {
  exit_status=$?

  if [[ "$N8N_STOPPED" == true ]]; then
    log "Restarting n8n after an interrupted or failed backup"
    if ! docker_command compose start n8n; then
      log "ERROR: Failed to restart n8n; run 'docker compose start n8n' manually"
      exit_status=1
    fi
  fi

  if [[ -n "$STAGING_DIR" && -d "$STAGING_DIR" ]]; then
    rm -rf -- "$STAGING_DIR"
  fi

  if [[ "$BACKUP_COMPLETE" == false && -f "$ARCHIVE_PATH" ]]; then
    rm -f -- "$ARCHIVE_PATH"
  fi

  exit "$exit_status"
}
trap cleanup EXIT

cd "$SCRIPT_DIR"
mkdir -p "$BACKUP_DIR"

if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  log "ERROR: $SCRIPT_DIR/.env is missing; it is required for a restorable backup"
  exit 1
fi

n8n_container="$(docker_command compose ps -q n8n)"
if [[ -z "$n8n_container" ]]; then
  log "ERROR: The n8n container is not running; start it before creating a backup"
  exit 1
fi

STAGING_DIR="$(mktemp -d "$BACKUP_DIR/.n8n-backup.XXXXXX")"

log "Stopping n8n briefly for a consistent SQLite snapshot"
docker_command compose stop n8n
N8N_STOPPED=true

log "Archiving the n8n data volume"
docker_command run --rm \
  --volumes-from "$n8n_container" \
  --volume "$STAGING_DIR:/backup" \
  alpine \
  tar -czf /backup/n8n-data.tar.gz -C /home/node .n8n

cp "$SCRIPT_DIR/.env" "$STAGING_DIR/.env"
tar -czf "$ARCHIVE_PATH" -C "$STAGING_DIR" n8n-data.tar.gz .env
BACKUP_COMPLETE=true

log "Restarting n8n"
docker_command compose start n8n
N8N_STOPPED=false

log "Applying retention policy (keeping the 7 most recent archives)"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'n8n-backup-*.tar.gz' -printf '%f\n' \
  | sort -r \
  | tail -n +8 \
  | while IFS= read -r old_archive; do
      log "Removing old backup $old_archive"
      rm -f -- "$BACKUP_DIR/$old_archive"
    done

archive_size="$(du -h "$ARCHIVE_PATH" | awk '{print $1}')"
log "Backup created: $ARCHIVE_PATH ($archive_size)"
log "Restore instructions are in docs/deployment-google-cloud.md"
