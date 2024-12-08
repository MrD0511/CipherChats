import { db } from "./indexdb.service"; 
import axiosInstance from "./axiosInstance";
import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from "./e2eeManager";

class encryptionService{

    constructor(partner_id, channel_id){
        this.partner_id = partner_id;
        this.channel_id = channel_id;
        this.isE2ee = db.isE2ee.get(channel_id);
        this.partner_public_key = null;
        this.user_private_key = null;
    }

    async initialize(){
        try {
            const connectionKeys = await get_connection_keys(this.channel_id, this.partner_id);
            if (connectionKeys) {
                this.partner_public_key = connectionKeys.partnerPublicKey;
                this.user_private_key = connectionKeys.privateKey;
            } else {
                this.user_private_key = await create_new_connection(this.channel_id);
            }
        } catch (error) {
            console.error("Error initializing encryption:", error);
        }
    }

    async encryptMessage(message){
        if (!this.isE2ee) return message;
        try {
            const encryptedMessage = await encrypt_message(this.partner_public_key, message);
            return encryptedMessage
        } catch (error) {
            console.error("Encryption error:", error);
            return message;
        }
    }

    async decryptMessage(message){
        if (!this.isE2ee) return message;
        try {
            return await decrypt_message(this.user_private_key, message);
        } catch (error) {
            console.error("Decryption error:", error);
            return message;
        }
    }

    async enableE2ee(){
        try {
            await axiosInstance.patch(`/enable_e2ee/${this.channel_id}`, { isE2ee: true }).then((response)=>{
                this.isE2ee = true;
            });
        } catch (error) {
            console.error("Error enabling E2EE:", error);
        }
    }

    async disableE2ee(){
        try{
            await axiosInstance.patch(`/enable_e2ee/${this.channel_id}`, { isE2ee: false }).then((response)=>{
                this.isE2ee = false;
            });
        }catch(error){
            console.error("Error disabling E2EE:", error);
        }        
    }

    async toggleE2ee(isE2ee){
        this.isE2ee = isE2ee;
        await db.isE2ee.update(this.channel_id, { isActive: isE2ee });
    }
}

export default encryptionService;
