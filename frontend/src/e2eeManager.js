import axiosInstance from "./axiosInstance"
import { db } from "./indexdb.service"

async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name : "RSA-OAEP",
            modulusLength : 2048,
            publicExponent : new Uint8Array([1, 0, 1]),
            hash : { name : "SHA-256" }
        },
        true,
        ["encrypt","decrypt"]
    )
    return keyPair
}

async function exportPublicKey(keyPair){
    const publicKey = await  window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    return btoa(String.fromCharCode(...new Uint8Array(publicKey)))
}

async function exportPrivateKey(keyPair){
    const privateKey = await  window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
    return btoa(String.fromCharCode(...new Uint8Array(privateKey)))
}

async function getPublicKey(channel_id, partner_id) {
    try{
        console.log(channel_id, partner_id)
        const response = await axiosInstance.post(`/chat/get_public_key`, {channel_id : channel_id, partner_id : partner_id})
        if(response.status === 200){
            return response.data.public_key
        }else{
            return null
        }        
    }catch(err){
        console.log(err)
        return Error(String(err))
    }
}

async function store_public_key(channel_id, public_key){
    try{
        const response = await axiosInstance.post("/chat/store_public_key", {"channel_id" : channel_id, "public_key": public_key})
        if(response.status === 200){
            return true
        }else{
            return false
        }
    }catch(err){
        console.log(err)
        return Error(String(err))
    }
}

async function create_new_connection(channel_id){
    const keyPair = await generateKeyPair()
    const privateKey = await exportPrivateKey(keyPair)
    await db.keys.put({channel_id, privateKey})
    const publicKey = await exportPublicKey(keyPair)
    await store_public_key(channel_id, publicKey).catch((err)=>{console.error(err)})
    return privateKey;
}

async function importPrivateKey(privateKeyString) {
    const binaryDer = Uint8Array.from(atob(privateKeyString), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}

async function importPublicKey(publicKeyString) {
    const binaryDer = Uint8Array.from(atob(publicKeyString), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
}


async function get_connection_keys(channel_id, partner_id){
    console.log("get_connection", channel_id, partner_id)
    let partnerPublicKey = await getPublicKey(channel_id, partner_id)
    let privateKey;
    if(channel_id){
        privateKey = await db.keys.get(channel_id)
        privateKey = privateKey.privateKey
    }else{
        privateKey = await create_new_connection(channel_id)
    }
    if(partnerPublicKey && privateKey){
        privateKey = await importPrivateKey(privateKey)
        partnerPublicKey = await importPublicKey(partnerPublicKey)
        return { partnerPublicKey, privateKey}
    }else{
        return null
    }
}

async function arrayBufferToBase64(buffer) {
    const binaryString = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binaryString);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const binaryLength = binaryString.length;
    const bytes = new Uint8Array(binaryLength);
    
    for (let i = 0; i < binaryLength; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
}

async function encrypt_message(public_key, message){
    const enc = new TextEncoder()
    const encodedMessage = enc.encode(message)

    const encryptedMessage = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        public_key,  // Recipient's public key
        encodedMessage
    );
    return arrayBufferToBase64(encryptedMessage)
}

async function decrypt_message(privateKey, encryptedMessage){
    let arrayBuffer = base64ToArrayBuffer(encryptedMessage)
    const decryptedMessage = await window.crypto.subtle.decrypt(
        {
            name : "RSA-OAEP"
        },
        privateKey,
        arrayBuffer
    )

    const enc = new TextDecoder()
    const message = enc.decode(decryptedMessage)
    
    return message
}

export { 
    get_connection_keys,
    create_new_connection,
    store_public_key,
    getPublicKey,
    encrypt_message,
    decrypt_message
}