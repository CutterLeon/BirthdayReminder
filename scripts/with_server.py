"""
Startet einen Entwicklungsserver im Hintergrund, wartet auf den Port,
führt danach ein Kommando aus (z. B. Playwright), beendet den Server.

Usage:
  python scripts/with_server.py --server "npm run dev" --port 5173 -- python scripts/e2e_smoke.py
"""

from __future__ import annotations

import argparse
import os
import socket
import subprocess
import sys
import time


def port_open(host: str, port: int) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.settimeout(0.4)
        s.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def main() -> None:
    p = argparse.ArgumentParser(description="Run command while dev server is up")
    p.add_argument("--server", required=True, help='Shell command, e.g. "npm run dev"')
    p.add_argument("--port", type=int, default=5173)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--timeout", type=int, default=90, help="Seconds to wait for port")
    args, rest = p.parse_known_args()

    if not rest or rest[0] != "--":
        print(
            "Nach den Optionen bitte `--` und dann das Kommando angeben.\n"
            'Beispiel: python scripts/with_server.py --server "npm run dev" '
            "--port 5173 -- python scripts/e2e_smoke.py",
            file=sys.stderr,
        )
        sys.exit(2)

    cmd = rest[1:]
    if not cmd:
        print("Kein Kommando nach `--`", file=sys.stderr)
        sys.exit(2)

    cwd = os.getcwd()
    proc = subprocess.Popen(
        args.server,
        shell=True,
        cwd=cwd,
        env=os.environ.copy(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    exit_code = 1
    try:
        deadline = time.monotonic() + args.timeout
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                print("Server-Prozess ist beendet worden.", file=sys.stderr)
                sys.exit(1)
            if port_open(args.host, args.port):
                time.sleep(0.4)
                break
            time.sleep(0.4)
        else:
            print(f"Timeout: Port {args.port} nicht erreichbar.", file=sys.stderr)
            sys.exit(1)

        r = subprocess.run(cmd, cwd=cwd, env=os.environ.copy())
        exit_code = r.returncode
    finally:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                cwd=cwd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
