#!/usr/bin/env bash
# Project Automation Cron Entry Point
# This script is called by the cron job every 3 hours

set -e

cd /home/dl/.openclaw/workspace-or

# Check if we should run (avoid duplicate runs)
STATE_FILE="memory/heartbeat-state.json"
if [ -f "$STATE_FILE" ]; then
  LAST_RUN=$(jq -r '.lastChecks.projectAutomation // 0' "$STATE_FILE" 2>/dev/null || echo "0")
  NOW=$(date +%s)
  THREE_HOURS=$((3 * 60 * 60))
  
  if [ "$LAST_RUN" != "0" ] && [ $((NOW - LAST_RUN)) -lt $THREE_HOURS ]; then
    echo "Skipping: Already ran within 3 hours"
    exit 0
  fi
fi

# Check if there's already a WIP project
if grep -q "\[WIP\]" PROJECT_IDEAS.md 2>/dev/null; then
  echo "Already have a WIP project, skipping..."
  exit 0
fi

# Get next TODO project (simple: first TODO entry)
NEXT_PROJECT=$(grep -m1 "\[TODO\]" PROJECT_IDEAS.md | head -1)
if [ -z "$NEXT_PROJECT" ]; then
  echo "No TODO projects available"
  exit 0
fi

# Extract project ID (e.g., EON-002)
PROJECT_ID=$(echo "$NEXT_PROJECT" | grep -oE '[A-Z]+-[0-9]+')

# Get project details from PROJECT_IDEAS.md
# We'll extract the full project block
# For simplicity, we'll pass the ID and let the agent read the file

echo "Selected project: $PROJECT_ID"
echo "Spawning implementation agent..."

# Use OpenClaw to spawn an isolated agent that runs the implementation
# This should be called from within an OpenClaw session context
# But since cron runs separately, we need to trigger it differently

# Option 1: Use openclaw gateway API directly via HTTP to spawn a session
# Option 2: Use openclaw CLI with session target
# For now, we'll just run the implementation-agent.js directly

node scripts/implementation-agent.js \
  --project-id "$PROJECT_ID" \
  --workspace "/home/dl/.openclaw/workspace-or" \
  --report-to "main"

# Update state
NOW=$(date +%s)
if [ -f "$STATE_FILE" ]; then
  jq ".lastChecks.projectAutomation = $NOW" "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
else
  echo "{\"lastChecks\": {\"projectAutomation\": $NOW}}" > "$STATE_FILE"
fi

echo "Cron job completed at $(date)"
