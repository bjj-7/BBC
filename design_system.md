# Basement Buzz Corner - Design System & UI Guidelines

This document outlines the core design tokens, components, and best practices for building and maintaining the UI of the Basement Buzz Corner application. Follow these guidelines to ensure visual consistency and prevent responsive layout bugs (e.g., overflow errors on mobile).

## 1. Design Tokens (CSS Variables)
These variables are defined in `src/index.css` under `:root`.

### Colors
- `--primary`: `#0F2F24` (Dark Green) - Main text, headers, primary UI elements.
- `--accent`: `#F37245` (Orange) - Primary buttons, call-to-action elements, badges.
- `--accent-2`: `#1FA089` (Teal) - Secondary interactive elements, chips, success states.
- `--accent-dark`: `#D95529` - Hover state for primary buttons.
- `--bg`: `#F9F8F6` (Off-white) - Main background color.
- `--surface`: `#ffffff` (White) - Card backgrounds, panels, modals.
- `--surface-alt`: `#EBEAE5` - Alternative surface backgrounds.
- `--text`: `#0F2F24` (Dark Green) - Default body text color.
- `--text-muted`: `#596D65` - Secondary text, placeholders, subtitles.
- `--border`: `#DCD9D1` - Input borders, dividers.
- `--error`: `#b3261e` - Error messages and states.

### Status Colors (Stock / Badges)
- `--stock-ok-bg`: `#e6f9ee` | `--stock-ok-fg`: `#1FA089` (In Stock / Positive)
- `--stock-low-bg`: `#fff4e0` | `--stock-low-fg`: `#F37245` (Low Stock / Warning)
- `--stock-out-bg`: `#fdeaea` | `--stock-out-fg`: `#D95529` (Out of Stock / Negative)

### Radii
- `--radius`: `12px` - Used for cards, modals, and large structural elements.
- *Forms/Buttons*: Typically `8px` or `999px` (pill shape).

## 2. Typography
- **Headings (`h1`, `h2`, `h3`, `h4`, `.serif`)**: `Playfair Display`, serif. Used for page titles, section headers, and hero text.
- **Body Text**: `Inter`, sans-serif. Used for paragraphs, buttons, form inputs, and small UI text.

## 3. UI Components

### Buttons
- `.primary-btn`: Solid accent background (`var(--accent)`), white text, `8px` radius, subtle shadow. Hover state elevates slightly.
- `.secondary-btn`: Border background (`var(--border)`), primary text, `8px` radius. Hover state darkens slightly.
- `.frosted-btn`: Glassmorphism effect (`rgba(255,255,255,0.4)` with backdrop-filter), pill-shaped, used for header icons (cart, search).
- `.hero-shop-btn`: White background, primary text, pill-shaped (`999px` radius).

### Forms & Inputs
- **Base styling**: Use `padding: 10px`, `border: 1px solid var(--border)`, `border-radius: 8px`, `font-family: inherit`.
- **Responsive Width**: **ALWAYS** apply `width: '100%'` to input fields. Never rely on the default HTML input width, as it causes horizontal scrolling/overflow on mobile devices.
- **Form Layout**: Stack inputs using `display: flex`, `flexDirection: 'column'`, `gap: 10px` (or `16px`).

## 4. Responsive Design & Layout Rules (CRITICAL)

To prevent horizontal overflow and broken layouts on mobile screens (like the Address Book bug), strictly follow these rules:

1. **Avoid Fixed Grids for Forms**: 
   - ❌ Avoid: `gridTemplateColumns: '1fr 1fr'` for adjacent input fields (e.g., City and State). On a 320px screen, 1fr is too narrow and will cause content to overflow.
   - ✅ Use: `gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'`. This allows inputs to sit side-by-side on desktop, but safely wrap to a new line on mobile.
   
2. **Handle Long Text**:
   - For user-generated text (like street addresses, emails, or notes) rendered inside cards, ALWAYS apply `word-break: break-word` or `overflow-wrap: break-word`. This prevents long strings from breaking the container boundaries.
   
3. **Major Structural Grids**:
   - For large side-by-side page layouts (like `.checkout-grid` or `.account-grid`), ensure there is a media query in `src/index.css` that collapses the grid to 1 column on mobile:
     ```css
     @media (max-width: 768px) {
       .checkout-grid, .account-grid {
         grid-template-columns: 1fr !important;
       }
     }
     ```
   - Do NOT rely exclusively on inline styles (e.g., `style={{ gridTemplateColumns: '1fr 2fr' }}`) without a corresponding CSS class that overrides it via `@media` query, as inline styles cannot be modified by media queries without `!important` in a stylesheet or a runtime JS hook.

4. **Padding Consistency**:
   - Page containers should use standard paddings, usually `padding: '40px 20px'` (top/bottom 40px, left/right 20px). The `20px` horizontal padding ensures breathing room on small screens without squeezing content.

5. **Modal Layouts & Vertical Centering**:
   - ❌ Avoid using `padding` on a flex container (e.g., `.modal`) to create vertical spacing when it has `overflow-y: auto`. Mobile browsers often collapse or ignore this padding when the content overflows, causing it to touch the very edge of the screen.
   - ❌ Avoid using `align-items: center` for modals that might exceed the viewport height. This causes flexbox to push the top of the modal entirely off the screen, preventing the user from scrolling up to see it.
   - ✅ Use `align-items: flex-start` on the parent modal container, and apply top/bottom spacing using `margin` on the child `.modal-box` instead (e.g., `margin: 5svh auto`). Always use `svh` (small viewport height) rather than `vh` to prevent mobile address bars from hiding your content.
