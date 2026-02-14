# Contributing to ClawDash

Thank you for your interest in contributing! 🎉

## Ways to Contribute

- 🐛 **Bug Reports**: Found a bug? Open an issue
- 💡 **Feature Requests**: Have an idea? Share it
- 📝 **Documentation**: Improve docs or translations
- 🔧 **Pull Requests**: Fix bugs, add features
- 🧪 **Testing**: Test new features and report issues

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenClaw installed locally (for testing)

### Development Setup

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/clawdash.git
cd clawdash

# 3. Install dependencies
npm install

# 4. Create a feature branch
git checkout -b feature/amazing-feature

# 5. Make changes and test
npm run dev

# 6. Commit your changes
git commit -m "Add amazing feature"

# 7. Push to your fork
git push origin feature/amazing-feature

# 8. Open a Pull Request
```

### Coding Standards

- **TypeScript**: All code must be type-safe
- **Formatting**: Prettier handles formatting automatically
- **Linting**: ESLint checks code quality
- **Commits**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`)

## Project Structure

```
clawdash/
├── src/
│   ├── app/          # Next.js pages and API
│   ├── components/   # React components
│   └── lib/          # Utilities and hooks
├── public/           # Static assets
└── tests/            # Test files
```

## Adding New Features

### New API Endpoint

```typescript
// src/app/api/dashboard/example/route.ts
export async function GET() {
  return NextResponse.json({ data: "example" });
}
```

### New Page

```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return <div>Example Page</div>;
}
```

### New Component

```typescript
// src/components/dashboard/Example.tsx
export function Example() {
  return <div>Example Component</div>;
}
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Translation (i18n)

To add a new language:

1. Add translations to `src/lib/i18n.ts`
2. Register locale in `src/lib/i18n-context.tsx`
3. Update `LanguageSwitcher` component

## Code Review Process

1. All PRs require at least one maintainer approval
2. CI/CD checks must pass
3. Tests must not break

## Questions?

- 📧 Email: support@openclaw.ai
- 💬 Discord: https://discord.gg/clawd
- 📖 Docs: https://docs.openclaw.ai

---

By contributing, you agree to follow our Code of Conduct.
