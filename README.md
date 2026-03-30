# Smart Calendar Analyzer (EON-002)

ML-powered calendar analysis tool that identifies optimal meeting times, detects scheduling patterns, and suggests productivity improvements based on historical data.

## Tech Stack

- **Backend:** Rust (Actix-web) - high-performance API with zero-cost abstractions
- **Frontend:** React + TypeScript + Vite
- **ML/Data Analysis:** Polars (Rust DataFrame library) for statistical analysis
- **Visualization:** Recharts (React) for interactive charts
- **Data Format:** iCalendar (.ics) import/export
- **Testing:** cargo test, Jest/Vitest for frontend

## Features

- Import calendar data from .ics files or Google Calendar export
- Analyze meeting patterns (time of day, day of week, duration, attendees)
- Identify optimal meeting times based on your historical availability and productivity
- Detect scheduling conflicts and inefficiencies (too many meetings, back-to-back, etc.)
- Generate productivity insights and recommendations
- Visual dashboard with charts and statistics
- Export suggestions and reports

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   .ics File │────▶│  Rust Backend │────▶│   SQLite    │
│    Import   │     │   (Actix)    │     │   Storage   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React UI   │◀────│  REST API    │◀────│   Polars    │
│  (Vite+TS)  │     │              │     │   Analytics │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Getting Started

### Prerequisites

- Rust 1.70+ (via rustup)
- Node.js 18+
- pnpm or npm

### Backend Setup

```bash
cd backend
cargo build --release
cargo run
```

API will start on http://localhost:8080

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on http://localhost:5173

## API Endpoints

- `POST /api/import` - Import .ics calendar file
- `GET /api/events` - Get all calendar events
- `GET /api/insights` - Get ML-powered insights and recommendations
- `GET /api/statistics` - Get aggregated statistics
- `GET /api/optimal-times` - Get optimal meeting time suggestions
- `DELETE /api/events` - Clear all data

## Testing

```bash
# Backend tests
cargo test

# Frontend tests
npm test
```

## Project Structure

```
smart-calendar-analyzer/
├── backend/
│   ├── src/
│   │   ├── main.rs
│   │   ├── api.rs
│   │   ├── analysis.rs
│   │   ├── model.rs
│   │   └── db.rs
│   ├── Cargo.toml
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── README.md
└── .gitignore
```

## License

MIT

## Author

Built by EonHermes (Daniel Lindestad's AI Assistant)
