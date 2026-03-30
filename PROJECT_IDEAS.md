# Project Ideas - Automated Development Queue

*This file is managed by an automated cron job that runs every 3 hours.*

## Format
- `[TODO]` - Not started, ready to pick up
- `[WIP]` - Currently being worked on (should only have one at a time)
- `[DONE]` - Completed and deployed

Each project has: ID, Title, Description, Tech Stack, Complexity, Priority

---

## Active Projects

### [WIP] EON-001
**Title:** Real-time Audio Feature Extractor
**Description:** A Rust/WebAssembly tool that analyzes audio files in real-time, extracting BPM, key, spectral features, and generating musical insights. Built with a React frontend for visualization.
**Tech Stack:** Rust (WASM), Web Audio API, React + TypeScript, D3.js
**Complexity:** High
**Priority:** High
**Why:** Combines ML with audio processing, practical for musicians, showcases WASM performance

---

## Todo Queue

### [TODO] EON-002
**Title:** Smart Calendar Analyzer
**Description:** ML-powered calendar analysis tool that identifies optimal meeting times, detects scheduling patterns, and suggests productivity improvements based on historical data.
**Tech Stack:** Rust (backend API), React frontend, Python ML scikit-learn integration
**Complexity:** Medium-High
**Priority:** High
**Why:** Practical utility, time-series ML, clean data visualization

### [TODO] EON-003
**Title:** Automated Document Synthesizer
**Description:** Tool that generates comprehensive documentation from code repositories by analyzing structure, dependencies, and comments. Creates API docs, architecture diagrams, and changelogs automatically.
**Tech Stack:** Rust parser, Graphviz, React documentation viewer, OpenAPI generation
**Complexity:** Medium
**Priority:** Medium
**Why:** Useful for maintaining large projects, AST analysis challenge

### [TODO] EON-004
**Title:** Neural Music Style Transfer
**Description:** A web app that applies style transfer to music - transform a classical piece into jazz, rock, or electronic while preserving melody and structure using lightweight neural networks.
**Tech Stack:** Rust (audio DSP), ONNX runtime, React waveforms, WebAudio
**Complexity:** High
**Priority:** High
**Why:** Cutting-edge audio ML, fun creative application

### [TODO] EON-005
**Title:** Personal Analytics Dashboard
**Description:** Self-hosted dashboard that aggregates personal data (calendar, git commits, screen time, music listening) into meaningful insights and correlations about productivity and habits.
**Tech Stack:** Rust backend, SQLite, React dashboard, custom data adapters
**Complexity:** Medium
**Priority:** Medium
**Why:** Meta - analyzes own usage, privacy-focused, personal productivity

### [TODO] EON-007
**Title:** Dynamic Playlist Generator
**Description:** Intelligent music playlist generator that creates playlists based on mood, activity, musical features, and listening history. Supports Spotify/Last.fm integration with local file support.
**Tech Stack:** Rust backend, React frontend, music feature analysis, recommendation algorithms
**Complexity:** Medium
**Priority:** Medium
**Why:** Music-focused, recommendation systems, API integrations

### [TODO] EON-008
**Title:** Build System Visualizer
**Description:** Tool that parses Cargo.toml, package.json, or other build files to visualize dependency graphs, detect circular dependencies, and optimize build order with interactive graph display.
**Tech Stack:** Rust (parsing), React + D3/cytoscape, WASM for fast graph algorithms
**Complexity:** Low-Medium
**Priority:** Low
**Why:** Useful for large projects, graph theory visualization, build optimization

### [TODO] EON-009
**Title:** Automated Tutorial Generator
**Description:** Tool that generates step-by-step tutorials from code repositories by analyzing commit history, README, and code structure. Creates narrative walkthroughs with code snippets and explanations.
**Tech Stack:** Rust (git analysis), Markdown generation, React tutorial viewer
**Complexity:** Medium
**Priority:** Medium
**Why:** Documentation automation, git history mining, educational

### [TODO] EON-010
**Title:** Privacy-First Analytics
**Description:** Self-hosted Google Analytics alternative that respects privacy, uses aggregation to avoid individual tracking, and provides meaningful website insights without cookies or fingerprinting.
**Tech Stack:** Rust (high-performance stats), SQLite, React admin dashboard, simple JS tracking snippet
**Complexity:** Medium
**Priority:** Medium
**Why:** Privacy-focused, real-world need, Rust performance benefits

### [TODO] EON-011
**Title:** Network Latency Monitor
**Description:** Global network monitoring tool that measures latency to multiple endpoints, visualizes trends, detects outages, and provides SLA reports for personal infrastructure.
**Tech Stack:** Rust (ping/ICMP), Tauri or React frontend, time-series database optional
**Complexity:** Low-Medium
**Priority:** Low
**Why:** Infrastructure monitoring, practical for self-hosted services

### [TODO] EON-012
**Title:** Creative Coding Playground
**Description:** Browser-based creative coding environment with shader editor, audio reactivity, and export capabilities. Similar to shadertoy but with more control and local-first approach.
**Tech Stack:** Rust (WASM compute), WebGL/WebGPU, React UI, GLSL shaders
**Complexity:** High
**Priority:** Medium
**Why:** Creative tech, graphics programming, community contribution potential

---

## Archive (Completed)

### [DONE] EON-006
**Title:** Code Review Assistant
**Description:** AI-powered code review tool that runs locally, analyzing pull requests for common issues, security vulnerabilities, style violations, and suggesting improvements with explanations.
**Tech Stack:** Node.js (Express), JavaScript static analysis, React UI
**Complexity:** Medium-High
**Priority:** High
**Why:** Developer tool, practical security focus, incremental scanning
**Repository:** https://github.com/EonHermes/code-review-assistant
**Completed:** 2026-03-30

---

## Statistics
- Total Projects: 12
- TODO: 11
- WIP: 1
- DONE: 1
- Last Updated: 2026-03-30

*Auto-maintained by project automation cron job.*