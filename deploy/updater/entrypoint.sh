#!/usr/bin/env bash
set -euo pipefail
repository=https://github.com/JordonRH/Boxgames
mkdir -p /state
trap 'exit 0' TERM INT
echo 'Boxgame updater started; watching verified main-branch releases.'
while true; do
  touch /state/heartbeat
  release_sha="$(git ls-remote "$repository.git" refs/heads/main 2>/dev/null | cut -f1 || true)"
  current_sha="$(cat /state/current-revision 2>/dev/null || true)"
  if [[ "$release_sha" =~ ^[a-f0-9]{40}$ && "$release_sha" != "$current_sha" ]]; then
    release_path="/state/release-$release_sha"
    mkdir -p "$release_path"
    base_url="$repository/releases/download/boxgame-$release_sha"
    if curl -fsSL --retry 2 --connect-timeout 10 --max-time 30 "$base_url/boxgame-release.sha256" -o "$release_path/boxgame-release.sha256" 2>/dev/null; then
      echo "Verified CI release available: $release_sha"
      if curl -fsSL --retry 1 --connect-timeout 10 --max-time 300 "$base_url/boxgame-release.tar.gz" -o "$release_path/boxgame-release.tar.gz" 2>/dev/null &&
         (cd "$release_path" && checksum_line="$(cat boxgame-release.sha256)" && [[ "$checksum_line" =~ ^[a-f0-9]{64}[[:space:]][[:space:]]boxgame-release\.tar\.gz$ ]] && sha256sum --check --status boxgame-release.sha256) &&
         tar -tzf "$release_path/boxgame-release.tar.gz" | awk '$0!="./" && $0!="./compose.yml" && $0!="./scripts/" && $0!="./scripts/deploy-image.sh" && $0!="./scripts/jrh-compliance.py" && $0!="./image.tar.gz" {bad=1} END{exit bad}' &&
         tar -tvzf "$release_path/boxgame-release.tar.gz" | awk 'substr($1,1,1)!="-" && substr($1,1,1)!="d" {bad=1} END{exit bad}'; then
        tar --no-same-owner --no-same-permissions -xzf "$release_path/boxgame-release.tar.gz" -C "$release_path"
        if bash "$release_path/scripts/deploy-image.sh" "$release_path" "$release_sha"; then
          # A newer main commit can supersede this release during download.
          latest_sha="$(git ls-remote "$repository.git" refs/heads/main 2>/dev/null | cut -f1 || true)"
          if [[ "$latest_sha" == "$release_sha" ]]; then printf '%s\n' "$release_sha" > /state/current-revision; fi
          rm -f "$release_path/image.tar.gz" "$release_path/boxgame-release.tar.gz"
        else
          echo 'Deployment failed; previous image retained or restored. Retrying after five minutes.'
          sleep 300 & wait $! || true
        fi
      else
        echo 'Release download or integrity validation failed. Nothing deployed.'
      fi
    fi
  fi
  sleep 60 & wait $! || true
done
