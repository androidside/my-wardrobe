import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddClothingForm } from './components/AddClothingForm';
import { WardrobeGallery } from './components/WardrobeGallery';
import { MyProfile } from './components/MyProfile';
import { ClothingDetailsDialog } from './components/ClothingDetailsDialog';
import { EditClothingDialog } from './components/EditClothingDialog';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { useWardrobe } from './hooks/useWardrobe';
import { ClothingItem } from './types/clothing';
import './App.css';

function App() {
  const { items, loading, error, addItem, updateItem, deleteItem } = useWardrobe();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [activePage, setActivePage] = useState<'wardrobe' | 'profile'>('wardrobe');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [filterType, setFilterType] = useState<string | 'All'>('All');
  const [filterBrand, setFilterBrand] = useState<string | 'All'>('All');

  // Compute available filter options from items
  const types = Array.from(new Set(items.map((i) => i.type))).sort();
  const brands = Array.from(new Set(items.map((i) => i.brand))).filter(Boolean).sort();

  const filteredItems = items
    .filter((it) => (filterType === 'All' ? true : it.type === filterType))
    .filter((it) => (filterBrand === 'All' ? true : it.brand === filterBrand));

  const handleEdit = (item: ClothingItem) => {
    setEditingItem(item);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👔</div>
          <p className="text-gray-600">Loading your wardrobe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              {activePage === 'profile' ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 My Profile</h1>
                  <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👔 My Wardrobe</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}{' '}
                    {filterType !== 'All' && <span className="text-sm text-gray-500">— {filterType}</span>}
                    {filterBrand !== 'All' && <span className="text-sm text-gray-500"> — {filterBrand}</span>}
                    {filterType === 'All' && filterBrand === 'All' && (
                      <span className="text-sm text-gray-500">in your collection</span>
                    )}
                  </p>
                </>
              )}
            </div>

            {activePage === 'wardrobe' && (
              <div className="hidden sm:flex items-center gap-3 mr-4">
                <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Filter by type" />
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
                  <SelectTrigger className="w-44 h-9">
                    <SelectValue placeholder="Filter by brand" />
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
              </div>
            )}

            <div className="flex items-center gap-3">
              {activePage === 'profile' && (
                <button
                  className="text-sm text-indigo-600 hover:text-indigo-700 px-3 py-2 font-medium"
                  onClick={() => setActivePage('wardrobe')}
                >
                  ← Back
                </button>
              )}

              {activePage === 'wardrobe' && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add New Item</span>
                  <span className="sm:inline md:hidden">Add</span>
                </Button>
              )}

              <button
                type="button"
                className="text-sm text-indigo-600 hover:text-indigo-700 px-3 py-2 font-medium"
                onClick={() => setActivePage('profile')}
              >
                👤 My Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
        ) : null}
      </main>

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

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

export default App;
