# My Wardrobe - Clothing Management System

A modern, mobile-first web application to manage your wardrobe. Take photos of your clothes and catalog them with details like brand, size, color, and cost.

## Features

- **Photo Capture**: Take photos directly from your phone camera or upload from gallery
- **Full CRUD Operations**: Add, view, edit, and delete clothing items
- **Comprehensive Details**: Track type, brand, size, color, cost, and optional notes
- **Mobile-First Design**: Optimized for phone usage with responsive layout
- **Offline Storage**: Uses IndexedDB for photos and localStorage for metadata
- **Modern UI**: Built with Tailwind CSS v4 and Shadcn UI components

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI
- **Storage**:
  - IndexedDB for photo storage (Blobs)
  - localStorage for clothing metadata (JSON)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd my-wardrobe
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── AddClothingForm.tsx
│   ├── ClothingCard.tsx
│   ├── EditClothingDialog.tsx
│   ├── PhotoCapture.tsx
│   └── WardrobeGallery.tsx
├── hooks/              # Custom React hooks
│   └── useWardrobe.ts
├── types/              # TypeScript type definitions
│   └── clothing.ts
├── utils/              # Utility functions and services
│   ├── imageStorage.ts # IndexedDB wrapper
│   └── storage.ts      # Main storage service
├── lib/                # Helper utilities
│   └── utils.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Data Storage Architecture

### Current Implementation (Browser Storage)

**Clothing Metadata** → localStorage (JSON)
- Stores: id, type, brand, size, color, cost, imageId, dateAdded, notes
- Key: `wardrobe_items`

**Photos** → IndexedDB (Blobs)
- Database: `WardrobeDB`
- Store: `images`
- Stores: {id, blob}

### Storage Abstraction

The `StorageService` class in `src/utils/storage.ts` provides a clean interface for all storage operations. This abstraction layer makes it easy to migrate to a backend API in the future.

### Future Migration Path

When ready to add a backend:
1. Create API endpoints (REST/GraphQL)
2. Set up database (PostgreSQL/MongoDB)
3. Add cloud storage (S3/Minio) for photos
4. Update `StorageService` to use API instead of browser storage
5. UI components require no changes!

## Usage

### Adding a Clothing Item

1. Click the "Add Item" button (+ icon)
2. Take a photo or upload an image
3. Fill in the details:
   - Type (T-shirt, Jacket, Shoes, etc.)
   - Brand
   - Size
   - Color
   - Cost
   - Optional notes
4. Click "Add to Wardrobe"

### Viewing Your Wardrobe

- All items are displayed in a responsive grid
- 1 column on mobile
- 2-3 columns on tablet
- 4 columns on desktop

### Editing an Item

1. Click on a clothing card
2. Click the Edit button (pencil icon)
3. Modify any fields
4. Click "Update Item"

### Deleting an Item

1. Click on a clothing card
2. Click the Delete button (trash icon)
3. Confirm deletion

## Mobile Features

- **Camera Access**: Direct camera access on mobile devices via HTML5 Media Capture
- **Floating Action Button**: Quick access to add items on mobile
- **Touch-Friendly**: Large tap targets and optimized spacing
- **Responsive Images**: Images are optimized and stored as Blobs

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Mobile browsers: Full support with camera access

## Storage Limits

- **localStorage**: ~5-10 MB (used only for metadata, so plenty of space)
- **IndexedDB**: ~50 MB - 1 GB+ (varies by browser)
- **Estimated Capacity**: 500-1000+ clothing items with photos

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

The codebase is structured for easy extension:

1. **New clothing attributes**: Update `src/types/clothing.ts`
2. **New storage methods**: Extend `src/utils/storage.ts`
3. **New UI components**: Add to `src/components/`
4. **Custom hooks**: Add to `src/hooks/`

## License

MIT

## Future Enhancements

- [ ] Backend API integration
- [ ] Cloud storage for photos (S3/Minio)
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Search and filter functionality
- [ ] Outfit creation feature
- [ ] Statistics dashboard (total cost, most worn items)
- [ ] Export/import functionality
- [ ] Dark mode support
- [ ] Multi-user support with authentication
- [ ] PWA capabilities (offline mode, install to home screen)
