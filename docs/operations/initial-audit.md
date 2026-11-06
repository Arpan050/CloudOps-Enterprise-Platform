# Initial Environment Audit

Run these commands on the existing EC2 host. They are intended to be read-only.

```bash
printf '\n=== OS ===\n'; cat /etc/os-release | head -6
printf '\n=== CPU ===\n'; nproc; lscpu | grep -E 'Model name|CPU\(s\)' | head -3
printf '\n=== MEMORY ===\n'; free -h; swapon --show
printf '\n=== DISK ===\n'; df -hT; lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT
printf '\n=== LOAD ===\n'; uptime
printf '\n=== DOCKER VERSIONS ===\n'; docker --version 2>/dev/null || true; docker compose version 2>/dev/null || true
printf '\n=== CONTAINERS ===\n'; docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
printf '\n=== CONTAINER USAGE ===\n'; docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' 2>/dev/null || true
printf '\n=== COMPOSE PROJECTS ===\n'; docker compose ls 2>/dev/null || true
printf '\n=== LISTENING PORTS ===\n'; sudo ss -tulpn | grep -E ':(22|80|443|3000|5000|5432|6379)\b' || true
printf '\n=== RELEVANT SERVICES ===\n'; systemctl --no-pager --type=service --state=running | grep -E 'docker|nginx|postgres|redis|k3s|containerd' || true
```

## Record separately from the AWS Console

- Account plan and promotional credit balance/expiry.
- Current-month charges and service breakdown.
- Region and Availability Zone.
- Instance ID (keep private; do not paste publicly), instance type and AMI.
- VPC ID and subnet ID (may be redacted in shared notes).
- Security group inbound rules.
- EBS volume type, size and encryption status.
- IAM instance profile/role name and attached policies (do not share access keys).

## Safety

- Do not run `docker compose down`, `docker restart`, `systemctl restart`, package upgrades, or Terraform apply during the audit.
- Do not share `.env` files, passwords, private keys, access tokens, AWS access keys, or database credentials.
- Redact public IP addresses and account identifiers before sharing output.
