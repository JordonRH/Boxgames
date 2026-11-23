import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("deployment health failure restores and checks the previous image; superseded commits never deploy", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "boxgame-deploy-test-"));
  const sha = "a".repeat(40),
    previous = "b".repeat(40),
    log = path.join(dir, "actions");
  const executable = (name: string, text: string) => {
    const p = path.join(dir, name);
    writeFileSync(p, "#!/usr/bin/env bash\nset -eu\n" + text);
    chmodSync(p, 0o755);
  };
  executable("git", `printf '%s\\trefs/heads/main\\n' "\${MOCK_MAIN}"\n`);
  executable("sleep", "exit 0\n");
  executable(
    "python3",
    '[[ "$*" == *"preflight --approved-config --selector live --compose"* ]] || exit 91\nexit "${MOCK_GATE_EXIT:-0}"\n',
  );
  executable(
    "docker",
    `case "$1" in
 ps) printf 'boxgame:${previous}\\n';;
 load) exit 0;;
 compose) printf '%s\\n' "$BOXGAME_IMAGE" >> "$MOCK_LOG";;
 exec) [[ "\${@: -1}" == '${previous}' ]];;
 *) exit 1;;
 esac\n`,
  );
  const script = path.resolve("scripts/deploy-image.sh");
  try {
    const env = {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      MOCK_MAIN: sha,
      MOCK_LOG: log,
    };
    const run = spawnSync("bash", [script, dir, sha], {
      env,
      encoding: "utf8",
    });
    assert.equal(run.status, 1);
    assert.match(run.stdout, /Previous image restored and healthy/);
    assert.deepEqual(readFileSync(log, "utf8").trim().split("\n"), [
      `boxgame:${sha}`,
      `boxgame:${previous}`,
    ]);
    const blocked = spawnSync("bash", [script, dir, sha], {
      env: { ...env, MOCK_GATE_EXIT: "2" },
      encoding: "utf8",
    });
    assert.equal(blocked.status, 2, "failed preflight must stop cutover");
    assert.equal(readFileSync(log, "utf8").trim().split("\n").length, 2);
    const skipped = spawnSync("bash", [script, dir, previous], {
      env,
      encoding: "utf8",
    });
    assert.equal(skipped.status, 0);
    assert.match(skipped.stdout, /superseded/);
    assert.equal(readFileSync(log, "utf8").trim().split("\n").length, 2);
    const invalid = spawnSync("bash", [script, dir, "invalid"], {
      env,
      encoding: "utf8",
    });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stdout, /Invalid release/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
