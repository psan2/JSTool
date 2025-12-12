# Family History Tool

A modern React-based application for building and managing family trees. Track your family history with an intuitive visual interface and flexible data management.

## Features

### Core Functionality
- **Visual Family Tree**: Interactive SVG-based family tree with drag-free navigation
- **Flexible Relationships**: Support for unlimited parents (traditional and non-traditional families)
- **Persistent Generations**: Stable tree structure even when editing or deleting members
- **Full Name Support**: Store complete names (first and last) for all family members
- **Rich Event Tracking**: Record births, marriages, divorces, naturalizations, and deaths
- **Partial Dates**: Enter what you know (year only, month/year, or complete dates)

### Data Management
- **Local Storage**: Data persists automatically in your browser
- **Import/Export**: Share family trees via URLs or base64-encoded strings
- **Batch Updates**: Edit multiple relationships simultaneously without conflicts
- **Undo-Safe**: Confirmation dialogs for destructive actions

### User Experience
- **Intuitive Interface**: Click-to-edit cards with visual relationship indicators
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Hover Tooltips**: Descriptive tooltips on all interactive elements
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd JSTool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Usage

### Building Your Family Tree

#### Adding Family Members
1. Start with the "Self" card (automatically created)
2. Click the **+** button above a person to add parents
3. Click the **+** button below a person to add children
4. Click the **✎** (edit) button to add details

#### Editing Information
1. Click the edit button on any person card
2. Fill in available information:
   - **Names**: First and last names (optional)
   - **Parents**: Select from available people (unlimited)
   - **Birth**: Date and country
   - **Marriages**: Multiple marriages supported
   - **Divorces**: Track divorce events
   - **Naturalizations**: Citizenship changes
   - **Death**: Date and country (if applicable)
   - **Children**: Select from available people
3. Click "Save Person"

#### Managing Relationships
- **Parents**: Check/uncheck people to add/remove as parents
- **Children**: Check/uncheck people to add/remove as children
- **Cross-Exclusion**: Selected parents can't be children and vice versa
- **Validation**: Parents must be older than children (if birth years provided)

### Data Management

#### Exporting Your Tree
1. Click "Import/Export Data"
2. Choose export method:
   - **Copy Shareable URL**: Share via link
   - **Copy Data String**: Manual backup

#### Importing Data
1. Click "Import/Export Data"
2. Paste a shareable URL or data string
3. Click "Import"

#### Clearing Data
- Click "Clear All Data" to start fresh
- Confirmation required to prevent accidents

## Technical Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **State Management**: React Context API
- **Storage**: Browser localStorage with base64 encoding
- **Styling**: CSS3 with modern features

### Project Structure
```
src/
├── components/          # React components
│   ├── App.tsx         # Main application (125 lines)
│   ├── AncestorModal.tsx    # Edit form (462 lines)
│   ├── FamilyTreeGraph.tsx  # Visual tree (473 lines)
│   ├── DateInputGroup.tsx   # Reusable date input
│   └── ... (other components)
├── hooks/              # Custom React hooks
│   ├── useAncestorHandlers.ts  # Ancestor management
│   ├── useFamilyTreeStorage.ts # Storage operations
│   └── useNotification.ts      # Notifications
├── utils/              # Utility functions
│   ├── relationshipUtils.ts    # Relationship logic
│   ├── dateUtils.ts           # Date validation
│   └── locationUtils.ts       # Event creation
├── services/           # Business logic
│   ├── FamilyTreeService.ts   # Tree operations
│   └── StorageService.ts      # Data persistence
├── context/            # React context
│   └── FamilyTreeContext.tsx  # Global state
└── types/              # TypeScript definitions
    ├── types.ts
    └── guards.ts
```

### Key Design Decisions

#### Persistent Generations
Each person stores their generation number:
- `0` = Self (root)
- Positive numbers = Ancestors (1 = Parent, 2 = Grandparent, etc.)
- Negative numbers = Descendants (-1 = Child, -2 = Grandchild, etc.)

This ensures stable layout even when deleting or rearranging family members.

#### Array-Based Parents
Parents are stored as `parentIds: string[]` instead of `parent1Id` and `parent2Id`, supporting:
- Unlimited parents
- Non-traditional family structures
- Consistent architecture with children

#### Batch Updates
All relationship changes are collected and applied atomically to prevent race conditions and ensure data consistency.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization
- **Components**: Focused, single-responsibility React components
- **Hooks**: Reusable stateful logic
- **Utils**: Pure functions for common operations
- **Services**: Business logic and data operations
- **Context**: Global state management

## Accessibility

The application is fully accessible:
- **Keyboard Navigation**: All functions accessible via keyboard
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Hover Tooltips**: Descriptive text on all buttons
- **Focus Management**: Clear focus indicators

## Privacy & Security

- **Local-Only**: All data stays in your browser
- **No Tracking**: No analytics or external requests
- **Export Control**: You choose when to share data
- **Open Source**: Full transparency of data handling

## License

MIT License - See LICENSE file for details

## Future Enhancements

Potential improvements:
- PDF export of family tree
- GEDCOM import/export
- Photo attachments
- Advanced search and filtering
- Citizenship eligibility analysis
- Multi-language support

## Contributing

This is an open-source project. Contributions are welcome!

## Support

For issues or questions, please create an issue in the repository.
