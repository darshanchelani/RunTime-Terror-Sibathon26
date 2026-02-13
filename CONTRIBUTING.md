# 🤝 Contributing to BattleBrains

## Git Workflow

### Branches
- `main` — Stable, deployable code only
- `feature/backend` — Member 1's backend work
- `feature/frontend` — Member 2's frontend work
- `fix/*` — Bug fixes
- `polish/*` — Visual/UX improvements

### Commit Convention
Use conventional commits:
```
feat(server): add GameRoom with tug-of-war state management
feat(client): add RocketRushScene with exhaust particles
fix(server): handle player disconnect during active game
polish(client): add camera shake on boulder impact
docs: update README with deployment instructions
```

### Pull Request Process
1. Push your feature branch
2. Create a PR to `main`
3. Other member reviews (quick check)
4. Merge and delete the branch
5. Both pull latest `main` before starting next feature

### Folder Ownership
- **Member 1** owns `server/` — don't edit without discussing
- **Member 2** owns `client/` — don't edit without discussing
- Root files (`README.md`, `package.json`) — edit together

### Code Style
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Descriptive variable names
- Comment complex logic

### Testing Locally
```bash
# Run everything
npm run dev

# Run just server
npm run server

# Run just client  
npm run client
```

### Before Pushing
- [ ] No console errors
- [ ] Game plays through at least 1 round without crashes
- [ ] Both keyboard and touch input work
- [ ] Server doesn't crash on disconnect

## Quick Setup for New Clone
```bash
git clone <repo-url>
cd RunTime-Terror-Sibathon26
npm run install-all
npm run dev
```
