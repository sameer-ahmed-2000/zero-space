# My Notion - WYSIWYG Markdown Editor

A high-performance, Notion-style WYSIWYG Markdown editor built with Next.js and TipTap. Features instant Markdown transformation, file imports for large documents, and professional PDF export capabilities.

## Features

✨ **WYSIWYG Editing** - Single-view editor with no edit/preview toggle  
📝 **Instant Markdown Transformation** - Paste raw Markdown and watch it transform into styled blocks  
⌨️ **Markdown Shortcuts** - Type `### ` for headings, `- ` for lists, `> ` for blockquotes  
🎨 **Syntax Highlighting** - GitHub-style light theme for code blocks  
📁 **Large File Import** - Import `.md` and `.txt` files (bypasses clipboard limits)  
📄 **Professional PDF Export** - One-click export with smart page breaks  
💾 **Auto-Save** - Content automatically saved to localStorage  
☁️ **Google Drive Sync (BYOD)** - Bring Your Own Database - sync your notes to your personal Google Drive  
🎯 **Contextual Menus** - Bubble menu for text formatting, floating menu for block types  
🌙 **Dark Mode** - Toggle between light and dark themes  
📑 **Multi-Page Support** - Organize content across multiple pages

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Editor:** TipTap (React)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Syntax Highlighting:** Lowlight
- **Markdown:** tiptap-markdown

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd zero-space
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Markdown Shortcuts

While typing in an empty paragraph, use these shortcuts:

- `# ` + Space → Heading 1
- `## ` + Space → Heading 2
- `### ` + Space → Heading 3
- `- ` + Space → Bullet List
- `1. ` + Space → Numbered List
- `> ` + Space → Blockquote
- ` ``` ` + Space → Code Block

### Text Formatting

Select text to reveal the bubble menu with options for:
- **Bold** (Ctrl/Cmd + B)
- *Italic* (Ctrl/Cmd + I)
- ~~Strikethrough~~
- `Inline Code`

### Importing Files

Click the **Import MD** button in the toolbar to import Markdown or text files. The content will be appended to the end of your document. This feature is perfect for importing large notes that exceed clipboard limits.

### Exporting to PDF

Click the **Export PDF** button to open the print dialog. The export includes:
- Clean, professional formatting
- Hidden UI elements (toolbars, menus, decorative images)
- Smart page breaks (code blocks won't split across pages)
- Proper syntax highlighting in code blocks

### Clearing Content

Click the **Clear** button to wipe all content. You'll be asked to confirm this action as it cannot be undone.

## Code Blocks

Create code blocks and enjoy GitHub-style syntax highlighting:

\`\`\`javascript
function hello() {
  console.log('Hello, Notion!')
}
\`\`\`

Supported languages include JavaScript, TypeScript, Python, Java, C++, and many more.

## Auto-Save

Your content is automatically saved to localStorage with every change. Refresh the page and your work will be restored.

## Google Drive Sync (BYOD)

**Bring Your Own Database** - Store your notes securely in your own Google Drive account!

### Features

- **Personal Storage**: Your notes are saved to a file called `zero_space_db.json` in YOUR Google Drive
- **Real-Time Sync**: Automatic synchronization with 2-second debounce after you stop typing
- **Visual Feedback**: See sync status (Saving/Synced/Error) directly in the toolbar
- **Secure**: Uses the `drive.file` scope - the app can ONLY access files it creates, not your entire Drive
- **Multi-Device**: Access your notes from any device by signing in with the same Google Account
- **Offline Fallback**: Works with localStorage when offline; syncs when connection is restored

### Setup

To enable Google Drive sync, you need to configure OAuth credentials. See the detailed setup guide: [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

Quick steps:
1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials
4. Add your Client ID to `.env.local`
5. Click "Connect Drive" in the toolbar

### Usage

1. Click the **"Connect Drive"** button in the top toolbar
2. Sign in with your Google Account  
3. Grant the app permission to access files it creates
4. Your notes will automatically sync to Drive

The sync status appears next to the Drive button:
- **Saving...** (Blue, spinning): Syncing to Drive
- **Synced** (Green, checkmark): All changes saved
- **Error** (Red, alert): Sync failed (will retry)

To disconnect, click your username and confirm.

## Project Structure

```
mynotion/
├── src/
│   └── app/
│       ├── globals.css      # Complete styling including print CSS
│       ├── layout.tsx        # Root layout with Inter font
│       └── page.tsx          # Main editor component
├── package.json
└── README.md
```

## Customization

### Changing Colors

Edit `src/app/globals.css` to customize:
- **Cover gradient:** `.cover-image` background
- **Code block background:** `.tiptap pre` background color
- **Inline code color:** `.tiptap code` color
- **Toolbar style:** `.toolbar` properties

### Adding New Block Types

Extend the FloatingMenu in `src/app/page.tsx` to add more block options:

```typescript
<button
  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
  title="Heading 3"
>
  <Heading3 size={18} />
</button>
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

---

Built with ❤️ using Next.js and TipTap
