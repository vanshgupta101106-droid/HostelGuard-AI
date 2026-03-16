# Comprehensive Risk Calculation System

This document outlines the multi-level risk scoring system implemented based on your flowchart requirements.

## System Architecture

The risk calculation system follows a hierarchical structure with four levels:

### 1. Block Level Risk Score

**Parameters:**
- **Weighted Incidents per 100 Students**: Number of weighted incidents normalized per 100 students
- **Average Stress in Block**: Average stress level from wellbeing surveys (1-10 scale)
- **Severe Behavior Density**: Ratio of severe behaviors to total students

**Calculation:**
```typescript
block_risk_score = (
  normalized_incidents * 0.4 +
  normalized_stress * 0.3 +
  normalized_severe_behavior * 0.3
)
```

### 2. Floor Level Risk Score

**Parameters:**
- **Floor Weighted Incidents per 100 Students**: Weighted incidents normalized per 100 students on this floor
- **Average Stress in Floor**: Average stress level for students on this floor (1-10 scale)
- **Floor Severe Behavior Density**: Ratio of severe behaviors to total students on this floor

**Calculation:**
```typescript
floor_risk_score = (
  normalized_incidents * 0.4 +
  normalized_stress * 0.3 +
  normalized_severe_behavior * 0.3
)
```

### 3. Room Level Risk Score

**Parameters:**
- **Room Total Incidents Last 30 Days**: Total number of incidents in this room over the last 30 days
- **Room Severe Behavior Count**: Number of severe behaviors recorded in this room
- **Room Flagged Recently Binary 14 Day Window**: Whether this room was flagged in the last 14 days (0/1)

**Calculation:**
```typescript
room_risk_score = (
  normalized_incidents * 0.6 +
  normalized_severe_behavior * 0.4
)
```

### 4. Roommate Behavior Aggregation

**Parameters:**
- **Roommate Behavior Weighted Scores**: Individual behavior scores for each roommate
- **Average Roommate Behavior Weighted Score**: Mean of all roommate scores

**Calculation:**
```typescript
average_roommate_score = mean(roommate_behavior_weighted_scores)
```

## Final Room Risk Feature Set

The final comprehensive risk score combines all levels:

**Parameters:**
- Block Risk Score (20% weight)
- Floor Risk Score (20% weight)
- Room Risk Score (30% weight)
- Average Roommate Behavior Score (20% weight)
- Recently Flagged (10% weight)

**Calculation:**
```typescript
final_risk_score = (
  block_risk_score * 0.2 +
  floor_risk_score * 0.2 +
  room_risk_score * 0.3 +
  normalized_roommate_score * 0.2 +
  room_flagged_recently * 0.1
)
```

## Data Sources

### Block Level Data
- **Incidents**: From `incident` table, filtered by block and last 30 days
- **Stress**: From `wellbeing_survey` table, averaged per block
- **Severe Behaviors**: From `behavior_log` table, filtered by severity='critical'

### Floor Level Data
- **Incidents**: From `incident` table, filtered by floor and last 30 days
- **Stress**: From `wellbeing_survey` table, averaged per floor
- **Severe Behaviors**: From `behavior_log` table, filtered by floor and severity='critical'

### Room Level Data
- **Incidents**: From `incident` table, filtered by room and last 30 days
- **Severe Behaviors**: From `behavior_log` table, filtered by room and severity='critical'
- **Recent Flags**: From `room_monitor_flag` table, filtered by last 14 days

### Roommate Behavior Data
- **Individual Scores**: Calculated from incidents and behaviors per student
- **Aggregation**: Mean of all roommate scores in the room

## Severity Weights

```typescript
const SEVERITY_WEIGHTS = {
  low: 1,
  medium: 3,
  high: 5,
  critical: 10
}
```

## Risk Levels

```typescript
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.8) return 'critical'
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}
```

## API Endpoints

### GET /api/risk/comprehensive
Query parameters:
- `roomId`: Calculate comprehensive risk for specific room
- `blockId`: Get block level data only
- `floorId`: Get floor level data only

### POST /api/risk/comprehensive
Request body:
```json
{
  "roomId": 123,
  "customWeights": {
    "block": { "incidents": 0.5, "stress": 0.3, "severe_behavior": 0.2 },
    "floor": { "incidents": 0.4, "stress": 0.4, "severe_behavior": 0.2 },
    "room": { "incidents": 0.7, "severe_behavior": 0.3 },
    "final": { "block": 0.15, "floor": 0.15, "room": 0.4, "roommates": 0.2, "flagged": 0.1 }
  }
}
```

## Implementation Files

1. **Service Layer**: `lib/services/comprehensive-risk.service.ts`
   - Data fetching functions
   - Risk calculation functions
   - Utility functions

2. **API Layer**: `app/api/risk/comprehensive/route.ts`
   - GET endpoint for risk calculations
   - POST endpoint for custom weight calculations

3. **UI Layer**: `app/dashboard/risk/comprehensive/page.tsx`
   - Interactive dashboard for risk analysis
   - Multi-tab interface for different risk levels
   - Visual representations of risk parameters

## Example Usage

```typescript
// Calculate comprehensive risk for room 123
const riskScores = await calculateComprehensiveRoomRisk(123);

console.log('Final Risk Score:', riskScores.final_room_risk_feature_set.final_risk_score);
console.log('Risk Level:', getRiskLevel(riskScores.final_room_risk_feature_set.final_risk_score));
console.log('Block Contribution:', riskScores.final_room_risk_feature_set.block_risk_contribution);
console.log('Floor Contribution:', riskScores.final_room_risk_feature_set.floor_risk_contribution);
console.log('Room Contribution:', riskScores.final_room_risk_feature_set.room_risk_contribution);
console.log('Roommate Contribution:', riskScores.final_room_risk_feature_set.roommate_risk_contribution);
```

## Flowchart Implementation

The system directly implements the flowchart structure:

```
Block Level:
├── Weighted Incidents per 100 Students
├── Average Stress in Block
└── Severe Behavior Density
    ↓
Block Risk Score

Floor Level:
├── Floor Weighted Incidents per 100 Students
├── Average Stress in Floor
└── Floor Severe Behavior Density
    ↓
Floor Risk Score

Room Level:
├── Room Total Incidents Last 30 Days
├── Room Severe Behavior Count
└── Room Flagged Recently Binary 14 Day Window
    ↓
Room Risk Score

Roommate Behavior Aggregation:
├── Roommate Behavior Weighted Score 1
├── Roommate Behavior Weighted Score 2
├── Roommate Behavior Weighted Score N
    ↓
Average Roommate Behavior Weighted Score

Final Integration:
├── Block Risk Score
├── Floor Risk Score
├── Room Risk Score
├── Average Roommate Behavior Weighted Score
└── Room Flagged Recently Binary 14 Day Window
    ↓
Final Room Risk Feature Set
```

## Key Features

1. **Multi-level Analysis**: Risk calculated at block, floor, room, and roommate levels
2. **Weighted Scoring**: Customizable weights for different parameters
3. **Real-time Data**: Based on latest incident, behavior, and wellbeing data
4. **Visual Dashboard**: Interactive UI for exploring risk parameters
5. **API Integration**: RESTful endpoints for integration with other systems
6. **Flexible Configuration**: Ability to adjust weights and thresholds

This comprehensive system provides a holistic view of risk across the hostel environment, enabling proactive intervention and resource allocation.
