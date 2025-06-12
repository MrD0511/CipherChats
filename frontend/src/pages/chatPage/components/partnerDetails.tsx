
// PartnerDetails Component
import { useState, useEffect } from 'react';
import '../chatPage.scss';
import axiosInstance from "../../../axiosInstance";
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowLeft} from 'lucide-react';
import EllipsisButton from './dropown';
import { useWebSocket } from '../../../websocketContext';

type SenderDetails = {
    profile_photo_url?: string;
    username?: string;
    name?: string;
    // add other fields if needed
};

export default function PartnerDetails({ userId, onChannel_id, addE2eeStatus }
    : {
        userId: string;
        onChannel_id: (channelId: string) => void;
        addE2eeStatus: (status: string) => void;
    }
)  {
    const [senderDetails, setSenderDetails] = useState<SenderDetails | null>(null);
    const navigate = useNavigate();
    const { activeChannel } = useWebSocket();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                await axiosInstance.get(`/chat/get_chat/${userId}`).then((response)=>{
                    setSenderDetails(response.data?.sender_details);
                    onChannel_id(response.data?.channel_id);
                    activeChannel.current = response.data?.channel_id;
                }).catch((e)=>{
                    if (e.status === 404) navigate("/404notFound");
                });
            } catch (e) {
                console.log(e);
            }
        };
        if (userId) fetchDetails();
    }, [userId, onChannel_id, navigate, activeChannel ]);

    return (
        <div className='sender'>
            <div className='details'>
                <Link to='/' className='back-button'><ArrowLeft /></Link>
                {senderDetails?.profile_photo_url ? <img src={senderDetails?.profile_photo_url} alt={senderDetails.username} /> : <User className="user-icon" />}
                <span>{senderDetails?.name}</span>
            </div>
            <div className='options'>
                <EllipsisButton addStatus={ (status) => { addE2eeStatus(status) } } userId={userId} />
            </div>
        </div>
    );
};