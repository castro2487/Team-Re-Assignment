# Team Reassignment System

A system for reassigning players to balanced teams based on comprehensive engagement metrics from multiple data sources.

## Run Instructions

1. Install dependencies:

npm install

2. Run the application:

npm start -- --teams=3

Arguments:

   --teams=N: Number of teams to create (default: 3)

Output
The application outputs two sections to stdout:

1. Player Team Assignments (CSV format):

player_id,new_team
1,1
2,2
3,3
...

2. Team Summaries:

Team 1:
  Players: 1,4,7,10,13
  Average Engagement Score: 0.62
  Justification: Team 1 has 5 players with an average engagement score of 0.62. The team is well-balanced with a score range of 0.15 (min: 0.54, max: 0.69). Players were assigned using a round-robin distribution based on comprehensive metrics from all 4 data files: core player metrics (Level A), action patterns (Level B Actions), event participation (Level B Events), and communication engagement (Level B Messages).

Approach & Tradeoffs

Approach
I created a system that integrates data from all 4 provided files to create a comprehensive player engagement score. The system:

1. Loads and processes data from all Excel files
2. Calculates aggregated metrics from Level B data
3. Normalizes all metrics to a 0-1 scale
4. Computes an engagement score as the average of all normalized metrics
5. Assigns players to teams using a round-robin algorithm based on engagement scores
6. Generates team summaries with balance metrics and justifications
   
Tradeoffs

1. Simplicity vs. Complexity: I chose a simple average of normalized metrics rather than a complex weighted model. This makes the system easier to understand and verify while still providing balanced teams.
2. Completeness vs. Timeliness: I focused on essential aggregated metrics from Level B data rather than extracting every possible detail. This allowed me to deliver a complete solution within the time constraint.
3. Algorithm Choice: I used round-robin assignment instead of snake draft. While snake draft might provide slightly better balance, round-robin is simpler to implement and understand while still providing good balance.

Modeling Choice & Why

Modeling Choice: I normalized all metrics to a 0-1 scale and calculated the engagement score as a simple average of these normalized values.

Why: This approach ensures that all metrics contribute equally to the final score, preventing any single metric from dominating. Normalization accounts for different scales across metrics (e.g., points earned vs. days active). The simple average is transparent and easy to explain in justifications.

Tie-break Rule
When players have identical engagement scores, they are sorted by player_id in ascending order. The player with the lower ID is assigned to a team first in the round-robin process.

Assumptions

1. Level B Data Assumptions:
   . For actions: I aggregated total actions and unique action types per player
   . For events: I calculated total events and average performance score per player
   . For messages: I counted total messages and unique recipients per player
   
2. Data Quality: I assumed all Excel files are properly formatted and contain valid data.
3. Player Coverage: I assumed all players in Level A have corresponding entries in Level B files. If a player is missing from Level B, their metrics default to 0.

If I Had More Time

1. Enhanced Metrics: I would develop more sophisticated metrics from Level B data, such as action consistency, event engagement patterns, and communication quality.
2. Machine Learning: I would explore using machine learning to determine optimal weights for different metrics based on historical team performance.
3. Visualization: I would add visualization capabilities to help users understand team balance and player distributions.
4. Testing: I would add comprehensive unit tests to ensure data processing and team assignment logic work correctly.
5. Performance Optimization: For larger datasets, I would optimize the data processing pipeline to handle millions of records efficiently.

AI Usage
I did not use AI for this project.

Time Spent
2 hours


