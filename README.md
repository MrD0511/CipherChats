# 🔐 CipherChats – End-to-End Encrypted Chat App

**CipherChats** is a privacy-first, real-time chat application built using **React**, **FastAPI**, **WebSockets**, and **IndexedDB**, with **end-to-end encryption** and **secure file sharing**.  
It ensures that **only intended users can read messages or access shared files**, and the server acts only as a **messaging relay and temporary file host** — never storing unencrypted content.

---

## 🚀 Features

- 🔑 **End-to-End Encrypted Messaging**  
  - Public/Private key exchange per conversation  
  - Client-side message encryption and decryption  
  - Messages unreadable to server

- 🧩 **Secure Real-Time Chat**  
  - Built with WebSockets for fast delivery  
  - Supports multiple concurrent users with ordered message queuing

- ☁️ **Encrypted File Sharing**  
  - Files uploaded to a secure cloud storage  
  - Link encrypted client-side before sending  
  - Download only after recipient decrypts

- 🔐 **Client-Side Message Storage**  
  - IndexedDB used to store messages locally  
  - Messages purged on logout for privacy  
  - No message history is retained on server

- 🧠 **Session Management**  
  - Google login integration  
  - Session-based route protection  
  - Auto-redirect to sign-in on session expiration

---

## 🛠️ Tech Stack

| Frontend           | Backend        | Storage       | Security             |
|--------------------|----------------|---------------|----------------------|
| React + Vite       | FastAPI (Python) | MongoDB        | AES / asymmetric keys |
| TypeScript         | WebSockets     | IndexedDB (Dexie.js) | JWT / HTTPS enforced |

---

## 🧪 Try It Locally

### 1. Clone the repo
```bash
git clone https://github.com/MrD0511/CipherChats.git
cd CipherChats
```
---
# 🔐 CipherChats

**End-to-End Encrypted Real-Time Messaging Platform**

A secure, privacy-first chat application where your conversations remain truly private. Built with modern web technologies and client-side encryption to ensure your messages never leave your device unencrypted.

![CipherChats Banner](https://via.placeholder.com/800x200/6366f1/ffffff?text=CipherChats+-+Secure+Messaging)

## ✨ Features

### 🔒 **Privacy & Security First**
- **Client-side encryption** - Messages encrypted in your browser before transmission
- **Zero-knowledge architecture** - Server never sees your decrypted messages
- **Ephemeral sessions** - Message data cleared on logout
- **No persistent logs** - Your conversations aren't stored permanently

### 💬 **Rich Messaging Experience**
- Real-time messaging with WebSocket connections
- File sharing (images, videos, audio, documents)
- Responsive design for all devices

### 🔐 **Advanced Encryption**
- End-to-end encryption using modern cryptographic standards
- Secure key generation and management
- Encrypted file links and metadata
- Private keys never leave your device

### 🚀 **Modern Tech Stack**
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI (Python), WebSockets
- **Database**: MongoDB
- **Authentication**: Google OAuth integration

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- MongoDB instance
- Google OAuth credentials

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cipherchats.git
cd cipherchats
```

### 2. Set up Environment Variables

**Frontend (.env)**
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000

# Firebase Configuration
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_firebase_measurement_id
```

**Backend (.env)**
```env
MONGO_URL=your_mongo_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAY=1
```

### 3. Install and Run

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

Visit `http://localhost:5173` to access the application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │     Server      │    │   Client B      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Encrypt    │ │───▶│ │   Relay     │ │───▶│ │  Decrypt    │ │
│ │  Message    │ │    │ │  Message    │ │    │ │  Message    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ Private Keys    │    │  No Access to   │    │ Private Keys    │
│ Stay Local      │    │  Plain Text     │    │ Stay Local      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛡️ Security & Privacy

### Core Security Principles

- **🔑 Client-Side Encryption**: All messages are encrypted in your browser before being sent
- **🚫 Zero Server Knowledge**: The server only relays encrypted data and never has access to your private keys
- **🔒 Encrypted File Sharing**: File links and metadata are encrypted before transmission
- **🧹 Data Minimization**: Message data is cleared on logout with no persistent server-side logs
- **🔐 Secure Authentication**: Google OAuth integration for secure user authentication

### Privacy Features

- **No Message Persistence**: Your conversations aren't stored permanently on servers
- **Ephemeral Sessions**: All encryption keys and message data are cleared when you log out
- **Anonymous Communication**: Focus on message content, not user tracking
- **Local Key Management**: Encryption keys are generated and stored locally

## 📁 Project Structure

```
cipherchats/
chatapp/
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── config/           # Firebase and app configurations
│   │   ├── db/               # Database connection logic
│   │   ├── models/           # Pydantic and DB models
│   │   ├── routes/           # API endpoints (auth, chat, files)
│   │   ├── services/         # Business logic
│   │   └── websocket/        # Real-time WebSocket handlers
│   └── Dockerfile            # Backend container config
│
├── frontend/                 # React + Vite + TypeScript frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── dialogs/          # UI dialogs (create/join chat, profile)
│   │   ├── interfaces/       # TypeScript interfaces (Message, etc.)
│   │   ├── pages/            # All page views
│   │   └── services/         # Encryption, IndexDB, Firebase, WebSocket
│   └── Dockerfile            # Frontend container config
│
├── README.md                 # Project documentation
└── LICENSE                   # MIT License

```

## 🔧 Development

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn app:app --reload
```

## 💡 Why CipherChats?

Modern messaging apps often claim to be secure but still store significant amounts of data on their servers. **CipherChats flips this architecture**:

🔄 **The server relays; your browser owns the keys and the data.**

### Perfect For:
- **Privacy-focused communication** - When you need guaranteed message privacy
- **Anonymous conversations** - Sensitive discussions that require confidentiality  
- **Developer learning** - Understanding encryption and real-time systems
- **Security-conscious users** - Those who want control over their data

### Key Differentiators:
- **True Zero-Knowledge**: Server literally cannot decrypt your messages
- **Client-Side Everything**: Encryption, decryption, and key management happen in your browser
- **Minimal Data Retention**: No permanent message logs or metadata storage
- **Open Source**: Fully auditable codebase for security verification

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Author

**Dhruv Sharma**
- 🔗 [LinkedIn](https://linkedin.com/in/dhruvsharma005)
- 🐙 [GitHub](https://github.com/MrD0511)
- ✉️ [Email](mailto:sharmadhruv00005@gmail.com)

## 🌟 Support

If you find CipherChats useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 🤝 Contributing to the codebase

---

**Built with ❤️ for privacy and security**

*Remember: In a world where data is the new oil, CipherChats ensures you own your refinery.*