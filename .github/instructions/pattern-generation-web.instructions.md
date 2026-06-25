---
description: "Use when building or modifying React UI, pattern generation logic, or print/export behavior in this Vite + React + shadcn + Tailwind app for structured imaging backgrounds."
name: "Pattern Generation Web Rules"
applyTo:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.css"
---
# Pattern Generation Web Rules

- Keep the frontend stack consistent: React + TypeScript, shadcn/ui primitives, and Tailwind utilities.
- Reuse existing UI primitives from `src/components/ui` before creating new base controls.
- Prefer utility classes and theme tokens from `src/index.css`; avoid hardcoded colors and ad-hoc design tokens.
- Keep pattern generation deterministic: same inputs should produce the same output.
- Keep all supported pattern implementations under `src/lib/patterns`.
- Use one shared pattern interface (types + render contract) for every pattern so new patterns can be added without changing UI integration.
- Separate concerns clearly: UI components handle interaction/rendering, pattern math and geometry live in pure modules, and print/export helpers handle dimensions and scaling.
- Keep physical units explicit when printing/exporting (for example: mm, inches, DPI), and perform conversions in one place.
- Keep print targets configurable unless a task explicitly asks for a fixed format.
- Preserve print fidelity by preventing aspect-ratio distortion, avoiding implicit resizing that changes intended scale, and validating output dimensions before export or print.
- Prefer high-contrast, imaging-safe defaults for generated backgrounds.
- For new code, keep functions small, typed, and easy to test.
- Avoid introducing heavyweight visualization/rendering libraries unless there is a clear requirement and team approval.
- Treat these as strong project guidance; exceptions are allowed when the implementation notes why the deviation is needed.
