import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useWardrobeContext } from '@/contexts/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateWardrobeShareableStatus } from '@/services/firestore';
import { CreateWardrobeDialog } from './CreateWardrobeDialog';
import { EditWardrobeDialog } from './EditWardrobeDialog';
import { DeleteWardrobeDialog } from './DeleteWardrobeDialog';

interface ManageWardrobesViewProps {
  onBack: () => void;
}

export function ManageWardrobesView({ onBack }: ManageWardrobesViewProps) {
  const { user } = useAuth();
  const { wardrobes, getItemCount, refresh } = useWardrobeContext();
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [updatingShareable, setUpdatingShareable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWardrobeId, setEditingWardrobeId] = useState<string | null>(null);
  const [deletingWardrobeId, setDeletingWardrobeId] = useState<string | null>(null);

  // Load item counts for all wardrobes
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const wardrobe of wardrobes) {
        counts[wardrobe.id] = await getItemCount(wardrobe.id);
      }
      setItemCounts(counts);
    };

    if (wardrobes.length > 0) {
      loadCounts();
    }
  }, [wardrobes, getItemCount]);

  const handleToggleShareable = async (wardrobeId: string, newValue: boolean) => {
    if (!user) return;

    try {
      setUpdatingShareable(wardrobeId);
      setError(null);
      await updateWardrobeShareableStatus(user.uid, wardrobeId, newValue);
      // Refresh wardrobes to get updated data
      await refresh();
    } catch (err) {
      console.error('Error updating shareable status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shareable status');
    } finally {
      setUpdatingShareable(null);
    }
  };

  const handleDialogClose = async () => {
    // Refresh wardrobes when dialogs close
    await refresh();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Manage Wardrobes</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create Button */}
      <Button
        className="w-full mb-6"
        size="lg"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        Create New Wardrobe
      </Button>

      {/* Wardrobes List */}
      {wardrobes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No wardrobes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first wardrobe to start organizing your clothing items
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Create Wardrobe
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {wardrobes.map((wardrobe) => (
            <div
              key={wardrobe.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              {/* Wardrobe Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {wardrobe.name}
                    </h3>
                    {wardrobe.isShareable && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Shared
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {itemCounts[wardrobe.id] || 0} {itemCounts[wardrobe.id] === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              {/* Shareable Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <Label htmlFor={`shareable-${wardrobe.id}`} className="text-sm font-medium text-gray-700">
                  Share with friends
                </Label>
                <Switch
                  id={`shareable-${wardrobe.id}`}
                  checked={wardrobe.isShareable ?? false}
                  onCheckedChange={(checked) => handleToggleShareable(wardrobe.id, checked)}
                  disabled={updatingShareable === wardrobe.id}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingWardrobeId(wardrobe.id)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Name
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeletingWardrobeId(wardrobe.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Shared wardrobes can be viewed by your friends</p>
      </div>

      {/* Dialogs */}
      <CreateWardrobeDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) handleDialogClose();
        }}
      />

      {editingWardrobeId && (
        <EditWardrobeDialog
          wardrobeId={editingWardrobeId}
          open={!!editingWardrobeId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingWardrobeId(null);
              handleDialogClose();
            }
          }}
        />
      )}

      {deletingWardrobeId && (
        <DeleteWardrobeDialog
          wardrobeId={deletingWardrobeId}
          open={!!deletingWardrobeId}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingWardrobeId(null);
              handleDialogClose();
            }
          }}
        />
      )}
    </div>
  );
}
