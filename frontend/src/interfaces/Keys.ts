interface Key {
    _id: string;
    key: string;
    note: string;
    created_at: string;
    channel_id: string;
}

interface Request {
    _id: string;
    user_id: string;
    user_data: {
        username: string;
        profile_photo_url: string;
    }
}

export {
    Key,
    Request
};