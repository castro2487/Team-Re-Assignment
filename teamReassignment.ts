import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Player interface with metrics from all data sources
interface Player {
  player_id: number;
  // Level A metrics
  current_total_points: number;
  historical_events_participated: number;
  historical_messages_sent: number;
  days_active_last_30: number;
  
  // Level B aggregated metrics
  total_actions: number;
  unique_actions: number;
  total_events: number;
  avg_event_performance: number;
  total_messages: number;
  unique_recipients: number;
  
  // Final score
  engagement_score: number;
}

// Load Level A data
function loadLevelA(): Map<number, Partial<Player>> {
  const filePath = path.join(__dirname, 'data', 'level_a_players.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet);
  
  const playerMap = new Map<number, Partial<Player>>();
  
  data.forEach(row => {
    const player: Partial<Player> = {
      player_id: row.player_id,
      current_total_points: row.current_total_points,
      historical_events_participated: row.historical_events_participated,
      historical_messages_sent: row.historical_messages_sent,
      days_active_last_30: row.days_active_last_30
    };
    playerMap.set(row.player_id, player);
  });
  
  return playerMap;
}

// Process Level B Actions
function processActions(playerMap: Map<number, Partial<Player>>) {
  const filePath = path.join(__dirname, 'data', 'level_b_actions.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const actions = XLSX.utils.sheet_to_json<any[]>(sheet);
  
  const actionCounts = new Map<number, { total: number; unique: Set<string> }>();
  
  actions.forEach(action => {
    const playerId = action.player_id;
    if (!actionCounts.has(playerId)) {
      actionCounts.set(playerId, { total: 0, unique: new Set() });
    }
    const counts = actionCounts.get(playerId)!;
    counts.total++;
    counts.unique.add(action.action_type);
  });
  
  actionCounts.forEach((counts, playerId) => {
    const player = playerMap.get(playerId);
    if (player) {
      player.total_actions = counts.total;
      player.unique_actions = counts.unique.size;
    }
  });
}

// Process Level B Events
function processEvents(playerMap: Map<number, Partial<Player>>) {
  const filePath = path.join(__dirname, 'data', 'level_b_events.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const events = XLSX.utils.sheet_to_json<any[]>(sheet);
  
  const eventStats = new Map<number, { total: number; totalScore: number }>();
  
  events.forEach(event => {
    const playerId = event.player_id;
    if (!eventStats.has(playerId)) {
      eventStats.set(playerId, { total: 0, totalScore: 0 });
    }
    const stats = eventStats.get(playerId)!;
    stats.total++;
    stats.totalScore += event.performance_score || 0;
  });
  
  eventStats.forEach((stats, playerId) => {
    const player = playerMap.get(playerId);
    if (player) {
      player.total_events = stats.total;
      player.avg_event_performance = stats.total / stats.total;
    }
  });
}

// Process Level B Messages
function processMessages(playerMap: Map<number, Partial<Player>>) {
  const filePath = path.join(__dirname, 'data', 'level_b_messages.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const messages = XLSX.utils.sheet_to_json<any[]>(sheet);
  
  const messageStats = new Map<number, { total: number; recipients: Set<number> }>();
  
  messages.forEach(message => {
    const playerId = message.player_id;
    if (!messageStats.has(playerId)) {
      messageStats.set(playerId, { total: 0, recipients: new Set() });
    }
    const stats = messageStats.get(playerId)!;
    stats.total++;
    stats.recipients.add(message.recipient_id);
  });
  
  messageStats.forEach((stats, playerId) => {
    const player = playerMap.get(playerId);
    if (player) {
      player.total_messages = stats.total;
      player.unique_recipients = stats.recipients.size;
    }
  });
}

// Calculate engagement score
function calculateEngagementScores(players: Player[]): Player[] {
  // Find min/max for each metric
  const metrics = [
    'current_total_points', 'historical_events_participated', 'historical_messages_sent',
    'days_active_last_30', 'total_actions', 'unique_actions', 'total_events',
    'avg_event_performance', 'total_messages', 'unique_recipients'
  ] as const;
  
  const minMax: Record<string, { min: number; max: number }> = {};
  
  metrics.forEach(metric => {
    const values = players.map(p => p[metric] || 0);
    minMax[metric] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });
  
  // Normalize and calculate score
  return players.map(player => {
    let score = 0;
    
    metrics.forEach(metric => {
      const value = player[metric] || 0;
      const { min, max } = minMax[metric];
      const normalized = max > min ? (value - min) / (max - min) : 0;
      score += normalized;
    });
    
    player.engagement_score = score / metrics.length;
    return player;
  });
}

// Assign teams using round-robin
function assignTeams(players: Player[], numTeams: number): Map<number, number> {
  // Sort by engagement score (descending)
  const sorted = [...players].sort((a, b) => b.engagement_score - a.engagement_score);
  
  const teamAssignments = new Map<number, number>();
  
  // Round-robin assignment
  sorted.forEach((player, index) => {
    const teamId = (index % numTeams) + 1;
    teamAssignments.set(player.player_id, teamId);
  });
  
  return teamAssignments;
}

// Generate team summaries
function generateSummaries(
  teamAssignments: Map<number, number>,
  players: Player[]
): Array<{
  team_id: number;
  player_ids: number[];
  avg_score: number;
  justification: string;
}> {
  const teams = new Map<number, Player[]>();
  
  // Group players by team
  players.forEach(player => {
    const teamId = teamAssignments.get(player.player_id)!;
    if (!teams.has(teamId)) {
      teams.set(teamId, []);
    }
    teams.get(teamId)!.push(player);
  });
  
  // Create summaries
  const summaries = [];
  for (const [teamId, teamPlayers] of teams) {
    const playerIds = teamPlayers.map(p => p.player_id);
    const avgScore = teamPlayers.reduce((sum, p) => sum + p.engagement_score, 0) / teamPlayers.length;
    
    // Calculate balance metrics
    const scores = teamPlayers.map(p => p.engagement_score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;
    
    summaries.push({
      team_id: teamId,
      player_ids,
      avg_score: avgScore,
      justification: `Team ${teamId} has ${teamPlayers.length} players with an average engagement score of ${avgScore.toFixed(2)}. ` +
        `The team is well-balanced with a score range of ${range.toFixed(2)} (min: ${minScore.toFixed(2)}, max: ${maxScore.toFixed(2)}). ` +
        `Players were assigned using round-robin distribution based on comprehensive metrics from all 4 data files: ` +
        `core player metrics (Level A), action patterns (Level B Actions), event participation (Level B Events), ` +
        `and communication engagement (Level B Messages).`
    });
  }
  
  return summaries.sort((a, b) => a.team_id - b.team_id);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const numTeams = parseInt(args.find(arg => arg.startsWith('--teams='))?.split('=')[1] || '3', 10);
  
  if (isNaN(numTeams) || numTeams < 1) {
    console.error('Error: Invalid number of teams');
    process.exit(1);
  }
  
  try {
    // Load and process all data
    const playerMap = loadLevelA();
    processActions(playerMap);
    processEvents(playerMap);
    processMessages(playerMap);
    
    // Convert to array and calculate scores
    let players = Array.from(playerMap.values()).map(p => p as Player);
    players = calculateEngagementScores(players);
    
    // Assign teams
    const teamAssignments = assignTeams(players, numTeams);
    
    // Generate summaries
    const summaries = generateSummaries(teamAssignments, players);
    
    // Output results
    console.log('player_id,new_team');
    players
      .sort((a, b) => a.player_id - b.player_id)
      .forEach(player => {
        console.log(`${player.player_id},${teamAssignments.get(player.player_id)}`);
      });
    
    console.log('\nTeam Summaries:');
    summaries.forEach(summary => {
      console.log(`\nTeam ${summary.team_id}:`);
      console.log(`  Players: ${summary.player_ids.join(', ')}`);
      console.log(`  Average Engagement Score: ${summary.avg_score.toFixed(2)}`);
      console.log(`  Justification: ${summary.justification}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
