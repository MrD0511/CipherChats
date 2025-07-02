import { ArrowLeft, Copy, Plus, Check, Trash, X, PencilLine, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Key, Request }from "../../interfaces/Keys";
import axiosInstance from "../../axiosInstance";
import { set } from "date-fns";

interface KeysData {
    key: Key,
    requests: Request[]
}

interface approvedRequest {
    channel_id: string,
    user_id: string,
    username: string;
    profile_photo_url: string;
}

const KeysPage = ({onCreateChannel}
    : {
    onCreateChannel: () => void;
    }
) => {

    const [keysData, setKeysData] = useState<KeysData[]>([]);    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState<string>("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [openRequests, setOpenRequests] = useState<string | null>(null);
    const [approvedRequests, setApprovedRequests] = useState<approvedRequest[]>([])
    const navigate = useNavigate();

    useEffect(() => {
        const fetchKeys = async () => {
            try{
                const response = await axiosInstance.get('/get_keys_data');
                console.log("Fetched keys:", response.data.keys_data);
                setKeysData(response.data.keys_data);
            }catch (error) {
                console.error("Error fetching keys:", error);
            }
        }

        fetchKeys();
    }, []);

    const handleCopyKey = (key: Key) => {
        navigator.clipboard.writeText(key.key);
        setCopiedKey(key._id);
        setTimeout(() => setCopiedKey(null), 2000); // Reset after 2 seconds
    }

    const render_date = (dateString: string) => {
        const date = new Date(dateString);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        const getOrdinal = (n: number) => {
            if (n > 3 && n < 21) return 'th';
            switch (n % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        return `${day}${getOrdinal(day)} ${month} ${year}`;
    }

    const onEditNoteChange = async () => {

        const response = await axiosInstance.post('/edit_key_note', {
            key_id: editingId,
            note: editNote
        });

        if (response.data.success) {
            setKeysData(keysData.map(keyData => 
                keyData.key._id === editingId ? { ...keyData, key: { ...keyData.key, note: editNote } } : keyData
            ));
            setEditingId(null);
            setEditNote("");
        } else {
            console.error("Failed to update note:", response.data.message);
        }
    }

    const deleteKey = async (key_id: string) => {
        try{
            const response = await axiosInstance.delete(`/delete_key/${key_id}`);

            if (response.data.success) {
                setKeysData(keysData.filter(keyData => keyData.key._id !== key_id));
            } else {
                console.error("Failed to delete key:", response.data.message);
            }
        }catch (error) {
            console.error("Error deleting key:", error);
        }
    }

    const approve_request = async (key_id: string, req: Request) => {
        try {
            const response = await axiosInstance.patch(`/approve-request/${req._id}`);

            if (response.data.success) {
                setKeysData(keysData.map(keyData => 
                    keyData.key._id === key_id ? { ...keyData, requests: keyData.requests.filter(req => req._id !== req._id) } : keyData
                ));
                setApprovedRequests([...approvedRequests, {
                    channel_id: key_id,
                    user_id: req.user_id,
                    username: req.user_data.username,
                    profile_photo_url: req.user_data.profile_photo_url
                }])
            } else {
                console.error("Failed to approve request:", response.data.message);
            }
        } catch (error) {
            console.error("Error approving request:", error);
        }
    }

    const reject_request = async (key_id: string, request_id: string) => {
        try{
            const response = await axiosInstance.delete(`/reject-request/${request_id}`);

            if (response.data.success) {
                setKeysData(keysData.map(keyData => 
                    keyData.key._id === key_id ? { ...keyData, requests: keyData.requests.filter(req => req._id !== request_id) } : keyData
                ));
            } else {
                console.error("Failed to reject request:", response.data.message);
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    }

    return (
        <> 
            <div className="bg-gray-950 min-h-screen w-full">
                <div className="flex items-center bg-gray-900 border-b border-gray-700 p-3 justify-between">
                    <div className=" flex items-center gap-2">
                        <Link to="/" className="text-gray-300 cursor-pointer">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-gray-200 font-bold text-xl">Your Keys</h1>
                    </div>
                    <div>
                        <button className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 
                                            rounded-md hover:bg-gradient-to-l flex gap-2 items-center"
                            onClick={() => {
                                onCreateChannel();
                            }}>
                            <Plus className="w-4 h-4 inline-block mr-1" /> Generate New Key
                        </button>
                    </div>
                </div>

                <div className="pt-8 px-4 pb-4">
                    <p className="text-gray-400 text-xl">Here you can manage your keys.</p>
                </div>
                
                <div className="pb-8">
                    <div className="mt-2 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-11rem)]
                        scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-700 
                        hover:scrollbar-thumb-gray-600 scrollbar-corner-gray-900
                        scroll-smooth w-full"
                            
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgb(17, 24, 39) rgb(3, 7, 18)'
                        }}>

                        <div>
                            {approvedRequests.map((approvedRequest: approvedRequest) =>(
                                <div key={approvedRequest.channel_id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 ml-4 mr-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={approvedRequest.profile_photo_url} alt={approvedRequest.username}
                                                className="w-8 h-8 rounded-full" />
                                            <span className="text-gray-300 font-semibold">{approvedRequest.username}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="text-gray-200 hover:text-gray-300 border border-gray-500 p-2 rounded-md"
                                                onClick={() => {
                                                    // Handle accept request logic here
                                                    console.log(`Accepted request from ${approvedRequest.username}`);
                                                    console.log(`/chats/${approvedRequest.user_id}`)
                                                    navigate(`/chats/${approvedRequest.user_id}`)
                                                }}>
                                                Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {keysData.map((keyData) => (
                            <div key={keyData.key.key} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 ml-4 mr-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-4">
                                            {editingId === keyData.key._id ? 
                                                <div className="flex items-center justify-between">
                                                    <input type="text" 
                                                        value={editNote}
                                                        onChange={(e) => setEditNote(e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
                                                        placeholder="Edit note"
                                                    />
                                                    <button className="text-gray-300 bg-green-600 hover:bg-green-700 p-2 rounded-full ml-2"
                                                        onClick={() => onEditNoteChange()}>
                                                        <Check size={24} />
                                                    </button>
                                                    <button className="text-gray-300 bg-red-600 hover:bg-red-700 p-2 rounded-full ml-2" onClick={() => setEditingId(null)}>
                                                        <X size={24} />
                                                    </button>
                                                </div>
                                                : 
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-300 font-bold text-xl pl-1">{keyData.key.note}</p>

                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            className=" px-3 py-1 rounded-md"
                                                            onClick={() => {
                                                                setEditingId(keyData.key._id);
                                                                setEditNote(keyData.key.note);
                                                            }}
                                                        >
                                                            <PencilLine size={20} className="text-gray-300 hover:text-gray-200" />
                                                        </button>
                                                        <button className="text-gray-300 rounded-md" onClick={() => {
                                                            deleteKey(keyData.key._id);
                                                            // Optionally, you can also make an API call to delete the key from the server
                                                        }}>
                                                            <Trash size={20} className="text-gray-300 hover:text-gray-200" />
                                                        </button>
                                                    </div>
                                                </div>
                                            }
                                        </div>

                                        {/* key and copy button */}
                                        <div>
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-600 rounded-lg p-3 max-w-xl w-full">
                                                <code className="text-gray-300 font-mono text-sm flex-1 truncate">
                                                    {keyData.key.key}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyKey(keyData.key)}
                                                    className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 text-sm"
                                                    title="Copy full key"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    {copiedKey === keyData.key._id ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>

                                            <p className="text-gray-300 text-sm pl-1">Created on: {render_date(keyData.key.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-gray-300 mb-2">
                                        Requests
                                        {openRequests === keyData.key._id ? 
                                            <button
                                                onClick={() => setOpenRequests(openRequests === keyData.key._id ? null : keyData.key._id)}
                                                className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
                                                title="Collapse requests"
                                            >
                                                <ChevronUp className="w-4 h-4 inline-block ml-2" size={16} />
                                            </button>
                                            :
                                            <button
                                                onClick={() => setOpenRequests(openRequests === keyData.key._id ? null : keyData.key._id)}
                                                className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
                                                title="Expand requests"
                                            >
                                                <ChevronDown className="w-4 h-4 inline-block ml-2" size={16} />
                                            </button>
                                        }
                                    </div>
                                    {openRequests === keyData.key._id && (
                                        keyData.requests.length > 0 ? (
                                            keyData.requests.map((request) => (
                                                <div key={request._id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <img src={request.user_data.profile_photo_url} alt={request.user_data.username}
                                                                className="w-8 h-8 rounded-full" />
                                                            <span className="text-gray-300 font-semibold">{request.user_data.username}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button className="text-green-500 hover:text-green-400"
                                                                onClick={() => {
                                                                    // Handle accept request logic here
                                                                    console.log(`Accepted request from ${request.user_data.username}`);
                                                                    approve_request(keyData.key._id, request);
                                                                }}>
                                                                <Check className="w-6 h-6" size={16} />
                                                            </button>
                                                            <button className="text-red-500 hover:text-red-400"
                                                                onClick={() => {
                                                                    // Handle reject request logic here
                                                                    console.log(`Rejected request from ${request.user_data.username}`);
                                                                    reject_request(keyData.key._id, request._id);
                                                                }}>
                                                                <X className="w-6 h-6" size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-400 text-sm">No requests found.</div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default KeysPage;