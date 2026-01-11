import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AddClothingForm } from './components/AddClothingForm';
import { WardrobeGallery } from './components/WardrobeGallery';
import { MyProfile } from './components/MyProfile';
import { ClothingDetailsDialog } from './components/ClothingDetailsDialog';
import { EditClothingDialog } from './components/EditClothingDialog';
import { BottomNavigation } from './components/BottomNavigation';
import { WardrobeSelector } from './components/WardrobeSelector';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WardrobeProvider, useWardrobeContext } from './contexts/WardrobeContext';
import { signup } from './services/auth';
import { useWardrobe } from './hooks/useWardrobe';
import { ClothingItem, ClothingColor, ClothingCategory } from './types/clothing';
import { LoginCredentials, SignupCredentials } from './types/auth';
import { getUserProfile, saveUserProfile, getClothingItems, updateClothingItem } from './services/firestore';
import { UserProfile } from './types/profile';
import { FittingRoom } from './components/FittingRoom';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  // Wardrobes management
  const { currentWardrobeId, wardrobes, loading: wardrobesLoading } = useWardrobeContext();
  
  // Wardrobe state - filter by current wardrobe
  // Key the hook by wardrobeId to force re-initialization when switching wardrobes
  console.log('[App] Render - currentWardrobeId:', currentWardrobeId);
  const wardrobeIdForHook = currentWardrobeId || undefined;
  console.log('[App] Passing wardrobeId to useWardrobe:', wardrobeIdForHook);
  const { items, loading, error, addItem, updateItem, deleteItem, refresh: refreshItems } = useWardrobe(wardrobeIdForHook);
  console.log('[App] items count:', items.length, 'for wardrobe:', currentWardrobeId);
  
  // Note: We don't need a separate useEffect to refresh items
  // The useWardrobe hook's useEffect will automatically reload when wardrobeId changes
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [activePage, setActivePage] = useState<'wardrobe' | 'fitting-room' | 'profile'>('wardrobe');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null); // Selected type category
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null); // Selected category
  const [filterBrand, setFilterBrand] = useState<string | 'All'>('All');
  const [filterColor, setFilterColor] = useState<string | 'All'>('All');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [migrationDone, setMigrationDone] = useState(false);

  // Auth handlers
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      // Error is handled by LoginPage component
      console.error('Login failed:', err);
    }
  };

  const handleSignup = async (credentials: SignupCredentials) => {
    try {
      // Sign up the user
      const authUser = await signup(credentials.email, credentials.password);
      
      // Save the profile data immediately after signup
      if (authUser && credentials.profile) {
        try {
          await saveUserProfile(authUser.uid, {
            firstName: credentials.profile.firstName,
            lastName: credentials.profile.lastName,
            dateOfBirth: credentials.profile.dateOfBirth,
            gender: credentials.profile.gender,
            city: credentials.profile.city,
            country: credentials.profile.country,
          });
          console.log('Profile saved successfully during signup');
        } catch (profileError) {
          console.error('Error saving profile during signup:', profileError);
          // Don't fail the signup if profile save fails, but log it
        }
      }
    } catch (err) {
      // Error is handled by SignupPage component
      console.error('Signup failed:', err);
    }
  };

  const handleNavigate = (page: 'wardrobe' | 'fitting-room' | 'profile') => {
    setActivePage(page);
  };

  // Load user profile for header display
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      }
    };
    loadUserProfile();
  }, [user]);

  // Migration: Move existing items without wardrobeId to default "Wardrobe 1"
  // Note: useWardrobes hook automatically creates "Wardrobe 1" if none exists
  useEffect(() => {
    const migrateExistingItems = async () => {
      if (!user || migrationDone || wardrobesLoading || !currentWardrobeId) return;

      try {
        // Get all items without wardrobeId
        const allItems = await getClothingItems(user.uid);
        const itemsWithoutWardrobe = allItems.filter((item) => !item.wardrobeId);

        // Update items to assign them to default wardrobe (currentWardrobeId should be "Wardrobe 1")
        if (itemsWithoutWardrobe.length > 0) {
          for (const item of itemsWithoutWardrobe) {
            await updateClothingItem(user.uid, item.id, { wardrobeId: currentWardrobeId });
          }
          // Refresh items after migration
          refreshItems();
        }

        setMigrationDone(true);
      } catch (err) {
        console.error('Error during migration:', err);
        // Don't block the app if migration fails
        setMigrationDone(true);
      }
    };

    migrateExistingItems();
  }, [user, migrationDone, wardrobesLoading, currentWardrobeId, refreshItems]);

  // Compute available filter options from items
  const brands = Array.from(new Set(items.map((i) => i.brand))).filter(Boolean).sort();
  const colors = Array.from(new Set(items.map((i) => i.color))).filter(Boolean).sort() as ClothingColor[];

  // Filter items - filter by selected type, brand, and color
  const filteredItems = items.filter((it) => {
    return (
      (selectedType === null ? true : it.type === selectedType) &&
      (filterBrand === 'All' ? true : it.brand === filterBrand) &&
      (filterColor === 'All' ? true : it.color === filterColor)
    );
  });

  const handleEdit = (item: ClothingItem) => {
    setEditingItem(item);
  };

  const handleWardrobeChange = (wardrobeId: string) => {
    console.log('[App] handleWardrobeChange called with:', wardrobeId);
    // Reset filters when switching wardrobes
    setSelectedType(null);
    setSelectedCategory(null);
    setFilterBrand('All');
    setFilterColor('All');
    // Force refresh items when wardrobe changes
    // The useEffect in useWardrobe should handle this, but let's also call it manually
    setTimeout(() => {
      refreshItems();
    }, 100);
  };

  if (authLoading || loading || wardrobesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👔</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!user) {
    return authPage === 'login' ? (
      <LoginPage
        onSwitchToSignup={() => setAuthPage('signup')}
        onLogin={handleLogin}
      />
    ) : (
      <SignupPage
        onSwitchToLogin={() => setAuthPage('login')}
        onSignup={handleSignup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Scrolls away */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {activePage === 'profile' ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 My Profile</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
            </div>
          ) : activePage === 'fitting-room' ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚪 My Fitting Room</h1>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <WardrobeSelector onWardrobeChange={handleWardrobeChange} />
              </div>
              {selectedCategory && (
                <div className="text-right">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedCategory}</h2>
                </div>
              )}
              {!selectedCategory && (selectedType !== null || filterBrand !== 'All' || filterColor !== 'All') && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {selectedType !== null && <span>{selectedType}</span>}
                    {selectedType !== null && filterBrand !== 'All' && <span> • </span>}
                    {filterBrand !== 'All' && <span>{filterBrand}</span>}
                    {filterBrand !== 'All' && filterColor !== 'All' && <span> • </span>}
                    {filterColor !== 'All' && <span>{filterColor}</span>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Floating Filter Bar - Sticks to top when scrolling - Only show when a type is selected */}
      {activePage === 'wardrobe' && selectedType !== null && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Select value={filterBrand} onValueChange={(v) => setFilterBrand(v)}>
                <SelectTrigger className="w-24 sm:w-40 h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterColor} onValueChange={(v) => setFilterColor(v)}>
                <SelectTrigger className="w-24 sm:w-36 h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All colors</SelectItem>
                  {colors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-0 pb-24 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {activePage === 'wardrobe' ? (
          <WardrobeGallery
            key={currentWardrobeId || 'no-wardrobe'}
            items={filteredItems}
            allItems={items}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            onTypeSelect={setSelectedType}
            onCategorySelect={setSelectedCategory}
            onEdit={handleEdit}
            onDelete={deleteItem}
            onView={(item) => setSelectedItem(item)}
          />
        ) : activePage === 'profile' ? (
          <MyProfile />
        ) : activePage === 'fitting-room' ? (
          <FittingRoom items={items} />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />

      {/* Floating Action Button - Only visible on Wardrobe page */}
      {activePage === 'wardrobe' && (
        <Button
          onClick={() => setShowAddDialog(true)}
          className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-40 flex items-center justify-center p-0"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <ClothingDetailsDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      />

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Clothing Item</DialogTitle>
          </DialogHeader>
          <AddClothingForm
            onSubmit={async (input, wardrobeId) => {
              await addItem(input, wardrobeId);
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
            existingItems={items}
            defaultWardrobeId={currentWardrobeId || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <EditClothingDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onUpdate={updateItem}
        existingItems={items}
      />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WardrobeProvider>
        <AppContent />
      </WardrobeProvider>
    </AuthProvider>
  );
}

export default App;
