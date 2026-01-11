# My Wardrobe - Intelligent Clothing Management System

A modern, feature-rich web application to manage your wardrobe with AI-powered image analysis, outfit compatibility ratings, and comprehensive clothing organization. Built with React, TypeScript, and Firebase.

## 🎯 Features

### Core Functionality

- **📸 Photo Capture**: Take photos directly from your phone camera or upload from gallery
- **🔄 Full CRUD Operations**: Create, read, update, and delete clothing items seamlessly
- **👔 Wardrobe Management**: Create and manage multiple wardrobes to organize your clothing
- **🏷️ Hierarchical Organization**: 
  - **Categories**: Tops, Bottoms, Footwear, Outerwear, Accessories
  - **Types**: Specific clothing types within each category (e.g., T-shirt, Jeans, Sneakers)
  - **Tags**: Multi-select tags (Sportswear, Gym, Running, Outdoor, Formal, Casual, Beach, Winter, Summer, Workout, Travel, Party, Business, Athletic, Comfort)
- **🎨 Advanced Color Support**:
  - Primary color selection
  - Multiple additional colors for multicolor items
  - Pattern detection and selection (Solid, Stripes, Checks, Plaid, Polka Dots, Floral, Abstract, Geometric, Corduroy)
- **🤖 AI-Powered Image Analysis**: 
  - Auto-detects clothing category and type
  - Identifies colors and patterns
  - Recognizes brand logos and text
  - Powered by Google Cloud Vision API

### Advanced Features

- **👔 Outfit Compatibility System**:
  - Smart compatibility ratings (0-10 scale)
  - Color and type matching algorithms
  - Formality level consistency checking
  - Real-time outfit suggestions and feedback
- **🎭 Fitting Room**: 
  - Create outfit combinations (Top, Bottom, Footwear, Accessories)
  - Get instant compatibility ratings
  - Receive style suggestions and feedback
- **👤 User Profiles**: 
  - Personal sizing information (General, Pants, Shoe sizes)
  - Country selection
  - Profile-based auto-fill for new items
- **🔐 Authentication**: 
  - Secure user signup and login
  - Firebase Authentication integration
  - User-specific wardrobe data

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Backend & Database**:
  - **Firebase Firestore**: Cloud database for clothing metadata and wardrobe information
  - **Firebase Storage**: Cloud storage for clothing images
  - **Firebase Authentication**: User authentication and authorization
- **AI/ML**: Google Cloud Vision API for image analysis
- **State Management**: React Context API (AuthContext, WardrobeContext)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with:
  - Firestore database
  - Firebase Storage bucket
  - Authentication enabled
- Google Cloud Vision API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-wardrobe
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

4. **Set up Firebase Security Rules**

#### Firestore Security Rules

Ensure your Firestore security rules allow authenticated users to read/write their own data:

Go to Firebase Console → Firestore Database → Rules tab, and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clothing items (stored as subcollection)
    match /users/{userId}/wardrobe/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Wardrobes collection
    match /wardrobes/{wardrobeId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **"Publish"** to deploy the rules.

#### Firebase Storage Security Rules

**IMPORTANT**: You MUST set up Storage rules for profile pictures and clothing images to work.

Go to Firebase Console → Storage → Rules tab, and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures path: users/{userId}/profile/{fileName}
    match /users/{userId}/profile/{fileName} {
      allow read: if request.auth != null; // Authenticated users can view
      allow write: if request.auth != null && request.auth.uid == userId; // Only owner can upload/delete
      
      // Validate file type and size on create
      allow create: if request.auth != null 
        && request.auth.uid == userId 
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024; // Max 5MB
      
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clothing item images path: users/{userId}/items/{itemId}/{fileName}
    match /users/{userId}/items/{itemId}/{fileName} {
      allow read: if request.auth != null; // Authenticated users can view
      allow write: if request.auth != null && request.auth.uid == userId; // Only owner can upload/delete
      
      // Validate file type and size on create
      allow create: if request.auth != null 
        && request.auth.uid == userId 
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 10 * 1024 * 1024; // Max 10MB
      
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Click **"Publish"** to deploy the rules.

> **Note**: For detailed setup instructions, see [FIREBASE_STORAGE_RULES.md](./FIREBASE_STORAGE_RULES.md)

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser** and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── AddClothingForm.tsx
│   ├── ClothingCard.tsx
│   ├── ClothingDetailsDialog.tsx
│   ├── EditClothingDialog.tsx
│   ├── FittingRoom.tsx
│   ├── LoginPage.tsx
│   ├── MyProfile.tsx
│   ├── PhotoCapture.tsx
│   ├── SignupPage.tsx
│   ├── WardrobeGallery.tsx
│   └── WardrobeSelector.tsx
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── WardrobeContext.tsx
├── data/               # Static data and configurations
│   ├── brands.ts
│   ├── countries.ts
│   └── outfitCompatibility.ts
├── hooks/              # Custom React hooks
│   ├── useWardrobe.ts
│   └── useWardrobes.ts
├── services/           # Business logic and API services
│   ├── auth.ts
│   ├── firestore.ts
│   ├── imageAnalysis.ts
│   ├── outfitRating.ts
│   └── wardrobeStorage.ts
├── types/              # TypeScript type definitions
│   ├── auth.ts
│   ├── clothing.ts
│   ├── profile.ts
│   └── wardrobe.ts
├── utils/              # Utility functions
│   ├── clothingMigration.ts
│   ├── imageStorage.ts
│   ├── profileStorage.ts
│   └── storage.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🗄️ Data Storage Architecture

### Firebase Firestore Collections

**Users Collection** (`users/{userId}`)
- User profile data (name, email, sizes, country, etc.)

**Clothing Items Collection** (`clothing/{itemId}`)
- Clothing metadata:
  - `category`: ClothingCategory (Tops, Bottoms, Footwear, Outerwear, Accessories)
  - `type`: string (e.g., "T-shirt", "Jeans", "Sneakers")
  - `tags`: ClothingTag[] (optional)
  - `brand`: string
  - `size`: ClothingSize
  - `color`: ClothingColor (primary)
  - `colors`: ClothingColor[] (additional colors, optional)
  - `pattern`: ClothingPattern (optional)
  - `cost`: number
  - `formalityLevel`: FormalityLevel (1-5)
  - `imageId`: string (Firebase Storage URL)
  - `dateAdded`: string (ISO date)
  - `notes`: string (optional)
  - `wardrobeId`: string (optional)
  - `userId`: string
  - `migrated`: boolean (migration flag)

**Wardrobes Collection** (`wardrobes/{wardrobeId}`)
- Wardrobe metadata:
  - `name`: string
  - `userId`: string
  - `createdAt`: string (ISO date)
  - `updatedAt`: string (ISO date)

### Firebase Storage

**Images** (`users/{userId}/clothing/{itemId}/image.jpg`)
- Stores clothing item photos as JPEG files
- Organized by user and item ID

## 📖 Usage Guide

### Getting Started

1. **Sign Up**: Create a new account with email and password
2. **Set Up Profile**: Add your sizing information and country in the Profile section
3. **Create Your First Wardrobe**: A default wardrobe is created automatically, or create additional wardrobes

### Adding a Clothing Item

1. Click the "Add Item" button (+ icon)
2. **Capture Photo**: Take a photo or upload an image
   - Image analysis will automatically detect:
     - Category and type
     - Colors
     - Pattern
     - Brand (if visible)
3. **Select Wardrobe**: Choose which wardrobe to add the item to (if you have multiple)
4. **Fill in Details**:
   - **Category**: Tops, Bottoms, Footwear, Outerwear, or Accessories
   - **Type**: Specific type within the category
   - **Tags**: Select relevant tags (Sportswear, Formal, Casual, etc.)
   - **Primary Color**: Main color of the item
   - **Additional Colors**: Add multiple colors for multicolor items
   - **Pattern**: Select pattern type (Solid, Stripes, Checks, Plaid, etc.)
   - **Brand**: Enter or select from suggestions
   - **Size**: Automatically populated based on your profile
   - **Cost**: Purchase price
   - **Formality Level**: Rate from 1 (Very Informal) to 5 (Very Formal)
   - **Notes**: Optional additional notes
5. Click "Add to Wardrobe"

### Organizing Your Wardrobe

#### Viewing Items
- **Category View**: Browse items grouped by category (Tops, Bottoms, etc.)
- **Type View**: View items by specific type within a category
- **Item Detail View**: Click on an item card to see full details

#### Managing Wardrobes
- **Create Wardrobe**: Add new wardrobes for different purposes (e.g., "Work", "Casual", "Summer")
- **Switch Wardrobes**: Use the wardrobe selector dropdown to switch between wardrobes
- **Edit Wardrobe**: Rename wardrobes
- **Delete Wardrobe**: Remove wardrobes (with option to migrate items to another wardrobe)

### Editing an Item

1. Click on a clothing card
2. Click the Edit button (pencil icon)
3. Modify any fields including:
   - Moving item to a different wardrobe
   - Updating colors, pattern, tags
   - Changing category, type, size, etc.
4. Click "Update Item"

### Creating Outfits (Fitting Room)

1. Navigate to the Fitting Room section
2. Select items for each category:
   - **Top**: Tops or outerwear
   - **Bottom**: Pants, jeans, shorts, skirts
   - **Footwear**: Shoes, sneakers, boots, etc.
   - **Accessories**: Hats, belts, bags, etc. (multiple allowed)
3. **View Compatibility Rating**:
   - Overall score (0-10)
   - Matrix score based on color and type compatibility
   - Strengths: What works well
   - Feedback: General outfit assessment
   - Suggestions: Improvement recommendations
4. Make adjustments based on feedback for better combinations

### Compatibility System

The outfit compatibility system evaluates:
- **Color Harmony**: Analyzes color combinations, including multicolor items
- **Type Compatibility**: Ensures clothing types work well together
- **Formality Consistency**: Checks that formality levels match
- **Neutral Foundation**: Recognizes neutral colors as versatile base pieces

## 🔄 Data Migration

The system includes automatic migration for existing items:
- Legacy items without category/type structure are automatically migrated
- Items with "Multicolor" as color are handled with color arrays
- Pattern defaults to "Solid" for existing items
- Migration flags prevent duplicate processing

## 🎨 Clothing Categories & Types

### Tops
- T-shirt, Shirt, Sweater, Hoodie, Tank Top, Polo, Blouse, Tunic, Crop Top, Long Sleeve

### Bottoms
- Pants, Jeans, Shorts, Skirt, Leggings, Sweatpants, Chinos, Cargo Pants, Dress

### Footwear
- Sneakers, Shoes, Boots, Sandals, Slippers, Loafers, Heels, Flats, Running Shoes

### Outerwear
- Jacket, Coat, Blazer, Vest, Cardigan, Windbreaker, Parka, Bomber, Trench Coat

### Accessories
- Hat, Socks, Underwear, Belt, Watch, Scarf, Gloves, Bag, Wallet, Jewelry

## 🎯 Patterns Supported

- Solid, Stripes, Checks, Plaid, Polka Dots, Floral, Abstract, Geometric, Corduroy, Other

## 🔒 Security

- **Authentication Required**: All operations require user authentication
- **Data Isolation**: Users can only access their own data
- **Firebase Security Rules**: Server-side validation ensures data security
- **Encrypted Storage**: Firebase handles encryption for stored data

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+)
- **Mobile browsers**: Full support with camera access

## 📊 Storage & Scalability

- **Firestore**: Scalable NoSQL database, handles millions of documents
- **Firebase Storage**: Unlimited storage for images (with pricing)
- **Efficient Queries**: Indexed queries for fast retrieval
- **Real-time Updates**: Live synchronization across devices

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

The codebase is structured for easy extension:

1. **New clothing attributes**: Update `src/types/clothing.ts`
2. **New categories/types**: Add to `CLOTHING_TYPES_BY_CATEGORY` in `src/types/clothing.ts`
3. **New patterns**: Add to `ClothingPattern` type and pattern detection keywords
4. **New tags**: Add to `ClothingTag` type
5. **New UI components**: Add to `src/components/`
6. **New hooks**: Add to `src/hooks/`
7. **New services**: Add to `src/services/`

## 📝 License

MIT

## 🚀 Future Enhancements

- [ ] Advanced search and filtering (by color, pattern, brand, tags)
- [ ] Outfit history and favorites
- [ ] Calendar integration for outfit planning
- [ ] Shopping list functionality
- [ ] Cost analysis and wardrobe value tracking
- [ ] Clothing condition tracking (wear, wash, repair)
- [ ] Style inspiration recommendations
- [ ] Social features (share outfits, follow stylists)
- [ ] Dark mode support
- [ ] PWA capabilities (offline mode, install to home screen)
- [ ] Multi-language support
- [ ] Barcode scanning for brand detection
- [ ] Weather-based outfit suggestions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.
