# 30-day validation plan

The brief treats demand as a hypothesis from social media. These numbers tell you whether to continue. Decide the thresholds now, before you see the data.

## Numbers to read (from the `Event` table and the database)
| Metric | Where | Healthy at day 30 | Stop and rethink if |
|---|---|---|---|
| Listings posted by landlords you did not personally recruit | `Listing` count, owner not in your seed sheet | 10 or more | 0 |
| Active tenant searches | `Requirement` count | 50 or more | under 15 |
| Interests sent | `Event` `interest_sent` | 40 or more | under 10 |
| Accept rate | `interest_accepted` ÷ `interest_sent` | 30% or more | under 10% |
| Median time to answer | `Interest.respondedAt - createdAt` | under 24 hours | over 3 days |
| Repeat visitors (week 4 vs week 1) | Vercel Web Analytics, or ask 10 users | 25% return | under 10% |
| Reports per 100 listings | `Report` count | under 5 | any unresolved harassment report older than 48 hours |

## Qualitative checks
- Talk to 10 people: 5 tenants, 3 landlords, 2 women renters. One question: “What did you do after you used the site?”
- Count how many accepted interests became a visit (ask both sides).
- Read every rejected text: does `textGuard` reject too much or miss things?

## Decision at day 30
- All healthy: add photos, edit pages and a notification digest, then spend on a domain.
- Supply fine, demand weak: change promotion, not product.
- Demand fine, supply weak: more landlord outreach.
- Both weak: stop. The cost was almost nothing, which was the point.

Update `docs/RISKS.md` with what you learn.
