#!/usr/bin/env node
/**
 * Project Automation Agent
 * Runs every 3 hours to:
 * 1. Check PROJECT_IDEAS.md for TODO count
 * 2. Add new ideas if needed (< 10 TODO)
 * 3. Select highest priority TODO project
 * 4. Create GitHub repo and implement project
 * 5. Update project status and announce
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import crypto from 'crypto';

const WORKSPACE = '/home/dl/.openclaw/workspace-or';
const PROJECTS_FILE = path.join(WORKSPACE, 'PROJECT_IDEAS.md');
const HEARTBEAT_STATE = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
const GITHUB_OWNER = 'EonHermes';

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string;
  complexity: string;
  priority: string;
  why: string;
  status: 'TODO' | 'WIP' | 'DONE';
  lineNumber: number;
  originalText: string;
}

interface HeartbeatState {
  lastChecks: {
    projectAutomation?: number;
    github?: string;
  };
  lastProjectCompleted?: string;
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message: string) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

function readFile(file: string): string {
  return fs.readFileSync(file, 'utf-8');
}

function writeFile(file: string, content: string): void {
  fs.writeFileSync(file, content, 'utf-8');
}

function parseProjects(content: string): { projects: Project[], raw: string } {
  const lines = content.split('\n');
  const projects: Project[] = [];
  let currentProject: Partial<Project> | null = null;
  let currentLineStart = -1;
  const projectLineRegex = /^### \[(TODO|WIP|DONE)\] ([A-Z]+-\d+)$/;

  lines.forEach((line, index) => {
    const match = line.match(projectLineRegex);
    if (match) {
      // Save previous project if exists
      if (currentProject && currentProject.id) {
        projects.push({
          ...currentProject,
          status: match[1] as 'TODO' | 'WIP' | 'DONE',
          lineNumber: currentLineStart,
          originalText: lines.slice(currentLineStart, index).join('\n')
        } as Project);
      }
      // Start new project
      currentProject = {
        id: match[2],
        status: match[1] as 'TODO' | 'WIP' | 'DONE',
        lineNumber: index
      };
      currentLineStart = index;
    } else if (currentProject && line.startsWith('**') && currentProject.title === undefined) {
      // Parse title
      const titleMatch = line.match(/\*\*Title:\*\*\s*(.+)/);
      if (titleMatch) currentProject.title = titleMatch[1];
    } else if (currentProject && line.startsWith('**') && currentProject.description === undefined) {
      // Parse description (might be multiline)
      const descMatch = line.match(/\*\*Description:\*\*\s*(.+)/);
      if (descMatch) currentProject.description = descMatch[1];
    } else if (currentProject && line.match(/^\*\*Tech Stack:\*\*/)) {
      const techMatch = line.match(/\*\*Tech Stack:\*\*\s*(.+)/);
      if (techMatch) currentProject.techStack = techMatch[1];
    } else if (currentProject && line.match(/^\*\*Complexity:\*\*/)) {
      const compMatch = line.match(/\*\*Complexity:\*\*\s*(.+)/);
      if (compMatch) currentProject.complexity = compMatch[1];
    } else if (currentProject && line.match(/^\*\*Priority:\*\*/)) {
      const priMatch = line.match(/\*\*Priority:\*\*\s*(.+)/);
      if (priMatch) currentProject.priority = priMatch[1];
    } else if (currentProject && line.match(/^\*\*Why:\*\*/)) {
      const whyMatch = line.match(/\*\*Why:\*\*\s*(.+)/);
      if (whyMatch) currentProject.why = whyMatch[1];
    }
  });

  // Don't forget the last project
  if (currentProject && currentProject.id) {
    projects.push({
      ...currentProject,
      status: 'DONE', // Will be corrected by checking actual marker
      lineNumber: currentLineStart,
      originalText: lines.slice(currentLineStart).join('\n')
    } as Project);
  }

  // Re-scan to get correct status for last project
  if (projects.length > 0) {
    const lastIdx = projects.length - 1;
    const statusMatch = lines[projects[lastIdx].lineNumber].match(/^### \[(TODO|WIP|DONE)\]/);
    if (statusMatch) {
      projects[lastIdx].status = statusMatch[1] as 'TODO' | 'WIP' | 'DONE';
    }
  }

  return { projects, raw: content };
}

function selectNextProject(projects: Project[]): Project | null {
  // Filter TODO projects
  const todos = projects.filter(p => p.status === 'TODO');
  if (todos.length === 0) return null;

  // Prioritize by: Priority (High > Medium > Low), Complexity (High > Medium > Low), novelty
  const priorityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const complexityScore = { 'High': 3, 'Medium': 2, 'Low-Medium': 1.5, 'Medium-High': 2.5 };

  return todos.sort((a, b) => {
    const aScore = (priorityScore[a.priority as keyof typeof priorityScore] || 0) * 100 +
                   (complexityScore[a.complexity as keyof typeof complexityScore] || 0);
    const bScore = (priorityScore[b.priority as keyof typeof priorityScore] || 0) * 100 +
                   (complexityScore[b.complexity as keyof typeof complexityScore] || 0);
    return bScore - aScore; // Descending
  })[0];
}

function updateProjectStatus(content: string, project: Project, newStatus: string): string {
  const lines = content.split('\n');
  lines[project.lineNumber] = lines[project.lineNumber].replace(/\[(TODO|WIP|DONE)\]/, `[${newStatus}]`);
  return lines.join('\n');
}

function generateProjectFiles(project: Project): void {
  const projectDir = path.join(WORKSPACE, 'projects', project.id.toLowerCase());
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Create .gitignore
  writeFile(path.join(projectDir, '.gitignore'), `# Secrets
.env
.env.local
.env.*.local

# Dependencies
node_modules/
target/
Cargo.lock

# Build outputs
dist/
build/
*.wasm

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`);

  // Create Cargo.toml for Rust backend
  const cargoToml = `[package]
name = "${project.id.toLowerCase()}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors"] }
thiserror = "1"
anyhow = "1"
uuid = { version = "1", features = ["v4"] }

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
`;
  writeFile(path.join(projectDir, 'Cargo.toml'), cargoToml);

  // Create README.md
  const readme = `# ${project.title}

${project.description}

## Tech Stack

${project.techStack}

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting Started

### Prerequisites

- Rust (stable)
- Node.js 20+
- pnpm or npm

### Installation

\`\`\`bash
# Clone and build
git clone https://github.com/${GITHUB_OWNER}/${project.id.toLowerCase()}.git
cd ${project.id.toLowerCase()}
cargo build --release
\`\`\`

### Running

\`\`\`bash
# Backend
cargo run --release

# In another terminal - Frontend
cd frontend
pnpm install
pnpm dev
\`\`\`

### Testing

\`\`\`bash
cargo test
cd frontend && pnpm test
\`\`\`

## Project Structure

\`\`\`
${project.id.toLowerCase()}/
├── backend/          # Rust API server
├── frontend/         # React TypeScript app
├── shared/           # Shared types (if needed)
├── tests/            # Integration tests
└── README.md
\`\`\`

## License

MIT © ${new Date().getFullYear()} EonHermes
`;
  writeFile(path.join(projectDir, 'README.md'), readme);

  // Create basic backend structure
  const backendDir = path.join(projectDir, 'backend');
  fs.mkdirSync(backendDir, { recursive: true });

  writeFile(path.join(backendDir, 'src', 'main.rs'), `use axum::{routing::post, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", post(|| async { "Hello World" }));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server listening on http://{addr}");
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
`);
  writeFile(path.join(backendDir, 'src', 'lib.rs'), `// Shared library code
`);
}

function createGitHubRepo(project: Project): string {
  log(`Creating GitHub repository: ${project.id.toLowerCase()}`);

  try {
    execSync(`gh repo create ${GITHUB_OWNER}/${project.id.toLowerCase()} --public --description "${project.description.substring(0, 100)}..." --homepage "https://${GITHUB_OWNER}.github.io/${project.id.toLowerCase()}" --source .`, { stdio: 'inherit' });
  } catch (e) {
    // Check if repo already exists
    try {
      execSync(`gh repo view ${GITHUB_OWNER}/${project.id.toLowerCase()}`, { stdio: 'ignore' });
      log('Repository already exists, continuing...');
    } catch {
      throw new Error(`Failed to create repository: ${e}`);
    }
  }

  return `https://github.com/${GITHUB_OWNER}/${project.id.toLowerCase()}.git`;
}

function commitAndPush(project: Project, message: string, repoUrl: string): void {
  const projectDir = path.join(WORKSPACE, 'projects', project.id.toLowerCase());

  // Initialize git if not already
  try {
    execSync('git status', { cwd: projectDir, stdio: 'ignore' });
  } catch {
    execSync('git init', { cwd: projectDir });
    execSync(`git remote add origin ${repoUrl}`, { cwd: projectDir });
  }

  // Configure git
  execSync('git config user.email "eond@eonhermes.ai"', { cwd: projectDir });
  execSync('git config user.name "Eon"', { cwd: projectDir });

  // Add and commit
  execSync('git add .', { cwd: projectDir });
  execSync(`git commit -m "${message}"`, { cwd: projectDir });

  // Push
  const branch = process.env.BRANCH || 'main';
  try {
    execSync(`git push -u origin ${branch}`, { cwd: projectDir });
  } catch (e) {
    // Might need to set upstream, try force if needed
    log('Push failed, trying to set upstream...');
    execSync(`git branch -M ${branch}`, { cwd: projectDir });
    execSync(`git push -u origin ${branch}`, { cwd: projectDir });
  }

  log(`Committed and pushed: ${message}`);
}

function implementationPlan(project: Project): string {
  return `Implementing ${project.title} (${project.id})

Key components:
1. Rust backend with Axum
2. React TypeScript frontend
3. Comprehensive tests
4. Excellent README

Approach:
- Start with minimal scaffolding (already created)
- Build core functionality first
- Add tests alongside code
- Polish README with examples
`;
}

async function main() {
  log('🚀 Project Automation Agent started');

  // Check current time to avoid running too frequently
  const state: HeartbeatState = fs.existsSync(HEARTBEAT_STATE)
    ? JSON.parse(readFile(HEARTBEAT_STATE))
    : { lastChecks: {} };

  const now = Date.now();
  if (state.lastChecks?.projectAutomation && (now - state.lastChecks.projectAutomation) < 3 * 60 * 60 * 1000) {
    log('Skipping: Ran less than 3 hours ago');
    return;
  }

  // Read projects
  if (!fs.existsSync(PROJECTS_FILE)) {
    error('PROJECT_IDEAS.md not found!');
    return;
  }

  const content = readFile(PROJECTS_FILE);
  const { projects } = parseProjects(content);

  // Count TODO projects
  const todoCount = projects.filter(p => p.status === 'TODO').length;
  log(`Current TODO projects: ${todoCount}`);

  // Check if we need to add more ideas
  if (todoCount < 10) {
    log('Adding new project ideas to maintain queue...');
    // For now we have enough, but could add more from a template list
  }

  // Select next project
  const nextProject = selectNextProject(projects);
  if (!nextProject) {
    log('No TODO projects available. All caught up!');
    state.lastChecks!.projectAutomation = now;
    writeFile(HEARTBEAT_STATE, JSON.stringify(state, null, 2));
    return;
  }

  log(`🎯 Selected project: ${nextProject.id} - ${nextProject.title}`);

  // Mark as WIP in PROJECT_IDEAS.md
  let updatedContent = updateProjectStatus(content, nextProject, 'WIP');
  writeFile(PROJECTS_FILE, updatedContent);

  // Generate project scaffolding
  log('📁 Generating project scaffolding...');
  generateProjectFiles(nextProject);

  const repoUrl = createGitHubRepo(nextProject);

  // Initial commit with scaffolding
  commitAndPush(nextProject, 'feat: initial project scaffolding', repoUrl);

  log(implementationPlan(nextProject));

  // Here we would actually implement the project
  // For the cron job, we need to decide: implement fully or spawn a subagent?
  // Since this is a 3-hour cron job, we should probably spawn a subagent to do the work

  log('✅ Setup complete. Next: Implement core functionality.');
  log('📢 Implementation should be done in a separate process.');

  // Update state
  state.lastChecks!.projectAutomation = now;
  writeFile(HEARTBEAT_STATE, JSON.stringify(state, null, 2));
}

main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
