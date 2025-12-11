# Family History Citizenship Tool

A web-based tool to help users input and track their family history to determine eligibility for second citizenship. This application allows users to record ancestor information including birth, marriage, naturalization, and death details across multiple generations.

## Features

- **Family Tree Management**: Add and manage ancestors from self to great-great-grandparents
- **Flexible Data Entry**: Enter partial dates (year only, month/year, etc.) and optional information
- **Privacy-Focused**: Only stores first and last initials (one character each) for names
- **Local Storage**: Data persists locally in your browser
- **Import/Export**: Share data via encoded strings or shareable URLs
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- A modern web browser

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

## Usage

### Adding Ancestors

1. Click the "Add Ancestor" button
2. Fill in the required fields:
   - First Initial (one character)
   - Last Initial (one character)
   - Relationship (self, parent, grandparent, etc.)
3. Optionally add event information:
   - Birth details (date and/or country)
   - Marriage details (date and/or country)
   - Naturalization details (date and/or country)
   - Death details (date and/or country)
4. Click "Save Ancestor"

### Managing Data

- **Edit**: Click the "Edit" button on any ancestor card
- **Delete**: Click the "Delete" button on any ancestor card
- **Clear All**: Use the "Clear All" button to remove all data

### Import/Export

#### Exporting Data
1. Click "Export Data"
2. Choose from two options:
   - **Copy Shareable URL**: Creates a URL that can be shared with others
   - **Copy Data String**: Creates a base64-encoded string for manual sharing

#### Importing Data
1. Click "Import Data"
2. Paste either:
   - A shareable URL from another user
   - A base64-encoded data string
3. Click "Import"

## Data Structure

The application stores data in a structured JSON format:

```typescript
interface Ancestor {
    id: string;
    firstInitial: string;
    lastInitial: string;
    relationship: 'self' | 'parent' | 'grandparent' | 'great-grandparent' | 'great-great-grandparent';
    birth?: {
        date?: { year?: number; month?: number; day?: number };
        country?: string;
    };
    marriage?: {
        date?: { year?: number; month?: number; day?: number };
        country?: string;
    };
    naturalization?: {
        date?: { year?: number; month?: number; day?: number };
        country?: string;
    };
    death?: {
        date?: { year?: number; month?: number; day?: number };
        country?: string;
    };
    createdAt: number;
    updatedAt: number;
}
```

## Privacy & Security

- **No Personal Names**: Only first and last initials are stored
- **Local Storage Only**: Data never leaves your browser unless explicitly exported
- **No Server Communication**: All processing happens client-side
- **Shareable by Choice**: Data is only shared when you explicitly create export links

## Technical Details

### Architecture

- **Frontend**: HTML5, CSS3, TypeScript
- **Storage**: Browser localStorage
- **Build System**: TypeScript compiler
- **Development Server**: http-server

### File Structure

```
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── storage.ts        # Local storage management
│   ├── ui.ts            # UI management and event handling
│   └── main.ts          # Application entry point
├── dist/                # Compiled JavaScript files
├── index.html           # Main HTML file
├── styles.css           # Application styles
├── package.json         # Node.js dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and recompile automatically
- `npm run dev` - Start development server

### Contributing

This is a prototype application. Future enhancements could include:

- Visual family tree representation
- Citizenship eligibility analysis
- Additional relationship types
- Data validation improvements
- Export to other formats (PDF, CSV)

## License

MIT License - see LICENSE file for details

## Support

This is a prototype tool. For issues or questions, please refer to the source code or create an issue in the repository.
