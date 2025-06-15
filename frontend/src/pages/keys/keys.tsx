import { ArrowLeft, Copy, Plus, Check, Cross, Trash, X, PencilLine } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import Key from "../../interfaces/Keys";

const KeysPage = () => {


    const [keys, setKeys] = useState<Key[]>([
        {
            _id: "1",
            key: "sk-proj-fjhjhd87jhsjf8h3jk4h5j6k7l8m9n0p1q2r3s4t5u6v7w8x9y0z",
            note: "This is for maharshi",
            created: "2023-10-01",
            channel_id: "channel_1"
        },
        {
            _id: "2",
            key: "sk-proj-9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z",
            note: "Production API key", 
            created: "2023-09-15",
            channel_id: "channel_2"
        }
    ]);    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState<string>("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);


    const handleCopyKey = (key: Key) => {
        navigator.clipboard.writeText(key.key);
        setCopiedKey(key._id);
        setTimeout(() => setCopiedKey(null), 2000); // Reset after 2 seconds
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
                        <button className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-md hover:bg-gradient-to-l flex gap-2 items-center">
                            <Plus className="w-4 h-4 inline-block mr-1" /> Generate New Key
                        </button>
                    </div>
                </div>

                <div className="pt-4 px-4">
                    <p className="text-gray-300 text-xl">Here you can manage your keys.</p>
                </div>

                <div className="p-4">
                    <div className="mt-2 flex flex-col gap-4">
                        {keys.map((key) => (
                        <div key={key.key} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200">
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
                                                <button className="text-gray-300 bg-green-600 hover:bg-green-700 p-2 rounded-full ml-2">
                                                    <Check size={24} />
                                                </button>
                                                <button className="text-gray-300 bg-red-600 hover:bg-red-700 p-2 rounded-full ml-2" onClick={() => setEditingId(null)}>
                                                    <X size={24} />
                                                </button>
                                            </div>
                                             : 
                                            <div className="flex items-center justify-between">
                                                <p className="text-gray-300 font-bold text-md">{key.note}</p>

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
                                                        setKeys(keys.filter(k => k._id !== key._id));
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
                                                {copiedKey === key.id ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                        <p className="text-gray-300 text-sm">Created on: {key.created}</p>
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