import { useState } from 'react';
import { ArrowLeft, User, Lock, Shield, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalInfoDialog } from './PersonalInfoDialog';
import { ManageWardrobesView } from './ManageWardrobesView';

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [showPersonalInfoDialog, setShowPersonalInfoDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showWardrobesView, setShowWardrobesView] = useState(false);

  const settingsSections = [
    {
      id: 'personal-info',
      icon: User,
      title: 'Personal Information',
      description: 'Edit name, username, DOB, location, and sizes',
      onClick: () => setShowPersonalInfoDialog(true),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'security',
      icon: Lock,
      title: 'Account & Security',
      description: 'Change your password',
      onClick: () => setShowPasswordDialog(true),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy Settings',
      description: 'Control who can follow you and see your profile',
      onClick: () => setShowPrivacyDialog(true),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'wardrobes',
      icon: FolderOpen,
      title: 'Manage Wardrobes',
      description: 'Create, edit, and delete your wardrobes',
      onClick: () => setShowWardrobesView(true),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // If showing wardrobes view, render that instead
  if (showWardrobesView) {
    return <ManageWardrobesView onBack={() => setShowWardrobesView(false)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Profile
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={section.onClick}
              className="w-full bg-white rounded-lg shadow hover:shadow-md transition-all p-6 text-left group"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`${section.bgColor} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${section.color}`} />
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Text */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Your data is securely stored and encrypted</p>
      </div>

      {/* Dialogs */}
      {showPersonalInfoDialog && (
        <PersonalInfoDialog
          open={showPersonalInfoDialog}
          onOpenChange={setShowPersonalInfoDialog}
        />
      )}

      {/* Password Dialog - Placeholder for now */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <p className="text-gray-600 mb-4">Password change functionality coming soon...</p>
            <Button onClick={() => setShowPasswordDialog(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Privacy Dialog - Placeholder for now */}
      {showPrivacyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
            <p className="text-gray-600 mb-4">Privacy settings functionality coming soon...</p>
            <Button onClick={() => setShowPrivacyDialog(false)}>Close</Button>
          </div>
        </div>
      )}

    </div>
  );
}
