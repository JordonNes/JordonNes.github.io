"""Read the complete publication history, including bounded daily archives."""
import json
from pathlib import Path


def load_ledger(path):
    path = Path(path)
    if not path.exists():
        return {'suggestions': []}
    payload = json.loads(path.read_text(encoding='utf-8'))
    rows = list(payload.get('suggestions') or [])
    seen = {r.get('suggestion_id') for r in rows}
    for name in payload.get('archive_files') or []:
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts or relative.parts[0] != 'suggestions':
            raise ValueError(f'Invalid publication archive reference: {name}')
        shard = json.loads((path.parent/relative).read_text(encoding='utf-8'))
        for row in shard.get('suggestions') or []:
            if row.get('suggestion_id') not in seen:
                rows.append(row)
                seen.add(row.get('suggestion_id'))
    payload['suggestions'] = rows
    return payload
