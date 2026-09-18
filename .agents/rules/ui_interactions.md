# UI Interaction Rules

When building or updating UI components for this PWA, you must adhere to the following interactive rules:

1. **Invisible Scrollbars:**
   Any scrollable container (e.g., horizontal carousels, lists, drawers) must hide the default browser scrollbar to maintain a native app aesthetic.
   Ensure that the global CSS rule hiding scrollbars is preserved, or apply `::-webkit-scrollbar { display: none; }` and `scrollbar-width: none;` specifically if needed.

2. **Full Card Clickability:**
   Category cards, promotional banners, or any similar container displaying a primary image should be entirely clickable, taking the user directly to the relevant view (e.g., the shop page filtered by that category).
   Wrap the entire card element in a `<Link>` component rather than relying solely on a small nested button for navigation.

3. **Product Image Quick-Add:**
   Product images on display cards must act as a quick-add feature.
   - Clicking the image of a product that is **not yet in the cart** should instantly add 1 unit to the cart (if in stock).
   - If the product is **already in the cart**, clicking the image should do nothing (or remain unclickable). Subsequent quantity adjustments must be made using the explicit dynamic cart controls (the `+`/`-` buttons).
   - If the product is out of stock, clicking the image should trigger the product request/restock flow (e.g., opening the Request Modal).

4. **Horizontal Scroll Boundaries (No Full Bleed):**
   Horizontal scroll containers (like product carousels or category rows) must **not** go "full bleed" by using negative margins to reach the edge of the screen.
   They must remain within the standard padded column bounds of the parent container to ensure consistent visual alignment with section headers.

5. **Padding for Pop-up Effects:**
   If a card uses an active/hover translation (e.g., `transform: translateY(-5px)`), ensure that the parent container's padding is sufficient to accommodate this movement without cutting off the card's visual boundaries (e.g., add `padding-top: 10px` to the parent flex/grid container if needed).

6. **Premium Dropdowns:**
   Native <select> elements should be avoided for dropdown selections. Instead, use custom dropdown components (like <PremiumSelect>, <Combobox>, or custom floating select menus) styled consistently with the rest of the application (using rounded pill shapes, chevron icons from lucide-react, and sleek hover effects) to maintain a premium UI.
