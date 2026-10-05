import unittest
from datetime import datetime,timezone
from nhl_player_history import facts,norm
class FactsTest(unittest.TestCase):
 def test_completed_regular_facts_and_stable_identity(self):
  now=datetime(2026,10,5,tzinfo=timezone.utc)
  games=[{'gameDate':'2026-10-03','gameId':123,'goals':2,'assists':1,'points':3,'shots':5}, {'gameDate':'2026-10-05','gameId':124,'goals':0}, {'gameDate':'2026-10-06','gameId':125,'goals':1}, {'gameDate':'bad','gameId':126,'goals':1}]
  rows=facts('Test Player',99,games,now)
  self.assertEqual({x['metric']:x['value'] for x in rows},{'goals':2,'hockey_assists':1,'points':3,'shots_on_goal':5})
  self.assertTrue(all(x['provider_event_id']=='123' and x['provider_player_id']=='99' for x in rows))
  self.assertEqual([x['record_id'] for x in rows],[x['record_id'] for x in facts('Test Player',99,games,datetime(2026,10,6,tzinfo=timezone.utc)) if x['provider_event_id']=='123'])
 def test_goalie_saves_do_not_become_skater_shots(self):
  rows=facts('Test Goalie',10,[{'gameDate':'2026-10-01','gameId':1,'saves':29,'shotsAgainst':32}],datetime(2026,10,5,tzinfo=timezone.utc))
  self.assertEqual([(x['metric'],x['value']) for x in rows],[('saves',29)])
 def test_name_normalization(self):self.assertEqual(norm('Tim Stützle'),norm('Tim Stutzle'))
if __name__=='__main__':unittest.main()
