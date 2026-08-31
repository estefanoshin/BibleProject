#!/usr/bin/env python3
import json
import subprocess
import sys

data = json.loads(
    subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "-j"])
)
devices = [
    device
    for runtime, entries in data.get("devices", {}).items()
    if "iOS" in runtime
    for device in entries
    if device.get("isAvailable")
]

prefer = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
chosen = next(
    (
        device
        for device in devices
        if prefer and prefer in (device.get("udid", ""), device.get("name", ""))
    ),
    None,
)
if chosen is None:
    chosen = next((device for device in devices if device.get("state") == "Booted"), None)
if chosen is None:
    chosen = next((device for device in devices if "iPhone" in device.get("name", "")), None)
if chosen is None and devices:
    chosen = devices[0]
if chosen is None:
    sys.exit("No available iOS Simulator found. Install one via Xcode > Settings > Platforms.")

print(chosen["udid"])
