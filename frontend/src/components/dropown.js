import React, { useState } from 'react';
import { 
  EllipsisVertical, 
  Lock,
  Unlock,
  Settings, 
  Share2, 
  Trash2 
} from 'lucide-react';

const EllipsisButton = ({toggleE2ee, isE2ee}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ellipsis-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const actions = [
    {
      label: 'End-to-End Encryption',
      icon: isE2ee ? <Lock /> : <Unlock />,
      renderContent: () => (
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            {isE2ee ? (
              <Lock className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <Unlock className="mr-2 h-4 w-4 text-gray-600" />
            )}
            <span>End-to-End Encryption</span>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isE2ee}
              onChange={()=>{
                  toggleE2ee()
                  console.log(isE2ee)
                }
              }
            />
            <div className={`relative w-11 h-6 bg-gray-200 rounded-full 
              peer dark:bg-gray-700 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all 
              ${isE2ee ? 'bg-green-600' : ''}`}>
            </div>
          </label>
        </div>
      )
    },
    {
      label: 'Settings',
      icon: <Settings />,
      onClick: () => console.log('Open Settings')
    },
    {
      label: 'Share',
      icon: <Share2 />,
      onClick: () => console.log('Share')
    },
    {
      label: 'Delete',
      icon: <Trash2 />,
      onClick: () => console.log('Delete')
    }
  ];

  return (
    <div className="relative ellipsis-container">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-1 hover:bg-gray-700 focus:outline-none"
        aria-label="More options"
      >
        <EllipsisVertical className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white border rounded-md shadow-lg z-10"
          style={{
            top: '100%',
            right: 0
          }}
        >
          {actions.map((action, index) => (
            <div 
              key={index}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {action.renderContent ? (
                action.renderContent()
              ) : (
                <button 
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full"
                >
                  {action.icon && React.cloneElement(action.icon, { 
                    className: 'mr-2 h-4 w-4 text-gray-600' 
                  })}
                  {action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EllipsisButton;