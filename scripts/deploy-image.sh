#!/usr/bin/env bash
set -euo pipefail
bundle_path="${1:?Release directory required}"
release_sha="${2:?Commit SHA required}"
if [[ ! "$release_sha" =~ ^[a-f0-9]{40}$ ]]; then echo 'Invalid release identifier'; exit 1; fi
remote_sha="$(git ls-remote https://github.com/JordonRH/Boxgames.git refs/heads/main | cut -f1)"
if [[ "$remote_sha" != "$release_sha" ]]; then echo 'Release superseded by a newer main commit; skipping.'; exit 0; fi
previous_image="$(docker ps -a --filter 'name=^/boxgame$' --format '{{.Image}}')"
docker load --input "$bundle_path/image.tar.gz" > /dev/null
export BOXGAME_IMAGE="boxgame:$release_sha"
healthy() {
  docker exec boxgame node -e 'fetch("http://127.0.0.1:3000/api/health").then(async r=>{const d=await r.json();process.exit(r.ok&&d.revision===process.argv[1]?0:1)}).catch(()=>process.exit(1))' "$1" 2>/dev/null
}
if docker compose -p boxgame -f "$bundle_path/compose.yml" up -d --no-build; then
  for attempt in $(seq 1 30); do
    if healthy "$release_sha"; then
      echo "Boxgame deployed and healthy: $release_sha"
      exit 0
    fi
    sleep 2
  done
fi
echo 'New release failed health verification.'
if [[ "$previous_image" =~ ^boxgame:(local|[a-f0-9]{40})$ ]]; then
  export BOXGAME_IMAGE="$previous_image"
  if docker compose -p boxgame -f "$bundle_path/compose.yml" up -d --no-build; then
    for attempt in $(seq 1 30); do
      if healthy "${previous_image#boxgame:}"; then echo 'Previous image restored and healthy.'; exit 1; fi
      sleep 2
    done
  fi
  echo 'Rollback did not pass health verification; operator attention required.'
fi
exit 1
