
```markdown
# Key Decisions

This document outlines key choices made during development.

## 1. Data Integration (teamReassignment.ts: loadLevelA, processActions, processEvents, processMessages)

I chose to load each Excel file separately and aggregate metrics from Level B data into simple counts and averages. This approach ensures we use all 4 data files as required while keeping the processing manageable.

## 2. Engagement Score Calculation (teamReassignment.ts: calculateEngagementScores)

I decided to use a simple average of normalized metrics rather than a complex weighted model. This makes the system transparent and easy to explain in justifications while still providing balanced teams.

## 3. Team Assignment Algorithm (teamReassignment.ts: assignTeams)

I chose round-robin assignment over snake draft. While snake draft might provide slightly better balance, round-robin is simpler to implement and understand while still providing good balance.

## 4. Normalization Approach (teamReassignment.ts: calculateEngagementScores)

I used min-max normalization for all metrics to bring them to a common 0-1 scale. This ensures all metrics contribute equally regardless of their original scale.

## 5. Error Handling (teamReassignment.ts: main)

I implemented a try-catch block around the main processing logic to handle any errors gracefully and provide meaningful error messages to users.
