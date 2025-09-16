# WARP.md

📋 **Dokumentasi utama untuk AI agents sekarang ada di `AGENTS.md`.**

Silakan baca `AGENTS.md` untuk informasi lengkap tentang:
- Setup commands & environment
- Code style & architecture
- Development workflow & testing
- Known issues & performance considerations
- Component integration guidelines

## Warp-Specific Tips

### Command Guidelines
- **ALWAYS use non-interactive commands** - Hindari commands yang butuh interaction atau pagination
- **Git commands**: Selalu pakai `git --no-pager` untuk avoid pagination issues
  ```bash
  # ✅ Good
  git --no-pager log --oneline -10
  git --no-pager diff HEAD~1
  git --no-pager status
  
  # ❌ Avoid (will cause pagination)
  git log
  git diff
  ```

### Path Handling
- **Prefer absolute or relative paths** instead of `cd` commands
- **Use current directory context** when working with files
  ```bash
  # ✅ Good
  bun run dev
  bun test app/component/form/
  
  # ❌ Avoid unless necessary
  cd app/component && bun test
  ```

### Development Workflow
- **Non-interactive mode**: Semua commands harus bisa run tanpa user input
- **Error handling**: Always check command output untuk potential issues
- **File operations**: Prefer using tools yang tidak require TTY

### Testing Commands
```bash
# Run linting (non-interactive)
bun run lint

# Build project (check for errors)
bun run build

# Check project structure
ls -la app/component/

# Verify environment setup
cat .env.example
```

---

**Untuk detail lengkap tentang project architecture, development patterns, dan troubleshooting, lihat `AGENTS.md`.**
