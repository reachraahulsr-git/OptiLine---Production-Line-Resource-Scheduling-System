#!/usr/bin/env python3
"""
CLI runner for direct dispatching of commands without a background socket.
Used by Express bridge as an instant fallback when TCP socket is offline,
ensuring zero-downtime and eliminating 127.0.0.1:8765 dependency.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dispatcher import get_dispatcher

def main():
    try:
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        req = json.loads(raw_input)
        dispatcher = get_dispatcher()
        res = dispatcher.dispatch(req)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"CLI dispatch error: {e}"}))

if __name__ == "__main__":
    main()
