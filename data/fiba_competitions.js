window.FIBA_COMPETITIONS={
  "updated": "2026-09-22T23:53:00Z",
  "aliases": {
    "FIBA_Men": "FIBA",
    "FIBA_Women": "FIBA"
  },
  "tiebreakPolicy": {
    "id": "FIBA_OBR_2024_D1",
    "sourceURL": "https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-v10a.pdf",
    "classificationPoints": {
      "win": 2,
      "loss": 1,
      "forfeit": 0
    },
    "order": [
      "Win-loss record",
      "Games among tied teams",
      "Point differential among tied teams",
      "Points scored among tied teams",
      "Overall group point differential",
      "Overall group points scored",
      "FIBA ranking for national-team competitions if still tied; otherwise draw where no ranking exists"
    ]
  },
  "tracks": {
    "men": {
      "label": "MEN’S FIBA",
      "competitions": [
        {
          "id": "fiba_intercontinental_cup_2026",
          "name": "FIBA Intercontinental Cup 2026",
          "sourceURL": "https://www.fiba.basketball/en/events/fiba-intercontinental-cup-2026",
          "scope": "CLUB",
          "status": "LIVE",
          "dates": "Sep 22–27, 2026",
          "host": "Beijing, China",
          "phase": "Group Phase",
          "format": "6 clubs • 2 groups of 3 • top 2 each advance to crossover semifinals",
          "progression": [
            "Group Phase",
            "Semi-Finals",
            "3rd / 5th Placement",
            "Final"
          ],
          "scenarioRules": {
            "mode": "ROUND_ROBIN",
            "tiebreakPolicy": "FIBA_OBR_2024_D1",
            "advancementPositions": [
              1,
              2
            ],
            "securedLabel": "SEMIFINAL BERTH SECURED",
            "positionDestinations": {
              "1": "SEMIFINAL • GROUP WINNER",
              "2": "SEMIFINAL • RUNNER-UP",
              "3": "5TH-PLACE GAME"
            }
          },
          "groups": {
            "A": [
              {
                "team": "Rytas Vilnius",
                "w": 1,
                "l": 0,
                "pd": 18
              },
              {
                "team": "Shanghai Sharks",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "RSSB Tigers",
                "w": 0,
                "l": 1,
                "pd": -18
              }
            ],
            "B": [
              {
                "team": "Boca Juniors",
                "w": 1,
                "l": 0,
                "pd": 10
              },
              {
                "team": "NBA G League United",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Beijing Royal Fighters",
                "w": 0,
                "l": 1,
                "pd": -10
              }
            ]
          },
          "games": [
            {
              "date": "Sep 22",
              "phase": "Group A",
              "away": "RSSB Tigers",
              "home": "Rytas Vilnius",
              "status": "FINAL",
              "score": "89–107"
            },
            {
              "date": "Sep 22",
              "phase": "Group B",
              "away": "Beijing Royal Fighters",
              "home": "Boca Juniors",
              "status": "FINAL",
              "score": "78–88"
            },
            {
              "date": "Sep 23",
              "phase": "Group A",
              "away": "RSSB Tigers",
              "home": "Shanghai Sharks",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 23",
              "phase": "Group B",
              "away": "NBA G League United",
              "home": "Beijing Royal Fighters",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 24",
              "phase": "Group A",
              "away": "Shanghai Sharks",
              "home": "Rytas Vilnius",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 24",
              "phase": "Group B",
              "away": "NBA G League United",
              "home": "Boca Juniors",
              "status": "UPCOMING",
              "score": ""
            }
          ]
        },
        {
          "id": "fiba_world_cup_2027_qualifiers",
          "name": "FIBA Basketball World Cup 2027 Qualifiers",
          "sourceURL": "https://about.fiba.basketball/en/our-sport/basketball/national-team-competition-systems/fiba-basketball-world-cup",
          "scope": "NATIONAL TEAM",
          "status": "ACTIVE CYCLE",
          "dates": "Nov 2025–Mar 2027",
          "host": "Regional qualifying windows",
          "phase": "Second Round",
          "format": "Regional qualification through Africa, Americas, Asia/Oceania and Europe",
          "progression": [
            "Regional First Round",
            "Regional Second Round",
            "World Cup 2027"
          ],
          "scenarioRules": {
            "mode": "EXTERNAL_GROUP_TABLES",
            "note": "Scenario engine activates when regional standings and remaining schedules are ingested."
          }
        }
      ]
    },
    "women": {
      "label": "WOMEN’S FIBA",
      "competitions": [
        {
          "id": "wbl_americas_2026",
          "name": "FIBA Women’s Basketball League Americas 2026",
          "sourceURL": "https://www.fiba.basketball/en/events/womens-basketball-league-americas-2026",
          "scope": "CLUB",
          "status": "NEXT",
          "dates": "Sep 29–Oct 4, 2026",
          "host": "Santiago, Chile",
          "phase": "Group Phase",
          "format": "6 clubs • 2 groups of 3 • group winners direct to semifinals • 2nd vs opposite 3rd in quarterfinals",
          "progression": [
            "Group Phase",
            "Quarter-Finals",
            "Semi-Finals",
            "3rd / 5th Placement",
            "Final"
          ],
          "scenarioRules": {
            "mode": "ROUND_ROBIN",
            "tiebreakPolicy": "FIBA_OBR_2024_D1",
            "advancementPositions": [
              1,
              2,
              3
            ],
            "securedLabel": "TITLE PATH SECURED",
            "positionDestinations": {
              "1": "DIRECT SEMIFINAL",
              "2": "QUARTERFINAL • 2ND SEED",
              "3": "QUARTERFINAL • 3RD SEED"
            }
          },
          "groups": {
            "A": [
              {
                "team": "CDC Leones",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Ferro",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Defensor Sporting",
                "w": 0,
                "l": 0,
                "pd": 0
              }
            ],
            "B": [
              {
                "team": "Sportiva Italiana",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Bay Area Phoenix",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "SESI Araraquara",
                "w": 0,
                "l": 0,
                "pd": 0
              }
            ]
          },
          "games": [
            {
              "date": "Sep 29",
              "phase": "Group B",
              "away": "SESI Araraquara",
              "home": "Sportiva Italiana",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 29",
              "phase": "Group A",
              "away": "Defensor Sporting",
              "home": "CDC Leones",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 30",
              "phase": "Group B",
              "away": "Bay Area Phoenix",
              "home": "SESI Araraquara",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Sep 30",
              "phase": "Group A",
              "away": "Ferro",
              "home": "Defensor Sporting",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 1",
              "phase": "Group B",
              "away": "Sportiva Italiana",
              "home": "Bay Area Phoenix",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 1",
              "phase": "Group A",
              "away": "CDC Leones",
              "home": "Ferro",
              "status": "UPCOMING",
              "score": ""
            }
          ]
        },
        {
          "id": "wbl_asia_2026",
          "name": "FIBA Women’s Basketball League Asia 2026",
          "sourceURL": "https://www.fiba.basketball/en/events/fiba-womens-basketball-league-asia-2026",
          "scope": "CLUB",
          "status": "UPCOMING",
          "dates": "Oct 20–25, 2026",
          "host": "Bengaluru, India",
          "phase": "Group Phase",
          "format": "6 clubs • 2 groups of 3 • top 2 each advance to crossover semifinals",
          "progression": [
            "Group Phase",
            "Semi-Finals",
            "3rd / 5th Placement",
            "Final"
          ],
          "scenarioRules": {
            "mode": "ROUND_ROBIN",
            "tiebreakPolicy": "FIBA_OBR_2024_D1",
            "advancementPositions": [
              1,
              2
            ],
            "securedLabel": "SEMIFINAL BERTH SECURED",
            "positionDestinations": {
              "1": "SEMIFINAL • GROUP WINNER",
              "2": "SEMIFINAL • RUNNER-UP",
              "3": "CLASSIFICATION 5–6"
            }
          },
          "groups": {
            "A": [
              {
                "team": "Sichuan Yuanda Meile",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Cathay Life Tigers",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Akari Sparks",
                "w": 0,
                "l": 0,
                "pd": 0
              }
            ],
            "B": [
              {
                "team": "Denso Iris",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Cheongju KB Stars",
                "w": 0,
                "l": 0,
                "pd": 0
              },
              {
                "team": "Indian Railways",
                "w": 0,
                "l": 0,
                "pd": 0
              }
            ]
          },
          "games": [
            {
              "date": "Oct 20",
              "phase": "Group A",
              "away": "Sichuan Yuanda Meile",
              "home": "Cathay Life Tigers",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 20",
              "phase": "Group B",
              "away": "Denso Iris",
              "home": "Indian Railways",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 21",
              "phase": "Group A",
              "away": "Cathay Life Tigers",
              "home": "Akari Sparks",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 21",
              "phase": "Group B",
              "away": "Indian Railways",
              "home": "Cheongju KB Stars",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 22",
              "phase": "Group A",
              "away": "Akari Sparks",
              "home": "Sichuan Yuanda Meile",
              "status": "UPCOMING",
              "score": ""
            },
            {
              "date": "Oct 22",
              "phase": "Group B",
              "away": "Cheongju KB Stars",
              "home": "Denso Iris",
              "status": "UPCOMING",
              "score": ""
            }
          ]
        },
        {
          "id": "fiba_womens_world_cup_2026",
          "name": "FIBA Women’s Basketball World Cup 2026",
          "sourceURL": "https://www.fiba.basketball/en/events/fiba-womens-basketball-world-cup-2026",
          "scope": "NATIONAL TEAM",
          "status": "COMPLETE",
          "dates": "Sep 4–13, 2026",
          "host": "Berlin, Germany",
          "phase": "Complete",
          "format": "16-team final tournament",
          "progression": [
            "Pre-Qualifying",
            "Continental Cups",
            "Qualifying Tournaments",
            "World Cup"
          ]
        }
      ]
    }
  },
  "worldCupPaths": {
    "men": {
      "cycle": "FIBA Basketball World Cup 2027",
      "finalField": 32,
      "regions": [
        {
          "region": "Africa",
          "first": "16 teams → 4 groups of 4; top 3 in each advance",
          "second": "12 teams → 2 groups of 6; First Round results carried forward",
          "qualify": "Top 2 in each group + best 3rd-place team",
          "tickets": "5"
        },
        {
          "region": "Americas",
          "first": "16 teams → 4 groups of 4; top 3 in each advance",
          "second": "12 teams → 2 groups of 6; First Round results carried forward",
          "qualify": "Top 3 in each group + best 4th-place team",
          "tickets": "7"
        },
        {
          "region": "Asia / Oceania",
          "first": "16 teams → 4 groups of 4; Qatar is prequalified host but participates",
          "second": "12 teams → 2 groups of 6; First Round results carried forward",
          "qualify": "7 non-host qualifiers + host Qatar",
          "tickets": "8 incl. Qatar"
        },
        {
          "region": "Europe",
          "first": "32 teams → 8 groups of 4; top 3 in each advance",
          "second": "24 teams → 4 groups of 6; First Round results carried forward",
          "qualify": "Top 3 in each group",
          "tickets": "12"
        }
      ]
    },
    "women": {
      "cycle": "FIBA Women’s Basketball World Cup 2026",
      "finalField": 16,
      "stages": [
        {
          "stage": "Pre-Qualifying Tournaments (2024)",
          "field": "16 teams",
          "format": "2 tournaments of 8; each has 2 groups of 4 → top 2 per group to semifinals",
          "advance": "Winner of each tournament advances to 2026 Qualifying Tournaments (2 teams)"
        },
        {
          "stage": "Women’s Continental Cups (2025)",
          "field": "Regional fields",
          "format": "AfroBasket, Asia Cup, AmeriCup and EuroBasket determine most Qualifying Tournament berths",
          "advance": "Continental champions also receive automatic World Cup qualification"
        },
        {
          "stage": "World Cup Qualifying Tournaments (Mar 2026)",
          "field": "24 teams",
          "format": "4 tournaments of 6; single round robin, 5 games per team",
          "advance": "Normally top 3 in each tournament qualify alongside an already-qualified Continental Cup champion; host/champion configuration adjusts one tournament"
        },
        {
          "stage": "Women’s Basketball World Cup 2026",
          "field": "16 teams",
          "format": "Final tournament in Berlin",
          "advance": "World Cup field"
        }
      ]
    }
  }
};
