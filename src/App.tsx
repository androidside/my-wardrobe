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
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signup } from './services/auth';
import { useWardrobe } from './hooks/useWardrobe';
import { ClothingItem, ClothingColor } from './types/clothing';
import { LoginCredentials, SignupCredentials } from './types/auth';
import { getUserProfile, saveUserProfile } from './services/firestore';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  // Wardrobe state
  const { items, loading, error, addItem, updateItem, deleteItem } = useWardrobe();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [activePage, setActivePage] = useState<'wardrobe' | 'fitting-room' | 'profile'>('wardrobe');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [filterType, setFilterType] = useState<string | 'All'>('All');
  const [filterBrand, setFilterBrand] = useState<string | 'All'>('All');
  const [filterColor, setFilterColor] = useState<string | 'All'>('All');
  const [userProfile, setUserProfile] = useState<{ fullName?: string } | null>(null);

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
    if (page === 'fitting-room') {
      // Placeholder for future implementation
      return;
    }
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

  // Compute available filter options from items
  const types = Array.from(new Set(items.map((i) => i.type))).sort();
  const brands = Array.from(new Set(items.map((i) => i.brand))).filter(Boolean).sort();
  const colors = Array.from(new Set(items.map((i) => i.color))).filter(Boolean).sort() as ClothingColor[];

  const filteredItems = items
    .filter((it) => (filterType === 'All' ? true : it.type === filterType))
    .filter((it) => (filterBrand === 'All' ? true : it.brand === filterBrand))
    .filter((it) => (filterColor === 'All' ? true : it.color === filterColor));

  const handleEdit = (item: ClothingItem) => {
    setEditingItem(item);
  };

  if (authLoading || loading) {
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
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {activePage === 'profile' ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 My Profile</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
            </div>
          ) : activePage === 'fitting-room' ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚪 My Fitting Room</h1>
              <p className="text-sm text-gray-600 mt-1">Coming soon</p>
            </div>
          ) : (
            <>
              {/* Top row: Title and Item Count */}
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userProfile?.firstName 
                    ? `${userProfile.firstName}'s Wardrobe`
                    : 'My Wardrobe'}
                </h1>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </p>
                  {(filterType !== 'All' || filterBrand !== 'All' || filterColor !== 'All') && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {filterType !== 'All' && <span>{filterType}</span>}
                      {filterType !== 'All' && filterBrand !== 'All' && <span> • </span>}
                      {filterBrand !== 'All' && <span>{filterBrand}</span>}
                      {filterBrand !== 'All' && filterColor !== 'All' && <span> • </span>}
                      {filterColor !== 'All' && <span>{filterColor}</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                  <SelectTrigger className="w-24 sm:w-40 h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All types</SelectItem>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {activePage === 'wardrobe' ? (
          <WardrobeGallery
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={deleteItem}
            onView={(item) => setSelectedItem(item)}
          />
        ) : activePage === 'profile' ? (
          <MyProfile />
        ) : activePage === 'fitting-room' ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Fitting Room</h3>
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
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
            onSubmit={async (input) => {
              await addItem(input);
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <EditClothingDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onUpdate={updateItem}
      />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
