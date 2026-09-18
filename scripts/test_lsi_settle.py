#!/usr/bin/env python3
"""Deterministic safety tests for LSI settlement grading rules."""
import unittest

from scripts.lsi_settle import event_final, grade_numeric


class SettlementRulesTest(unittest.TestCase):
    def test_over_under_and_push(self):
        over={"market_class":"PLAYER_PROP","market":"passing yards","side":"Over","threshold":"250.5"}
        under={"market_class":"PLAYER_PROP","market":"passing yards","side":"Under","threshold":"250"}
        self.assertEqual(grade_numeric(over,251),"WIN")
        self.assertEqual(grade_numeric(over,249),"LOSS")
        self.assertEqual(grade_numeric(under,249),"WIN")
        self.assertEqual(grade_numeric(under,250),"PUSH")

    def test_milestone_and_touchdown(self):
        milestone={"market_class":"PLAYER_PROP","market":"rushing yards","side":"Over","threshold":"60+","selection":"60+ rushing yards"}
        td={"market_class":"PLAYER_PROP","market":"Anytime TD","side":"Yes","threshold":"0.5"}
        self.assertEqual(grade_numeric(milestone,60),"WIN")
        self.assertEqual(grade_numeric(td,1),"WIN")
        self.assertEqual(grade_numeric(td,0),"LOSS")

    def test_nonfinal_event_never_settles(self):
        scheduled={"status":{"type":{"completed":False,"name":"STATUS_SCHEDULED"}}}
        final={"status":{"type":{"completed":True,"name":"STATUS_FINAL"}}}
        self.assertFalse(event_final(scheduled))
        self.assertTrue(event_final(final))


if __name__=="__main__":unittest.main()
