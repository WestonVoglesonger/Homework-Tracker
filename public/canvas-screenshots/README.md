# Canvas Setup Screenshots

This directory contains screenshots used in the Canvas setup wizard to guide users through the process of generating a personal access token.

## Required Screenshots

Place the following PNG or JPG files in this directory:

### 1. `canvas-login.png`
- Canvas login page
- Should show the login form with email/password fields
- Highlight the "Login" button

### 2. `account-menu.png`
- Canvas account dropdown menu
- Should show the Account option in the global navigation
- Highlight the "Settings" option in the dropdown

### 3. `approved-integrations.png`
- Account Settings page with sidebar
- Should highlight "Approved Integrations" in the left sidebar
- Show the page structure clearly

### 4. `generate-token.png`
- Approved Integrations page
- Should show the "+ New Access Token" button
- Highlight the button and the form area

### 5. `copy-token.png`
- Token generation result page
- Should show the generated token value
- Highlight the token text and any copy buttons

## Screenshot Guidelines

- **Resolution**: 1200x800px or higher for crisp display
- **Format**: PNG preferred for quality
- **Content**: Focus on the relevant UI elements
- **Annotations**: Use arrows, circles, or highlights to draw attention to important elements
- **Consistency**: Use similar styling for annotations across all screenshots

## Implementation Notes

- Screenshots are displayed in the `CanvasSetupWizard` component
- File paths are referenced in `src/components/canvas/CanvasSetupWizard.tsx`
- If screenshots are missing, placeholder content will be shown
- Screenshots should work well on both desktop and mobile views

## How to Capture Screenshots

1. Use browser developer tools to simulate different screen sizes
2. Capture only the relevant portion of the page
3. Use annotation tools (like Snagit, Skitch, or built-in macOS/Windows tools) to highlight important elements
4. Ensure text is readable and UI elements are clearly visible
