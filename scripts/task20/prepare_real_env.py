#!/usr/bin/env python3
"""Task 20 — provision real Supabase test users for the E2E suite.

Creates three auto-confirmed users (admin / reviewer / user) through the anon
signup endpoint, then assigns their profile roles with the linked Supabase CLI
(SERVICE_ROLE is not usable on this project). Writes credentials to
backups/task20/test_users.json, which Task20RealSupabase.test.ts consumes.

Usage:
    python3 scripts/task20/prepare_real_env.py
    TASK20_REAL=1 npx vitest run src/services/__tests__/task20/Task20RealSupabase.test.ts
"""
from __future__ import annotations

import json
import pathlib
import subprocess
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env"
OUT_PATH = ROOT / "backups" / "task20" / "test_users.json"


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value.strip().strip('"').strip("'")
    return values


def post_json(url: str, payload: dict, headers: dict[str, str]) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read() or "{}")


def main() -> None:
    env = load_env()
    base_url = env["VITE_SUPABASE_URL"]
    anon_key = env["VITE_SUPABASE_ANON_KEY"]
    import os, secrets
    password = os.environ.get("TASK20_TEST_USER_PASSWORD") or f"T20-Test-{secrets.token_hex(8)}!Aa1"
    stamp = int(time.time())

    emails = {
        "admin": f"t20.admin.{stamp}@example.com",
        "reviewer": f"t20.reviewer.{stamp}@example.com",
        "user": f"t20.user.{stamp}@example.com",
    }

    users: dict[str, dict[str, str]] = {}
    for role, email in emails.items():
        signup = post_json(
            f"{base_url}/auth/v1/signup",
            {"email": email, "password": password},
            {"apikey": anon_key},
        )
        user_id = (signup.get("user") or {}).get("id")
        if not user_id:
            raise SystemExit(f"signup failed for {role}: {signup}")
        users[role] = {"email": email, "password": password, "id": user_id}
        print(f"created {role}: {email} ({user_id})")

    statements = []
    for role, user in users.items():
        statements.append(
            "update public.profiles set role = '{role}', email = '{email}' "
            "where id = '{uid}';".format(role=role, email=user["email"], uid=user["id"])
        )
    sql = "\n".join(statements)
    result = subprocess.run(
        ["supabase", "db", "query", "--linked", f"begin;\n{sql}\ncommit;"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    output = (result.stdout or "") + (result.stderr or "")
    if "Failed to run sql query" in output or "unexpected status" in output:
        raise SystemExit(f"role assignment failed:\n{output}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(users, indent=2) + "\n")
    print(f"wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
