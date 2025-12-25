import { Shirt, DoorOpen, User } from 'lucide-react';

interface BottomNavigationProps {
  activePage: 'wardrobe' | 'fitting-room' | 'profile';
  onNavigate: (page: 'wardrobe' | 'fitting-room' | 'profile') => void;
}

export function BottomNavigation({ activePage, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around h-16">
          {/* My Wardrobe */}
          <button
            onClick={() => onNavigate('wardrobe')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activePage === 'wardrobe'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shirt className={`h-6 w-6 sm:h-5 sm:w-5 ${activePage === 'wardrobe' ? 'text-indigo-600' : ''}`} />
            <span className="text-xs sm:text-sm font-medium mt-1">My Wardrobe</span>
            {activePage === 'wardrobe' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>

          {/* My Fitting Room (Placeholder) */}
          <button
            onClick={() => onNavigate('fitting-room')}
            disabled
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 cursor-not-allowed opacity-50"
            title="Coming soon"
          >
            <DoorOpen className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-medium mt-1">Fitting Room</span>
          </button>

          {/* My Profile */}
          <button
            onClick={() => onNavigate('profile')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activePage === 'profile'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className={`h-6 w-6 sm:h-5 sm:w-5 ${activePage === 'profile' ? 'text-indigo-600' : ''}`} />
            <span className="text-xs sm:text-sm font-medium mt-1">My Profile</span>
            {activePage === 'profile' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

