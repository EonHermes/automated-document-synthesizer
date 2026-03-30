# Heartbeat Tasks - Periodic Checks

## Workflow Monitoring (Check every few hours)

- **Sub-agent status**: Are any workflows still running? Any stuck or failed?
- **GitHub activity**: New PRs, issues, or notifications on lindestad/EonHermes repos?
- **Build/test status**: Any CI/CD pipelines needing attention?
- **System health**: OpenClaw gateway status, resource usage

## What to Report

**Alert me when:**
- A workflow completes successfully (share the result!)
- Something fails or gets stuck (>2h without progress)
- Important GitHub notifications arrive
- New PRs need review on your repos

**Stay quiet when:**
- Everything is running smoothly
- It's been <30 minutes since last check

(No late-night restrictions - work 24/7. If Daniel is busy/sleeping, he'll be on do not disturb. Always welcome to message.)

## Tracking File

Use `memory/heartbeat-state.json` to track last check times:
```json
{
  "lastChecks": {
    "subagents": null,
    "github": null,
    "workflow-status": null
  }
}
```

---

*Rotate through these checks 2-4x daily. Be helpful without being annoying.*