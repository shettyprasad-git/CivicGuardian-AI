# Security Spec

## Data Invariants
1. Reports must have a valid `userId` matching `request.auth.uid`.
2. Users can create reports, anyone authenticated can read reports (including anonymous users).
3. Comments must be linked to an existing report.
4. Votes must be linked to an existing report.
5. Users can only update their own reports (status updates, etc).

## Dirty Dozen Payloads
- TBD in testing.

## Test Runner
- TBD.
