# Motion script

All values live in `src/lib/motion.ts`. Components import from there. No component invents its own timing.

| Token | Value | Use |
|---|---|---|
| `ease.out` | cubic-bezier(.22, 1, .36, 1) | Anything entering the screen |
| `ease.inOut` | cubic-bezier(.65, 0, .35, 1) | Anything leaving |
| `duration.quick` | 0.18 s | Exits, hover colour changes |
| `duration.base` | 0.45 s | Reveals, fades |
| `duration.slow` | 0.9 s | Hero and ring draw |
| `spring.snappy` | stiffness 420, damping 32 | Controls that follow input: chips, magnetic button |
| `spring.smooth` | stiffness 220, damping 30 | Cards, panels, layout changes |
| `stagger` | 0.07 s | Gap between siblings entering |

## Patterns
1. **Reveal on scroll**: `Reveal` and `Stagger/Item`. Fade up 18 px, once, when 12 percent inside the viewport.
2. **Shared-layout pill**: `Chips`. The selected background slides between options.
3. **Magnetic button**: `Button` leans toward a mouse pointer by at most about 12 percent. Touch is ignored.
4. **Scroll-linked**: `Horizon` drifts and dims with scroll. `Steps` draws its line with scroll progress.
5. **Count and draw**: `MatchRing` counts to the score and draws the ring once visible.
6. **List changes**: `AnimatePresence` with `layout` so rows slide when the set of reasons changes.
7. **Card hover**: lift 4 px with `spring.smooth`, cover image scales 4 percent over 700 ms.

## Rules
- Animate `transform` and `opacity` only. Never width, height, top or left.
- One idea per screen. If two things move at once, one of them is the content and the other is still.
- `MotionRoot` wraps the app: `LazyMotion` with `domAnimation` (small bundle) and
  `MotionConfig reducedMotion="user"`, which turns movement into plain fades for visitors who ask.
- Import the `m` component, never `motion`, so `LazyMotion strict` keeps the bundle small.
- Nothing loops forever. Nothing blocks input.
