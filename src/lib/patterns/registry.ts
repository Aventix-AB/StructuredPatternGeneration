/**
 * Pattern registry — add new patterns here.
 *
 * Steps to register a new pattern:
 *   1. Create `src/lib/patterns/<name>/index.ts` and export your `PatternDefinition`.
 *   2. Import and add it to PATTERN_REGISTRY below.
 */

import { checkerboardPattern } from "./checkerboard"
import { prbaPattern } from "./prba"
import { sinePattern } from "./sine"
import { specklePattern } from "./speckle"
import { stripePattern } from "./stripes"
import type { PatternDefinition } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PATTERN_REGISTRY: PatternDefinition<any>[] = [
    specklePattern,
    checkerboardPattern,
    prbaPattern,
    stripePattern,
    sinePattern,
]
