#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(process.env.HOME || '/home/dl', '.openclaw', 'agents');
const SESSION_EXT = '.jsonl';

const overall = {
  totalInput: 0,
  totalOutput: 0,
  totalTokens: 0,
  totalCost: 0,
  totalSessions: 0,
  models: {}
};

function readSessionLog(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch (e) { return null; }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

function extractTokens(msg) {
  let model = null;
  let input = 0;
  let output = 0;
  let cost = 0;

  if (msg.api) model = msg.api;
  if (msg.provider && msg.model) model = msg.provider + '/' + msg.model;
  if (msg.__openclaw && msg.__openclaw.model) model = msg.__openclaw.model;

  if (msg.usage) {
    input = msg.usage.promptTokens || msg.usage.inputTokens || 0;
    output = msg.usage.completionTokens || msg.usage.outputTokens || 0;
    cost = msg.usage.cost || 0;
  }
  if (msg.response && msg.response.usage) {
    input += msg.response.usage.promptTokens || msg.response.usage.inputTokens || 0;
    output += msg.response.usage.completionTokens || msg.response.usage.outputTokens || 0;
    cost += msg.response.usage.cost || 0;
  }

  return { model, input, output, cost };
}

function aggregate(model, input, output, cost) {
  if (!model) return;
  if (!overall.models[model]) {
    overall.models[model] = { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 };
  }
  overall.models[model].inputTokens += input;
  overall.models[model].outputTokens += output;
  overall.models[model].totalTokens += input + output;
  overall.models[model].cost += cost;
}

function scanAgent(agentDir) {
  const sessionsDir = path.join(agentDir, 'sessions');
  if (!fs.existsSync(sessionsDir)) return;

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith(SESSION_EXT));
  console.log('Scanning agent ' + path.basename(agentDir) + ': ' + files.length + ' session files');

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    const messages = readSessionLog(filePath);
    overall.totalSessions++;

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      const { model, input, output, cost } = extractTokens(msg);
      if (model) {
        overall.totalInput += input;
        overall.totalOutput += output;
        overall.totalCost += cost;
        overall.totalTokens += input + output;
        aggregate(model, input, output, cost);
      }
    }
  }
}

function pad(str, len, align) {
  const s = String(str);
  if (align === 'left') return s.padEnd(len, ' ');
  if (align === 'right') return s.padStart(len, ' ');
  return s;
}

function printReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 OPENCLAW TOKEN USAGE REPORT');
  console.log('='.repeat(70));
  console.log('\nTotals:');
  console.log('  Sessions Analyzed: ' + overall.totalSessions.toLocaleString());
  console.log('  Input Tokens:      ' + overall.totalInput.toLocaleString());
  console.log('  Output Tokens:     ' + overall.totalOutput.toLocaleString());
  console.log('  Total Tokens:      ' + overall.totalTokens.toLocaleString());
  console.log('  Estimated Cost:    $' + overall.totalCost.toFixed(6));

  console.log('\nBreakdown by Model:\n');
  console.log(pad('Model', 40, 'left') + pad('Input', 12, 'right') + pad('Output', 12, 'right') + pad('Total', 12, 'right') + pad('Cost', 12, 'right'));
  console.log('-'.repeat(90));

  const modelEntries = Object.entries(overall.models)
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens);

  for (const [model, stats] of modelEntries) {
    const displayModel = model.length > 38 ? model.substring(0, 35) + '...' : model;
    console.log(
      pad(displayModel, 40, 'left') +
      pad(stats.inputTokens.toLocaleString(), 12, 'right') + ' ' +
      pad(stats.outputTokens.toLocaleString(), 12, 'right') + ' ' +
      pad(stats.totalTokens.toLocaleString(), 12, 'right') + ' ' +
      pad('$' + stats.cost.toFixed(6), 12, 'right')
    );
  }

  console.log('='.repeat(70));
  console.log('\nNote: Aggregates assistant message tokens from ~/.openclaw/agents/*/sessions/*.jsonl\n');
}

function main() {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.error('OpenClaw agents directory not found:', AGENTS_DIR);
    process.exit(1);
  }

  const agentDirs = fs.readdirSync(AGENTS_DIR).filter(f => fs.statSync(path.join(AGENTS_DIR, f)).isDirectory());
  console.log('Found ' + agentDirs.length + ' agent(s)\n');

  for (const agent of agentDirs) {
    scanAgent(path.join(AGENTS_DIR, agent));
  }

  if (overall.totalSessions === 0) {
    console.log('No session data found.');
    return;
  }

  printReport();
}

main();
