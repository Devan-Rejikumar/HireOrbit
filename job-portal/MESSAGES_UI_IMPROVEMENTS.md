# Messages UI Improvements - Instructions

## Changes Made

### 1. Removed Sidebar
- The navigation sidebar has been removed from the Messages page
- Only the messages interface (ChatSidebar + ChatWindow) is now displayed
- Full-width layout for better messaging experience

### 2. Company Image Display
- Company logos are now displayed in the ChatSidebar conversation list
- If a company has a logo, it will be shown as the avatar
- If no logo is available, a default Building2 icon is displayed
- Images automatically fallback to default icon if they fail to load

### 3. Improved Scrollbars
- Custom thin scrollbars added for better aesthetics
- Scrollbars are styled to be less intrusive
- Applied to both ChatSidebar and ChatWindow message areas

### 4. Watermark Logo
- A watermark has been added to the ChatWindow
- Currently displays "Hire Orbit" text with gradient background
- Positioned in the center with reduced opacity (5%)
- Space reserved below to avoid overlapping with input area

## How to Add Your Site Logo as Watermark

### Step 1: Add Logo File
1. Place your logo image file in the `job-portal/public/` directory
2. Recommended formats: PNG (with transparency) or SVG
3. Recommended filename: `logo.png` or `logo.svg`
4. Recommended size: 256x256px or larger (will be scaled down)

### Step 2: Update ChatWindow Component
1. Open `job-portal/src/components/ChatWindow.tsx`
2. Find the watermark section (around line 139-146)
3. Replace the current div structure with:

```tsx
<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 z-0" style={{ paddingBottom: '80px' }}>
  <img 
    src="/logo.png" 
    alt="Site Logo" 
    className="h-32 w-auto opacity-5"
  />
</div>
```

### Step 3: Adjust Settings (Optional)
- **Size**: Change `h-32` to adjust height (e.g., `h-24` for smaller, `h-40` for larger)
- **Opacity**: Change `opacity-5` to adjust visibility (e.g., `opacity-10` for more visible, `opacity-3` for less visible)
- **Position**: Adjust `paddingBottom: '80px'` to move watermark up/down

### Example with Different Settings:
```tsx
<img 
  src="/logo.png" 
  alt="Site Logo" 
  className="h-40 w-auto opacity-10"
/>
```

## File Locations

- **MessagesPage**: `job-portal/src/pages/MessagesPage.tsx`
- **ChatSidebar**: `job-portal/src/components/ChatSidebar.tsx`
- **ChatWindow**: `job-portal/src/components/ChatWindow.tsx`
- **Logo Directory**: `job-portal/public/`

## Notes

- The watermark is non-interactive (pointer-events-none) so it won't interfere with chat functionality
- Company logos are fetched from the company service API
- If a company logo fails to load, it automatically falls back to the default icon
- All scrollbars use custom styling for a cleaner look

