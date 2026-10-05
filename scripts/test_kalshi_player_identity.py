import unittest
from kalshi_public_adapter import valid_player_identity,canonical_player_label
class IdentityTest(unittest.TestCase):
 def test_team_propositions_are_not_players(self):
  for name in ['NO Saints over 3.5 points','ATL Falcons under 24.5 points','Total points scored','Player']:
   self.assertFalse(valid_player_identity(name),name)
 def test_real_athlete_and_ladder_labels(self):
  for name in ['Chris Olave','Brian Thomas Jr.','C.J. Stroud','CJ Abrams: 1+']:
   self.assertTrue(valid_player_identity(canonical_player_label(name)),name)
if __name__=='__main__':unittest.main()
