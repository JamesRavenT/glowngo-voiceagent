# Deploying n8n on Google Cloud Compute Engine

This is the operational guide for the **VM half** of the system: n8n behind a Caddy reverse proxy,
reachable at a public HTTPS URL so ElevenLabs' servers can call its webhooks. The frontend is
separate — it stays on Cloudflare Workers (see [`runbook.md`](runbook.md)). The VM runs **only** n8n
and Caddy.

All the config lives in [`deploy/n8n/`](../deploy/n8n): a `docker-compose.yml` (n8n + Caddy), a
`Caddyfile`, an idempotent `setup.sh`, a `backup.sh`, and `.env.example`. This document is the
*how-to-run-it*; those files are the *what*.

> **Why a VM and not n8n Cloud?** ElevenLabs calls the webhooks server-to-server, so n8n needs a
> stable public HTTPS endpoint. A free-tier VM gives that for $0. n8n Cloud also works if you'd
> rather not run a server — skip to [ElevenLabs wiring](runbook.md) and ignore this file.

---

## What you need first

- A Google Cloud account with billing enabled (the e2-micro below sits in the **Always Free** tier,
  but Google still requires a billing account to exist).
- A domain or subdomain you control, e.g. `n8n.example.com`. You set its DNS after the VM has an IP.
- The Google Sheets service-account JSON and spreadsheet ID from [`runbook.md`](runbook.md) §2 — you
  add these *inside* n8n after it's running, not on the VM.

Placeholders used throughout: `n8n.example.com` (your host), `VM_EXTERNAL_IP` (the VM's public IP).
Substitute your real values; never commit them.

---

## 1. Create the Compute Engine VM

Console → **Compute Engine → VM instances → Create instance**. If the Compute Engine API isn't
enabled yet, the console prompts you once — enabling it is free.

### Exact settings

| Setting | Value |
|---|---|
| Name | `n8n` (anything) |
| Region | **us-west1** |
| Zone | any (e.g. `us-west1-a`) |
| Machine family | General purpose |
| Series | **E2** |
| Machine type | **e2-micro** (2 vCPU shared, 1 GB memory) |
| Boot disk — OS | **Ubuntu** |
| Boot disk — version | **Ubuntu 24.04 LTS**, **x86/64** (amd64 — *not* arm64) |
| Boot disk — type | **Standard persistent disk** |
| Boot disk — size | **20 GB** |
| Firewall | leave **Allow HTTP** and **Allow HTTPS** unchecked here — we do firewall by network tag in step 2 |
| External IP | **Ephemeral** (default). See [step 4](#4-domain-and-dns) before reserving a static one |

Everything else stays default. Create it. Note the **External IP** shown in the instance list — that
is `VM_EXTERNAL_IP`.

> **e2-micro is Always Free only in `us-west1`, `us-central1`, and `us-east1`, one instance per
> account.** We use `us-west1`. A second e2-micro, or one in another region, starts billing.

---

## 2. Firewall — only 22, 80, and 443

n8n's own port (5678) is **never** exposed publicly; the compose file binds it to `127.0.0.1` and
Caddy reaches it over Docker's internal network. So the VM needs exactly three inbound ports:

| Port | For |
|---|---|
| 22 | SSH (browser SSH uses it) |
| 80 | HTTP → Caddy redirects to HTTPS, and serves the ACME challenge |
| 443 | HTTPS → the n8n editor and the webhooks |

Google Cloud's default network already allows **22** (`default-allow-ssh`). You only need to add
80 and 443. Console → **VPC network → Firewall → Create firewall rule**:

| Field | Value |
|---|---|
| Name | `allow-http-https` |
| Direction | Ingress |
| Targets | **Specified target tags** → tag `n8n-web` |
| Source IPv4 ranges | `0.0.0.0/0` |
| Protocols/ports | TCP → `80,443` |

Then add the tag to the VM: **Compute Engine → your instance → Edit → Network tags →** add
`n8n-web` → Save. (Or set the tag at create time.)

That's the whole firewall. Do not open 5678.

---

## 3. Connect and run the setup script

### Browser SSH

Compute Engine → VM instances → the **SSH** button on the `n8n` row. A browser terminal opens as
your user, with `sudo`. No local key setup needed.

### Get the deploy files onto the VM

Clone the repo (or just the `deploy/n8n` folder). If it's a private repo, the simplest path on a
throwaway VM is to copy the four small files in by hand, but cloning is easiest:

```bash
sudo apt-get update && sudo apt-get install -y git
git clone <your-repo-url> glowngo
cd glowngo/deploy/n8n
```

### Fill in the environment file

```bash
cp .env.example .env
nano .env
```

Set `DOMAIN_NAME`, `SUBDOMAIN`, and `LETSENCRYPT_EMAIL`. For the encryption key, generate one **once**
and paste it in:

```bash
openssl rand -hex 24
```

`N8N_ENCRYPTION_KEY` decrypts every credential n8n stores. **Set it before the first start and never
change it** — if the data volume is ever rebuilt without the original key, your saved Google
credential becomes unrecoverable. `.env` is gitignored; keep a copy of the key somewhere safe (a
password manager), because your backups are only restorable *with* it.

### Run setup

```bash
chmod +x setup.sh backup.sh   # if the executable bit didn't survive transfer
./setup.sh
```

`setup.sh` is idempotent — safe to re-run. It updates Ubuntu, installs Docker Engine + the Compose
plugin (only if absent), adds you to the `docker` group, creates a **2 GB swap file** (persisted
across reboots — essential on 1 GB of RAM), then runs `docker compose up -d`. It refuses to start
until `.env` has a non-empty `N8N_ENCRYPTION_KEY`.

If it's your first Docker install, **log out of the SSH session and back in** so docker-group
membership applies, then re-run `./setup.sh` (it'll skip everything already done and just bring the
containers up without needing `sudo`).

The stack survives VM restarts on its own: swap is in `/etc/fstab`, Docker starts on boot, and both
containers use `restart: unless-stopped`.

---

## 4. Domain and DNS

Caddy gets a Let's Encrypt certificate automatically **on first start**, but only once DNS resolves
your host to the VM and ports 80/443 are open. So point DNS now.

At your DNS provider, create an **A record**:

| Type | Name | Value | Notes |
|---|---|---|---|
| A | `n8n` (→ `n8n.example.com`) | `VM_EXTERNAL_IP` | See the Cloudflare note below |

> **If your DNS is on Cloudflare, set this record to _DNS only_ (grey cloud), not proxied.** Caddy
> proves domain ownership over ports 80/443; a proxied (orange-cloud) record intercepts them and the
> certificate never issues. This is the single most common "HTTPS won't come up" cause.

Give DNS a few minutes, then check from your laptop:

```bash
nslookup n8n.example.com     # should return VM_EXTERNAL_IP
```

### Ephemeral vs static IP

The VM ships with an **ephemeral** external IP. That is fine for a portfolio demo, with one caveat:

- An ephemeral IP is **kept while the VM is running**, including across reboots. It does **not** drift
  under normal use.
- It **is released if the VM is stopped** (not rebooted — fully stopped) or deleted. On next start
  you get a *different* IP, and your A record is now wrong until you update it.

**Deploying with an ephemeral IP works** exactly as above — read the IP after creation, point DNS at
it, done. **Reserve a static IP only if** you expect to stop/start the VM, or you want to never touch
DNS again. To reserve: **VPC network → IP addresses →** promote the VM's ephemeral address to static.
(A static IP that is *attached to a running instance* is free; an unused reserved IP is billed, so
don't reserve one you won't attach.)

**If the IP ever changes** (you stopped/started an ephemeral-IP VM): read the new IP from the
instances list, update the A record's value to match, wait for DNS, done. n8n itself needs no change
— its URLs are built from the domain, not the IP. Caddy already holds the certificate, so HTTPS comes
straight back.

---

## 5. First run and everyday operations

Open `https://n8n.example.com`. The first load may take 10–30 seconds while Caddy issues the
certificate; after that it's instant. Create the owner account, then follow
[`runbook.md`](runbook.md) §3–§4 to import the workflow, add the Sheets credential, and wire
ElevenLabs.

All commands below run from `deploy/n8n/` on the VM.

### Start / stop

```bash
docker compose up -d       # start (or apply config changes)
docker compose stop        # stop without removing containers
docker compose start       # start them again
docker compose down        # stop and remove containers (volumes/data are kept)
docker compose restart n8n # restart just n8n
```

### View logs

```bash
docker compose logs -f n8n      # follow n8n
docker compose logs -f caddy    # follow Caddy (cert issuance shows here)
docker compose logs --tail=100  # last 100 lines, both services
```

Logs rotate automatically (json-file, 10 MB × 3 per container), so they won't fill the 20 GB disk.

### Update n8n safely

The image tag is pinned in `.env` (`N8N_IMAGE_TAG`). To update:

1. **Back up first** — `./backup.sh` (see §6). An update is the most likely moment to want a rollback.
2. Edit `.env` and set `N8N_IMAGE_TAG` to the new version (e.g. `1.71.0`). Pinning — rather than
   `latest` — is what makes the version deliberate and the rollback a one-line revert.
3. Pull and recreate:
   ```bash
   docker compose pull n8n
   docker compose up -d n8n
   ```
4. Check `https://n8n.example.com` still loads and a test webhook fires. If it regressed, set the tag
   back to the previous value and `docker compose up -d n8n` again — the data volume is unchanged, so
   your workflows and credentials are intact.

Occasionally prune old images to reclaim disk: `docker image prune -f`.

---

## 6. Backup and restore

The one thing worth protecting is the **`n8n_data` volume** (a SQLite database holding your
workflows, execution history, and *encrypted* credentials) together with the **`.env`** that holds
the key to decrypt them. `backup.sh` captures both.

### Back up

```bash
./backup.sh
```

It briefly stops n8n for a consistent SQLite snapshot, writes a single timestamped archive to
`deploy/n8n/backups/n8n-backup-YYYYmmdd-HHMMSS.tar.gz` (mode 600), restarts n8n, and keeps the 7 most
recent archives. **Copy the archive off the VM** — a backup that only lives on the machine it's
backing up isn't one:

```bash
# from your laptop
gcloud compute scp n8n:~/glowngo/deploy/n8n/backups/n8n-backup-*.tar.gz ./ --zone us-west1-a
```

To back up on a schedule, add a cron entry on the VM (`crontab -e`):

```cron
0 3 * * * cd $HOME/glowngo/deploy/n8n && ./backup.sh >> backups/backup.log 2>&1
```

### Restore (onto a fresh or repaired VM)

1. Run steps 1–3 up to filling in `.env`, **but** put back the *original* `N8N_ENCRYPTION_KEY` — the
   restored credentials can only be decrypted with it. (If you restore the `.env` from the archive,
   you get the right key automatically.)
2. Don't start the stack yet — restore the volume first. Unpack the archive and load `n8n-data.tar.gz`
   into a fresh `n8n_data` volume:
   ```bash
   cd deploy/n8n
   tar -xzf /path/to/n8n-backup-YYYYmmdd-HHMMSS.tar.gz   # yields n8n-data.tar.gz and .env
   docker volume create n8n_n8n_data
   docker run --rm -v n8n_n8n_data:/data -v "$PWD":/backup alpine \
     sh -c "cd /data && tar -xzf /backup/n8n-data.tar.gz --strip-components=1"
   ```
   (Compose prefixes volume names with the project directory, so the volume is `n8n_n8n_data`. Confirm
   with `docker volume ls` if unsure.)
3. `docker compose up -d`, open the site, and check your workflows and the Google Sheets credential
   are present and the workflow still activates.

---

## 7. Troubleshooting

### Low memory / OOM (the e2-micro reality)

1 GB of RAM plus 2 GB of swap is enough for one n8n with a handful of light workflows, but it's the
tightest part of this setup. Symptoms: n8n restarts on its own, the editor is sluggish, or the
container is `OOMKilled`.

```bash
free -h                          # confirm swap is present and how much RAM is free
docker stats --no-stream         # per-container memory use
docker compose logs n8n | grep -i -E 'memory|killed|oom'
dmesg | grep -i 'killed process' # kernel OOM killer entries
```

What actually helps here:

- **Confirm swap exists.** If `free -h` shows `Swap: 0B`, re-run `./setup.sh` — the swap step is
  idempotent and will create it.
- **Keep it to one n8n.** This VM is sized for the demo, not a busy automation hub. Multiple heavy
  workflows or high webhook volume will exceed it.
- **Prune Docker cruft** to free disk (a full disk causes its own failures): `docker system prune -f`.
- **Trim execution history** — in n8n, set executions to prune (Settings, or
  `EXECUTIONS_DATA_PRUNE=true` / `EXECUTIONS_DATA_MAX_AGE`) so the SQLite DB doesn't grow unbounded.
- If you genuinely need more headroom, the honest fix is a larger machine type (e2-small, 2 GB) —
  which **leaves the free tier and starts billing**. Don't do it for a demo without deciding to.

### HTTPS / certificate won't come up

- `docker compose logs caddy` — the ACME error is here.
- DNS must resolve to the VM **before** Caddy can get a cert: `nslookup n8n.example.com`.
- Ports 80 **and** 443 must be open (firewall rule + `n8n-web` tag on the VM).
- On Cloudflare DNS, the record must be **grey-cloud / DNS only** (see §4).

### Editor loads but webhooks don't fire

Almost always `WEBHOOK_URL`. It's set in `docker-compose.yml` to `https://n8n.example.com/`; if the
webhook URLs n8n shows point anywhere else (an internal address, http, a port), the value didn't take
— check `.env` interpolated correctly with `docker compose config`.

---

## 8. Verify webhooks work end-to-end over HTTPS

Before wiring ElevenLabs, prove the public HTTPS path reaches n8n:

1. **TLS is valid:**
   ```bash
   curl -I https://n8n.example.com        # 200/302, no cert warning
   ```
2. **The editor loads** at `https://n8n.example.com` with a valid padlock.
3. **A production webhook responds.** After importing and **activating** the booking workflow
   (inactive workflows only expose one-shot *test* URLs — see [`runbook.md`](runbook.md) §3), call one
   of its production webhook URLs from your laptop:
   ```bash
   curl -sS -X POST https://n8n.example.com/webhook/<path> \
     -H 'Content-Type: application/json' -d '{}'
   ```
   A JSON response (even a validation error from the workflow) proves the full chain —
   DNS → Caddy → TLS → n8n → workflow — is live. A connection error or timeout means DNS, firewall,
   or the cert, in that order.
4. **Then** paste the production webhook URLs into the ElevenLabs tools and run the voice smoke test
   in [`runbook.md`](runbook.md) §7.

Once webhooks answer over HTTPS, the VM's job is done — the rest is ElevenLabs and the frontend.
