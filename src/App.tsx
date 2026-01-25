import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AddClothingForm } from './components/AddClothingForm';
import { WardrobeGallery } from './components/WardrobeGallery';
import { UserProfileView } from './components/UserProfileView';
import { FriendsListView } from './components/FriendsListView';
import { SettingsView } from './components/SettingsView';
import { ManageWardrobesView } from './components/ManageWardrobesView';
import { FriendWardrobeView } from './components/FriendWardrobeView';
import { StatisticsView } from './components/StatisticsView';
import { ClothingDetailsDialog } from './components/ClothingDetailsDialog';
import { EditClothingDialog } from './components/EditClothingDialog';
import { BottomNavigation } from './components/BottomNavigation';
import { WardrobeSelector } from './components/WardrobeSelector';
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WardrobeProvider, useWardrobeContext } from './contexts/WardrobeContext';
import { signup as authSignup } from './services/auth';
import { useWardrobe } from './hooks/useWardrobe';
import { ClothingItem, ClothingColor, ClothingCategory, ClothingTag } from './types/clothing';
import { LoginCredentials, SignupCredentials } from './types/auth';
import { saveUserProfile, getClothingItems, updateClothingItem } from './services/firestore';
import { FittingRoom } from './components/FittingRoom';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, login } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  // Wardrobes management
  const { currentWardrobeId, wardrobes, loading: wardrobesLoading } = useWardrobeContext();
  
  // Wardrobe state - filter by current wardrobe
  // Key the hook by wardrobeId to force re-initialization when switching wardrobes
  console.log('[App] Render - currentWardrobeId:', currentWardrobeId);
  // Pass "all" to the hook if that's selected, otherwise use the current wardrobeId
  const wardrobeIdForHook = currentWardrobeId || undefined;
  console.log('[App] Passing wardrobeId to useWardrobe:', wardrobeIdForHook);
  const { items, loading, error, addItem, updateItem, deleteItem, refresh: refreshItems } = useWardrobe(wardrobeIdForHook);
  console.log('[App] items count:', items.length, 'for wardrobe:', currentWardrobeId);
  
  // Note: We don't need a separate useEffect to refresh items
  // The useWardrobe hook's useEffect will automatically reload when wardrobeId changes
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [activePage, setActivePage] = useState<'wardrobe' | 'fitting-room' | 'stats' | 'profile'>('wardrobe');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null); // Selected type category
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null); // Selected category
  const [viewMode, setViewMode] = useState<'all-items' | 'brands' | 'tags' | null>(null); // New: view mode for overview navigation
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null); // New: selected brand for filtering
  const [selectedTag, setSelectedTag] = useState<ClothingTag | null>(null); // New: selected tag for filtering
  const [migrationDone, setMigrationDone] = useState(false);

  // Profile view routing
  type ProfileView = 'own' | 'friend' | 'friends-list' | 'settings' | 'friend-wardrobe' | 'manage-wardrobes';
  const [profileView, setProfileView] = useState<ProfileView>('own');
  const [viewingFriendId, setViewingFriendId] = useState<string | null>(null);
  const [viewingFriendUsername, setViewingFriendUsername] = useState<string | null>(null);
  const [viewingFriendWardrobeId, setViewingFriendWardrobeId] = useState<string | null>(null);
  const [viewingFriendWardrobeName, setViewingFriendWardrobeName] = useState<string | null>(null);

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
      const authUser = await authSignup(credentials.email, credentials.password);
      
      // Save the profile data immediately after signup
      if (authUser && credentials.profile) {
        // Create initial profile with all required fields and defaults
        await saveUserProfile(authUser.uid, {
          userId: authUser.uid,
          username: credentials.profile.username,
          firstName: credentials.profile.firstName,
          lastName: credentials.profile.lastName,
          dateOfBirth: credentials.profile.dateOfBirth,
          gender: credentials.profile.gender,
          city: credentials.profile.city,
          country: credentials.profile.country,
          privacySettings: {
            allowDirectFollow: false, // Default: require friend request approval
          },
        }, true); // Skip username check since we already validated it
        console.log('Profile saved successfully during signup for user:', authUser.uid);
      }
    } catch (err) {
      // Error is handled by SignupPage component
      console.error('Signup failed:', err);
      throw err; // Re-throw so SignupPage can handle the error
    }
  };

  const handleNavigate = (page: 'wardrobe' | 'fitting-room' | 'stats' | 'profile') => {
    setActivePage(page);
    // Reset profile view to 'own' when navigating to profile page
    if (page === 'profile') {
      setProfileView('own');
      setViewingFriendId(null);
      setViewingFriendUsername(null);
      setViewingFriendWardrobeId(null);
      setViewingFriendWardrobeName(null);
    }
  };


  // Migration: Move existing items without wardrobeId to default "Wardrobe 1"
  // Note: useWardrobes hook automatically creates "Wardrobe 1" if none exists
  useEffect(() => {
    const migrateExistingItems = async () => {
      if (!user || migrationDone || wardrobesLoading || !currentWardrobeId || currentWardrobeId === 'all') return;

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
  // Note: Filtering is now handled within WardrobeGallery component

  const handleWardrobeChange = (wardrobeId: string) => {
    console.log('[App] handleWardrobeChange called with:', wardrobeId);
    // Reset all selections when switching wardrobes
    setSelectedType(null);
    setSelectedCategory(null);
    setViewMode(null);
    setSelectedBrand(null);
    setSelectedTag(null);
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

  // Handlers for stats interactions
  const handleStatsFilterCategory = (category: ClothingCategory) => {
    setSelectedCategory(category);
    setActivePage('wardrobe');
  };

  const handleStatsFilterColor = (_color: ClothingColor) => {
    setSelectedCategory(null);
    setActivePage('wardrobe');
    // Note: Color filtering is now handled within WardrobeGallery
  };

  const handleStatsFilterBrand = (_brand: string) => {
    setSelectedCategory(null);
    setActivePage('wardrobe');
    // Note: Brand filtering is now handled via search in WardrobeGallery
  };

  // Get current wardrobe name
  const currentWardrobe = wardrobes.find(w => w.id === currentWardrobeId);
  const currentWardrobeName = currentWardrobeId === 'all' 
    ? 'All Wardrobes' 
    : currentWardrobe?.name || 'Current Wardrobe';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Scrolls away */}
      {/* Header - Hide on profile and stats pages since they have their own headers */}
      {activePage !== 'profile' && activePage !== 'stats' && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            {activePage === 'fitting-room' ? (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚪 My Fitting Room</h1>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                {/* Left side: Title and filters */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">My Wardrobe</h1>
                  {selectedCategory && (
                    <p className="text-sm text-gray-600">
                      Viewing: <span className="font-medium">{selectedCategory}</span>
                    </p>
                  )}
                </div>
                
                {/* Right side: Wardrobe selector */}
                <div className="min-w-[200px]">
                  <WardrobeSelector onWardrobeChange={handleWardrobeChange} />
                </div>
              </div>
            )}
          </div>
        </header>
      )}


      {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 pt-4 pb-24 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {activePage === 'wardrobe' ? (
          <WardrobeGallery
            key={currentWardrobeId || 'no-wardrobe'}
            items={items}
            allItems={items}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedTag={selectedTag}
            viewMode={viewMode}
            onTypeSelect={setSelectedType}
            onCategorySelect={setSelectedCategory}
            onBrandSelect={setSelectedBrand}
            onTagSelect={setSelectedTag}
            onViewModeChange={setViewMode}
            onView={(item) => setSelectedItem(item)}
          />
        ) : activePage === 'profile' ? (
          <>
            {profileView === 'own' && user && (
              <UserProfileView
                userId={user.uid}
                isOwnProfile={true}
                onNavigateToFriends={() => setProfileView('friends-list')}
                onNavigateToSettings={() => setProfileView('settings')}
              />
            )}
            {profileView === 'friends-list' && (
              <FriendsListView
                onViewFriend={(friendId, friendUsername) => {
                  setViewingFriendId(friendId);
                  setViewingFriendUsername(friendUsername);
                  setProfileView('friend');
                }}
                onBack={() => setProfileView('own')}
              />
            )}
            {profileView === 'friend' && viewingFriendId && viewingFriendUsername && user && (
              <UserProfileView
                userId={viewingFriendId}
                isOwnProfile={false}
                onViewFriendWardrobe={(wardrobeId, wardrobeName) => {
                  setViewingFriendWardrobeId(wardrobeId);
                  setViewingFriendWardrobeName(wardrobeName);
                  setProfileView('friend-wardrobe');
                }}
                onRemoveFriend={async () => {
                  const { unfollowUser } = await import('./services/social');
                  await unfollowUser(user.uid, viewingFriendId);
                  setProfileView('friends-list');
                }}
                onBack={() => setProfileView('friends-list')}
              />
            )}
            {profileView === 'friend-wardrobe' && viewingFriendId && viewingFriendUsername && viewingFriendWardrobeId && viewingFriendWardrobeName && (
              <FriendWardrobeView
                friendId={viewingFriendId}
                friendUsername={viewingFriendUsername}
                onBack={() => setProfileView('friend')}
              />
            )}
            {profileView === 'settings' && (
              <SettingsView 
                onBack={() => setProfileView('own')} 
                onNavigateToWardrobes={() => setProfileView('manage-wardrobes')}
              />
            )}
            {profileView === 'manage-wardrobes' && (
              <ManageWardrobesView onBack={() => setProfileView('settings')} />
            )}
          </>
        ) : activePage === 'fitting-room' ? (
          <FittingRoom items={items} />
        ) : activePage === 'stats' ? (
          <StatisticsView
            currentWardrobeItems={items}
            currentWardrobeId={currentWardrobeId}
            currentWardrobeName={currentWardrobeName}
            wardrobes={wardrobes}
            userId={user!.uid}
            onFilterCategory={handleStatsFilterCategory}
            onFilterColor={handleStatsFilterColor}
            onFilterBrand={handleStatsFilterBrand}
            onNavigateToWardrobe={() => setActivePage('wardrobe')}
          />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />

      {/* Floating Action Button - Only visible on Wardrobe page */}
      {activePage === 'wardrobe' && (
        <Button
          onClick={() => setShowAddDialog(true)}
          className="fixed bottom-24 right-4 sm:right-6 h-12 px-6 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-40 flex items-center gap-2 font-semibold"
        >
          <Plus className="h-5 w-5" />
          <span>Add item</span>
        </Button>
      )}

      <ClothingDetailsDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onEdit={(item) => {
          setEditingItem(item);
          setSelectedItem(null);
        }}
        onDelete={deleteItem}
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
