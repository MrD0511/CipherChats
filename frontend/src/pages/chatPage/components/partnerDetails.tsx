// PartnerDetails.tsx
import { useState, useEffect } from 'react';
import axiosInstance from '../../../axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import EllipsisButton from './dropown';
import { useWebSocket } from '../../../websocketContext';

interface SenderDetails {
  profile_photo_url?: string;
  username?: string;
  name?: string;
}

interface PartnerDetailsProps {
  userId: string;
  channel_id: string;
  onChannel_id: (channelId: string) => void;
  addE2eeStatus: (status: 'enable' | 'disable') => void;
}

const PartnerDetails: React.FC<PartnerDetailsProps> = ({
  userId,
  channel_id,
  onChannel_id,
  addE2eeStatus,
}) => {
  const [senderDetails, setSenderDetails] = useState<SenderDetails | null>(null);
  const navigate = useNavigate();
  const { activeChannel } = useWebSocket();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosInstance.get(`/chat/get_chat/${userId}`);
        const { sender_details, channel_id } = res.data;
        setSenderDetails(sender_details);
        onChannel_id(channel_id);
        activeChannel.current = channel_id;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          navigate('/404notFound');
        } else console.error('Error fetching partner details:', err);
      }
    };
    if (userId) fetchDetails();
  }, [userId, onChannel_id, navigate, activeChannel]);

  return (
    <div className="flex items-center justify-between bg-gray-900 border-b border-[#3f3f5f] p-3 gap-2">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-gray-300">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        {senderDetails?.profile_photo_url ? (
          <img
            src={senderDetails.profile_photo_url}
            alt={senderDetails.username || 'User'}
            className="w-10 h-10 rounded-full border border-violet-700 p-[2px] object-cover"
          />
        ) : (
          <User className="w-10 h-10 rounded-full border border-violet-700 p-[2px] text-gray-300" />
        )}
        <span className="font-semibold text-lg text-gray-300">
          {senderDetails?.name || 'Unknown'}
        </span>
      </div>
      <div className="options md:block">
        <EllipsisButton
          userId={userId}
          addStatus={(status) => addE2eeStatus(status)}
          channel_id={channel_id}
        />
      </div>
    </div>
  );
};

export default PartnerDetails;
