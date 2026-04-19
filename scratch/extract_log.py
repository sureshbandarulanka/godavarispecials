import json
import os

log_path = r"C:\Users\Suresh\.gemini\antigravity\brain\b81b73af-7efa-46bb-8c76-983aef1e090e\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 38:
                print(data.get('content'))
        except:
            pass
