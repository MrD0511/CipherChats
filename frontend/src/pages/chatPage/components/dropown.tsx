import React, { useEffect, useState } from 'react';
import {
  EllipsisVertical,
  Lock,
  Unlock,
  Trash2
} from 'lucide-react';
import { useWebSocket } from '../../../websocketContext';
import axiosInstance from '../../../axiosInstance';

const Dropdown = ({ userId, channel_id, addStatus }
  : {
    userId: string;
    channel_id: string;
    addStatus: (status: "enable" | "disable") => void;
  }
) => {
  const [isOpen, setIsOpen] = useState(false);
  const { enable_e2ee, disable_e2ee } = useWebSocket()
  const [isE2ee, setIsE2ee] = useState(false)
  const { messageEmmiter } = useWebSocket()


  useEffect(()=>{
    const get_e2ee_status = async () => {
      await axiosInstance.get(`/get_e2ee_status/${userId}`).then((response) => {
        setIsE2ee(response.data.isE2ee)
      }).catch((e)=>{
        console.log("error getting e2ee status : ", e)
      })
    }

    messageEmmiter.on('onE2eeToggle', (data: any)=>{
      if(data.type === "e2eeEvent"){
        setIsE2ee(data.status)
      }
    })

    get_e2ee_status();

    return () => {
      messageEmmiter.off('onE2eeToggle', (data: any)=>{
        if(data.event === "e2eeEvent"){
          setIsE2ee(data.status)
        }
      });
  };
  },[userId, setIsE2ee, messageEmmiter])



  useEffect(() => {
      // console.log("Updated isE2ee:", isE2ee);
  }, [isE2ee]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
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
              <Lock className="mr-2 h-4 w-4 text-accent-color" />
            ) : (
              <Unlock className="mr-2 h-4 w-4 text-gray-400" />
            )}
            <span className="text-gray-200">End-to-End Encryption</span>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isE2ee}
              onChange={(event) => {
                setIsE2ee(event.target.checked)
                if (event.target.checked) {
                  enable_e2ee(userId, channel_id)
                  addStatus("enable")
                } else {
                  disable_e2ee(userId, channel_id)
                  addStatus("disable")
                }
              }}
            />
            <div
              className={`relative w-11 h-6 rounded-full bg-gray-700 peer-checked:bg-accent-color
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
              peer-checked:after:translate-x-full`}
            ></div>
          </label>
        </div>
      )
    },
    {
      label: 'Delete Chat',
      icon: <Trash2 />,
      onClick: () => console.log('Delete')
    }
  ];

  return (
    <div className="relative ellipsis-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 bg-background-light hover:bg-secondary-color focus:outline-none"
        aria-label="More options"
      >
        <EllipsisVertical className="h-5 w-5 text-gray-400" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-background-light text-text-color rounded-lg shadow-lg z-10 border border-border-color"
          style={{
            top: '100%',
            right: 0
          }}
        >
          {actions.map((action, index) => (
            <div
              key={index}
              className="w-full text-left px-4 py-2 hover:bg-secondary-color"
            >
              {action.renderContent ? (
                action.renderContent()
              ) : (
                <button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full text-gray-200"
                >
                  {action.icon && React.cloneElement(action.icon, {
                    className: 'mr-2 h-4 w-4 text-gray-400'
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

export default Dropdown;
