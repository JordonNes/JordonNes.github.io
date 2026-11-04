import json
import tempfile
import unittest
from pathlib import Path
from scripts.lsi_suggestion_store import load_ledger
from scripts.lsi_recap_audit import build, season, stat, unique_rows, ticket_grade, market_type


class RecapAuditTests(unittest.TestCase):
    def test_history_shards_are_complete_and_fail_on_missing_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root/'suggestions').mkdir()
            (root/'ledger.json').write_text(json.dumps({'suggestions': [{'suggestion_id': 'today'}], 'archive_files': ['suggestions/2026-10-01.json']}))
            with self.assertRaises(FileNotFoundError):
                load_ledger(root/'ledger.json')
            (root/'suggestions/2026-10-01.json').write_text(json.dumps({'suggestions': [{'suggestion_id': 'yesterday'}]}))
            self.assertEqual(len(load_ledger(root/'ledger.json')['suggestions']), 2)

    def test_sport_seasons(self):
        self.assertEqual(season('NBA', '2027-01-03'), '2026-27')
        self.assertEqual(season('NBA', '2026-11-03'), '2026-27')
        self.assertEqual(season('NFL', '2027-01-10'), '2026')
        self.assertEqual(season('MLB', '2026-09-21'), '2026')

    def test_denominator_and_duplicate_outcomes(self):
        rows = [{'outcome': 'a', 'grade': 'UNGRADED'}, {'outcome': 'a', 'grade': 'HIT'},
                {'outcome': 'b', 'grade': 'MISS'}, {'outcome': 'c', 'grade': 'PUSH'},
                {'outcome': 'd', 'grade': 'VOID'}, {'outcome': 'e', 'grade': 'UNGRADED'}]
        s = stat(unique_rows(rows))
        self.assertEqual(s, {'published': 5, 'hits': 1, 'misses': 1, 'ungraded': 1, 'push_void': 2, 'accuracy': 50})

    def test_tickets_with_unresolved_and_void_legs(self):
        self.assertEqual(ticket_grade(['HIT', 'UNGRADED']), 'UNGRADED')
        self.assertEqual(ticket_grade(['MISS', 'UNGRADED']), 'MISS')
        self.assertEqual(ticket_grade(['HIT', 'VOID']), 'HIT')
        self.assertEqual(ticket_grade(['PUSH', 'VOID']), 'VOID')
        self.assertEqual(ticket_grade([]), 'UNGRADED')

    def test_prop_families(self):
        self.assertEqual(market_type('Player Pass Tds'), 'Passing touchdowns')
        self.assertEqual(market_type('Player Receptions'), 'Receptions')
        self.assertNotEqual(market_type('Player Receptions'), market_type('Player Reception Yds'))

    def test_feed_preserves_every_version_and_exact_card_mapping(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root/'data').mkdir()
            base = {'league': 'NFL', 'publication_date_pt': '2026-11-03', 'event_id': 'game1',
                    'event_start_pt': '2026-11-03T20:00:00Z', 'participant': 'Example Player',
                    'market_class': 'PLAYER_PROP', 'market': 'Player Receptions', 'side': 'OVER',
                    'threshold': 4.5, 'ljpc': 80, 'book': 'Example Book', 'capture_validity': 'VALID',
                    'accuracy_eligible': True, 'placements': ['TWENTY_PIECE', 'QC_NORMAL'],
                    'display_text': 'Example Player OVER 4.5 Player Receptions • LJPC 80%'}
            rows = [{**base, 'suggestion_id': 'one'}, {**base, 'suggestion_id': 'two', 'ljpc': 81},
                    {**base, 'suggestion_id': 'alternate', 'threshold': 2.5, 'pom_type': 'GOBLIN'},
                    {**base, 'suggestion_id': 'quarantine', 'accuracy_eligible': False}]
            results = {'one': {'grade': 'WIN', 'actual_result': '6', 'source': 'FINAL_BOX_SCORE'},
                       'alternate': {'grade': 'WIN', 'actual_result': '6', 'source': 'FINAL_BOX_SCORE'}}
            cards = {'cards': [{'id': 'card1', 'league': 'NFL', 'date': '2026-11-03', 'event_id': 'game1',
                       'groups': [{'name': 'QC_NORMAL', 'legs': [{'suggestion_id': 'one', 'text': base['display_text']},
                                  {'suggestion_id': 'missing', 'text': 'Missing archived line'}]}]}]}
            (root/'data/qc_card_ledger.json').write_text(json.dumps(cards))
            manifest = build(root, rows, results, {'NFL': ('NFL', '', 'NFL.html')})
            feed = json.loads((root/'data/recaps/NFL.json').read_text())
            self.assertEqual(len(feed['rows']), 4)
            by_id = {r['id']: r for r in feed['rows']}
            self.assertEqual(by_id['two']['grade'], 'HIT')  # exact outcome reuse
            self.assertEqual(by_id['quarantine']['grade'], 'UNGRADED')
            self.assertIsNone(by_id['quarantine']['actual'])
            self.assertIsNone(by_id['alternate']['market_error'])
            self.assertEqual(by_id['one']['market_error'], 1.5)
            self.assertEqual(feed['cards'][0]['groups'][0]['grade'], 'UNGRADED')
            self.assertEqual(manifest['sports']['NFL']['season_props']['hits'], 2)


if __name__ == '__main__':
    unittest.main()
