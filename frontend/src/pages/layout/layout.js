import React, {useState} from 'react'
import ChatPage from '../chatPage/chatPage.js';
import ChatsPage from '../chats/chatsPage.js';
import './layout.scss'
import Create_chat_dialog from '../../dialogs/create_chat/create_chat.js';
import JoinChatDialog from '../../dialogs/join_chat/join_chat.js';

const Layout = () => {

    const [selectedChat, setSelectedChat] = useState(null)
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isJoinDialogOpen, setJoinDialogOpen] = useState(false)

    const openCreateDialog = () => {
        setCreateDialogOpen(true);
    };

    const closeCreateDialog = () => {
        setCreateDialogOpen(false);
    };

    const openJoinDialog = () => {
        setJoinDialogOpen(true);
    }

    const closeJoinDialog = () => {
        setJoinDialogOpen(false);
    }

    return (
        <>
            <div className="chat-layout">
                <ChatsPage onSelectChat={setSelectedChat} className='chats' />
                <ChatPage user_id={selectedChat} onCreateChat={openCreateDialog} onJoinChat={openJoinDialog}  className='chatBox' />
            </div>
            <Create_chat_dialog
                isOpen={isCreateDialogOpen}
                onClose={closeCreateDialog}
            />

            <JoinChatDialog 
                isOpen={isJoinDialogOpen}
                onClose={closeJoinDialog}
                onJoin={setSelectedChat}
            />
        </>
    );
}

export default Layout;