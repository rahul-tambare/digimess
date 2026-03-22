# Design System Document: The Editorial Kitchen

This design system is a high-end, editorial approach to digital dining. It moves away from the "utility-first" look of standard meal apps and toward a "culinary magazine" experience. We prioritize appetite appeal through expansive white space, intentional asymmetry, and a sophisticated layering of warm, organic tones.

## 1. Creative North Star: "The Modern Organicist"
The goal is to make the user feel like they are browsing a premium cookbook, not a database. We achieve this by:
*   **Intentional Asymmetry:** Breaking the rigid grid. Overlap imagery over container edges to create a sense of depth and movement.
*   **Bespoke Breathing Room:** Using generous white space (Scale 8 through 16) to allow food photography to "breathe" and evoke a sense of high-end cleanliness.
*   **Tonal Fluidity:** Moving away from hard lines and adopting "Tonal Layering" to define hierarchy.

## 2. Color & Atmospheric Theory
Our palette evokes the sun (Oranges) and the garden (Greens). However, to maintain a premium feel, these colors are used as accents or soft washes rather than heavy blocks.

### The "No-Line" Rule
**Strict Prohibition:** Designers are forbidden from using 1px solid borders for sectioning. 
*   **How to define boundaries:** Use background color shifts. A section containing a meal preview should use `surface-container-low` sitting atop a `surface` background.
*   **Transition over Partition:** Use subtle tonal shifts to guide the eye, creating a seamless flow from one meal category to the next.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine vellum.
*   **Level 0 (Base):** `surface` (#faf9f8). The canvas.
*   **Level 1 (Sections):** `surface-container-low` (#f4f3f2). Use this for large content blocks.
*   **Level 2 (Interactive Elements):** `surface-container-lowest` (#ffffff). Reserved for high-priority cards or input fields to make them "pop" against the off-white base.

### The Glass & Gradient Rule
To avoid a "flat" appearance, apply a subtle linear gradient to main CTAs (transitioning from `primary` to `primary_container`). For floating navigation or modal overlays, use **Glassmorphism**: 
*   **Background:** `surface` at 70% opacity.
*   **Blur:** 20px - 30px backdrop-blur.
*   **Effect:** This allows the vibrant food photography to bleed through the UI, softening the interface.

---

## 3. Typography: The Editorial Voice
We use two distinct typefaces to balance "Friendly" with "Authoritative."

*   **The Hero (Plus Jakarta Sans):** Used for `display` and `headline` scales. This geometric sans-serif feels modern and clean. Use `display-lg` (3.5rem) for hero titles to create an immediate editorial impact.
*   **The Narrator (Be Vietnam Pro):** Used for `title`, `body`, and `label` scales. It is exceptionally readable at small sizes, maintaining the "friendly" brand promise without losing sophistication.

**Hierarchy Tip:** Pair a `headline-lg` in Plus Jakarta Sans with a `body-md` in Be Vietnam Pro. The high contrast in weight and scale creates a clear visual path for the user’s hunger-driven decision-making.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "heavy" for a fresh, appetizing app. We use light to define space.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card (Pure White) on a `surface-container` background. This creates a soft, natural lift.
*   **Ambient Shadows:** When an element must float (e.g., a "Quick Add" FAB), use a highly diffused shadow:
    *   **Blur:** 40px.
    *   **Opacity:** 6% of `on-surface`.
    *   **Color:** Tint the shadow with a hint of `primary` to make it feel like warm light is hitting the object.
*   **The Ghost Border:** If accessibility requires a stroke, use `outline-variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Signature Components

### Buttons: The "Soft-Touch" Action
*   **Primary:** A gradient of `primary` to `primary_container` with `roundedness.full`. High-contrast `on_primary` text.
*   **Secondary:** `surface-container-highest` background with `primary` colored text. No border.
*   **Micro-interaction:** On press, the button should scale slightly (98%) rather than just changing color.

### Food Cards: The "Borderless" Hero
*   **Structure:** No dividers or borders. Use `spacing.4` (1.4rem) padding.
*   **Imagery:** Use `roundedness.xl` (1.5rem) for image corners. Allow the image to bleed to the top and sides of the card.
*   **Typography:** The meal name should be `title-lg`, and the calorie count/price should be `label-md` using the `secondary` (green) color to denote freshness and health.

### Input Fields: The "Clean Slate"
*   **Style:** `surface-container-lowest` background. 
*   **Focus State:** Instead of a thick border, use a 2px bottom-bar of `primary` and a subtle glow using the `primary_fixed` color.

### Nutrition Chips
*   **Style:** Minimalist pills using `secondary_container` background with `on_secondary_container` text. These should feel like small "organic stamps" on the page.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use white space as a functional tool. If a screen feels cluttered, increase spacing to `spacing.10` or `12`.
*   **DO** use the "Freshness Green" (`secondary`) for all health-related or positive confirmation signals.
*   **DO** use `primary_fixed_dim` for subtle background washes behind food items to make the colors "glow."

### Don't:
*   **DON'T** use 100% black text. Always use `on_surface` (#1a1c1c) for a softer, more premium reading experience.
*   **DON'T** use divider lines between list items. Use `spacing.3` vertical gaps or a subtle `surface-variant` background shift.
*   **DON'T** use sharp corners. Every element should have a minimum of `roundedness.md` (0.75rem) to maintain the "friendly" persona.

---

## 7. Spacing & Rhythm
Rhythm is achieved through the strict adherence to the **0.35rem (5.6px) base unit**. 
*   **Standard Padding:** `spacing.4` (1.4rem).
*   **Section Gaps:** `spacing.10` (3.5rem) to ensure the "Minimalist" feel remains intact.