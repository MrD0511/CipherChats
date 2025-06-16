import { ArrowLeft, Copy, Plus, Check, Cross, Trash, X, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import Key from "../../interfaces/Keys";
import axiosInstance from "../../axiosInstance";
import { set } from "date-fns";

const KeysPage = ({onCreateChannel}
    : {
    onCreateChannel: () => void;
    }
) => {


    const [keys, setKeys] = useState<Key[]>([]);    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState<string>("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        const fetchKeys = async () => {
            try{
                const response = await axiosInstance.get('/get_keys');
                console.log("Fetched keys:", response.data.keys);
                setKeys(response.data.keys);
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
            setKeys(keys.map(key => 
                key._id === editingId ? { ...key, note: editNote } : key
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
                setKeys(keys.filter(key => key._id !== key_id));
            } else {
                console.error("Failed to delete key:", response.data.message);
            }
        }catch (error) {
            console.error("Error deleting key:", error);
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

                        {keys.map((key) => (
                        <div key={key.key} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 ml-4 mr-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="mb-4">
                                        {editingId === key._id ? 
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
                                                <p className="text-gray-300 font-bold text-xl pl-1">{key.note}</p>

                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        className=" px-3 py-1 rounded-md"
                                                        onClick={() => {
                                                            setEditingId(key._id);
                                                            setEditNote(key.note);
                                                        }}
                                                    >
                                                        <PencilLine size={20} className="text-gray-300 hover:text-gray-200" />
                                                    </button>
                                                    <button className="text-gray-300 rounded-md" onClick={() => {
                                                        deleteKey(key._id);
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
                                                {key.key}
                                            </code>
                                            <button
                                                onClick={() => handleCopyKey(key)}
                                                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 text-sm"
                                                title="Copy full key"
                                            >
                                                <Copy className="w-4 h-4" />
                                                {copiedKey === key._id ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                        <p className="text-gray-300 text-sm pl-1">Created on: {render_date(key.created_at)}</p>
                                    </div>
                                </div>
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