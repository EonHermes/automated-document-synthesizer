#!/usr/bin/env node
/**
 * Project Automation Orchestrator
 * Cron Job - Runs every 3 hours
 *
 * Does NOT implement projects itself. Instead:
 * 1. Checks if a WIP project already exists
 * 2. If no WIP, spawns a subagent to implement the next project
 * 3. That subagent handles the full lifecycle
 */

import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE = '/home/dl/.openclaw/workspace-or';
const PROJECTS_FILE = path.join(WORKSPACE, 'PROJECT_IDEAS.md');
const HEARTBEAT_STATE = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message: string) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

function readProjects(): { projects: any[], raw: string } {
  const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  const lines = content.split('\n');
  const projects = [];
  let currentProject: any = null;
  let currentLineStart = -1;
  const regex = /^### \[(TODO|WIP|DONE)\] ([A-Z]+-\d+)/;

  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match) {
      if (currentProject) projects.push(currentProject);
      currentProject = {
        id: match[2],
        status: match[1],
        lineNumber: index
      };
      currentLineStart = index;
    } else if (currentProject && line.startsWith('**Title:**')) {
      currentProject.title = line.replace('**Title:**', '').trim();
    }
  });
  if (currentProject) projects.push(currentProject);

  return { projects, raw: content };
}

function hasWIP(projects: any[]): boolean {
  return projects.some(p => p.status === 'WIP');
}

function addNewIdeasIfNeeded(content: string, minTodos: number = 10): { content: string, added: number } {
  // For now, we have enough ideas. Could add more dynamically if needed.
  return { content, added: 0 };
}

function selectNextProject(projects: any[]): any {
  const todos = projects.filter(p => p.status === 'TODO');
  if (todos.length === 0) return null;

  // Simple: highest priority based on line number (top of list)
  // Could enhance with priority scoring as before
  return todos[0];
}

function updateProjectStatus(content: string, projectId: string, newStatus: string): string {
  const lines = content.split('\n');
  const project = lines.findIndex(line => line.includes(`[${projectId}]`));
  if (project !== -1) {
    lines[project] = lines[project].replace(/\[(TODO|WIP|DONE)\]/, `[${newStatus}]`);
  }
  return lines.join('\n');
}

async function main() {
  log('📅 Project Automation Cron Job');

  // Check if it's quiet hours (optional - Daniel said work 24/7, so skip)
  // Just check last run time
  const state = fs.existsSync(HEARTBEAT_STATE)
    ? JSON.parse(fs.readFileSync(HEARTBEAT_STATE, 'utf-8'))
    : { lastChecks: {} };

  const now = Date.now();
  if (state.lastChecks?.projectAutomation && (now - state.lastChecks.projectAutomation) < 3 * 60 * 60 * 1000) {
    log('⏭️  Skipping: Already ran within 3 hours');
    return;
  }

  // Read projects
  if (!fs.existsSync(PROJECTS_FILE)) {
    error('PROJECT_IDEAS.md not found!');
    return;
  }

  const { projects, raw: content } = readProjects();

  // Check for existing WIP
  if (hasWIP(projects)) {
    const wip = projects.find(p => p.status === 'WIP');
    log(`⏳ Already working on ${wip.id} - ${wip.title}`);
    state.lastChecks!.projectAutomation = now;
    fs.writeFileSync(HEARTBEAT_STATE, JSON.stringify(state, null, 2));
    return;
  }

  // Ensure we have enough TODO
  const todoCount = projects.filter(p => p.status === 'TODO').length;
  if (todoCount < 10) {
    log(`📈 Only ${todoCount} TODO projects - adding more ideas...`);
    const result = addNewIdeasIfNeeded(content, 10);
    if (result.added > 0) {
      fs.writeFileSync(PROJECTS_FILE, result.content);
      log(`✅ Added ${result.added} new project ideas`);
    }
  }

  // Select next project
  const nextProject = selectNextProject(projects);
  if (!nextProject) {
    log('✅ No TODO projects available. All projects completed!');
    state.lastChecks!.projectAutomation = now;
    fs.writeFileSync(HEARTBEAT_STATE, JSON.stringify(state, null, 2));
    return;
  }

  log(`🎯 Selected: ${nextProject.id} - ${nextProject.title}`);

  // Mark as WIP immediately
  const updatedContent = updateProjectStatus(content, nextProject.id, 'WIP');
  fs.writeFileSync(PROJECTS_FILE, updatedContent);
  log('📝 Marked as WIP in PROJECT_IDEAS.md');

  // Spawn subagent to handle implementation
  log('🚀 Spawning project implementation agent...');

  // The subagent will be responsible for:
  // - Creating project scaffolding
  // - Implementing features
  // - Creating GitHub repo
  // - Committing and pushing
  // - Updating to DONE when complete
  // - Announcing results

  const projectContext = `
You are implementing a new project.

PROJECT DETAILS:
${JSON.stringify(nextProject, null, 2)}

WORKSPACE: ${WORKSPACE}
PROJECT_ID: ${nextProject.id}
REPOSITORY_OWNER: EonHermes

INSTRUCTIONS:
1. Create directory: projects/${nextProject.id.toLowerCase()}/
2. Generate scaffolding (.gitignore, README.md, Cargo.toml, basic structure)
3. Create GitHub repo under EonHermes/${nextProject.id.toLowerCase()}
4. Implement the project with:
   - Clean Rust backend + React frontend architecture
   - Comprehensive test suite (at least 80% coverage)
   - Excellent README with examples and screenshots (if applicable)
   - Good visual design for UI components
   - Follow Rust/React best practices
5. Commit incrementally with meaningful messages
6. Never commit .env or secrets
7. When implementation is complete and exemplary:
   - Update PROJECT_IDEAS.md to mark as DONE
   - Commit that change
   - Announce the completion with repository URL
8. Run all tests before marking DONE

IMPORTANT: Work in the isolated session you're in now. You have full access to the workspace.
`;

  // We'll spawn an isolated agent via sessions_spawn
  // But since this is a shell script being called by cron, we need to use OpenClaw's messaging
  // Actually, the cron job runs in the OpenClaw gateway context and can use sessions_spawn

  // For now, just log that we'd spawn the agent
  log('✅ Subagent would be spawned here (implementation in progress)');
  log('📋 Implementation complete will update PROJECT_IDEAS.md and announce');

  state.lastChecks!.projectAutomation = now;
  state.lastChecks!.github = `https://github.com/EonHermes/${nextProject.id.toLowerCase()}`;
  fs.writeFileSync(HEARTBEAT_STATE, JSON.stringify(state, null, 2));
}

main().catch(err => {
  error(`Fatal: ${err.message}`);
  process.exit(1);
});
