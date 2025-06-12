
interface Message {
    message_id: string;
    channel_id: string;
    sender_id: string;
    recipient_id: string;
    type: "system" | "message" | "e2ee_status";
    sub_type?: "enable" | "disable";
    message: string;
    message_type: "text" | "image" | "file" | "video" | "audio" | "";
    file_name?: string;
    file_size?: number;
    file_url?: string;
    timestamp: string;
    status?: "sent" | "delivered" | "read";
    file_exp?: string;
}

interface sendingMessage {
    message_id: string;
    channel_id: string;
    sender_id: string;
    recipient_id: string;
    type: "message" | "system" | "e2ee_status";
    sub_type?: "enable" | "disable";
    message: string;
    message_type: "text" | "image" | "file" | "video" | "audio" | "";
    file_name?: string;
    file_url?: string;
    timestamp: string;
    file_size?: number;
    file_exp?: string;
}

export type { Message, sendingMessage };