#!/usr/bin/env python3
import copy
import unittest

import legz_statistical_spectrum as spec


class MaterialHashTests(unittest.TestCase):
    def setUp(self):
        self.prop = {
            "_league": "NCAA_Football",
            "_event_id": "CFB-WED-1",
            "participant": "Test Player",
            "team": "Weekday Away",
            "market": "Receptions",
            "threshold": 4.5,
            "threshold_operator": "gt",
            "side": "Over",
            "price": -110,
            "best_price": -105,
            "market_source_count": 2,
            "lineup_confirmed": True,
            "player_status": "ACTIVE",
            "source_snapshot_ids": ["SNAP-1"],
            "retrieved_at": "2026-09-23T10:00:00-07:00",
        }
        self.event = {
            "event_id": "CFB-WED-1",
            "away": "Weekday Away",
            "home": "Weekday Home",
            "commence_time": "2026-09-24T02:00:00Z",
            "venue": "Test Stadium",
            "venue_indoor": False,
            "status": "STATUS_SCHEDULED",
        }
        self.history = {
            ("NCAA_Football", "test player", "receptions"): [3, 5, 6, 4, 7],
        }
        self.contexts = {
            "test player": {
                "player": "Test Player",
                "player_status": "ACTIVE",
                "role": "STARTER",
                "published_at": "2026-09-23T09:00:00-07:00",
                "raw_source_id": "volatile-1",
            }
        }
        self.game_contexts = {
            ("test player", "CFB-WED-1"): {
                "participant": "Test Player",
                "event_id": "CFB-WED-1",
                "availability": "AVAILABLE",
                "weather": "CLEAR",
                "collected_at_pt": "2026-09-23T09:05:00-07:00",
            }
        }

    def material_hash(self, prop=None, history=None, contexts=None, event=None):
        material = spec.evaluation_input_material(
            prop or self.prop,
            event or self.event,
            history if history is not None else self.history,
            contexts if contexts is not None else self.contexts,
            self.game_contexts,
            {},
            {},
            tournament_ctx=None,
        )
        return spec.stable_hash(material)

    def test_retrieval_noise_does_not_force_recompute(self):
        changed = copy.deepcopy(self.prop)
        changed["retrieved_at"] = "2026-09-23T10:27:00-07:00"
        changed["source_snapshot_ids"] = ["SNAP-2"]
        self.assertEqual(self.material_hash(), self.material_hash(prop=changed))

    def test_exact_market_change_forces_recompute(self):
        changed = copy.deepcopy(self.prop)
        changed["threshold"] = 5.5
        self.assertNotEqual(self.material_hash(), self.material_hash(prop=changed))

    def test_price_change_forces_recompute(self):
        changed = copy.deepcopy(self.prop)
        changed["best_price"] = 115
        self.assertNotEqual(self.material_hash(), self.material_hash(prop=changed))

    def test_history_change_forces_recompute(self):
        history = copy.deepcopy(self.history)
        history[("NCAA_Football", "test player", "receptions")].append(8)
        self.assertNotEqual(self.material_hash(), self.material_hash(history=history))

    def test_role_or_availability_change_forces_recompute(self):
        contexts = copy.deepcopy(self.contexts)
        contexts["test player"]["player_status"] = "QUESTIONABLE"
        self.assertNotEqual(self.material_hash(), self.material_hash(contexts=contexts))

    def test_model_version_change_forces_recompute(self):
        original = spec.EVALUATION_VERSION
        try:
            before = self.material_hash()
            spec.EVALUATION_VERSION = original + "-TEST"
            after = self.material_hash()
        finally:
            spec.EVALUATION_VERSION = original
        self.assertNotEqual(before, after)


if __name__ == "__main__":
    unittest.main()
