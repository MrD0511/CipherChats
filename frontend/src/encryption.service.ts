import { db } from "./indexdb.service"; 
import axiosInstance from "./axiosInstance";
import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from "./e2eeManager";

class encryptionService{

    partner_id: string;
    channel_id: string;
    isE2ee: boolean;
    partner_public_key: CryptoKey | null = null;
    user_private_key: CryptoKey | null = null;

    constructor(partner_id: string, channel_id: string){
        this.partner_id = partner_id;
        this.channel_id = channel_id;
        this.isE2ee = false; // default value, will be set in initialize
    }

    async initialize(){

        try {
            const e2eeStatus = await db.isE2ee.get(this.channel_id);
            this.isE2ee = !!(e2eeStatus && e2eeStatus.isActive);

            const connectionKeys = await get_connection_keys(this.channel_id, this.partner_id);
            if (connectionKeys) {
                this.partner_public_key = connectionKeys.partnerPublicKey;
                this.user_private_key = connectionKeys.privateKey;
            } else {
                let new_connection = await create_new_connection(this.channel_id);
                this.user_private_key = new_connection;
            }
        } catch (error) {
            console.error("Error initializing encryption:", error);
        }
    }

    async encryptMessage(message: string){
        if (!this.isE2ee) return message;
        if (!this.partner_public_key) {
            console.error("Encryption error: partner_public_key is null");
            return message;
        }
        try {
            const encryptedMessage = await encrypt_message(this.partner_public_key, message);
            return encryptedMessage
        } catch (error) {
            console.error("Encryption error:", error);
            return message;
        }
    }

    async decryptMessage(message: string){
        if (!this.isE2ee) return message;
        if (!this.user_private_key) {
            console.error("Decryption error: user_private_key is null");
            return message;
        }
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

    async toggleE2ee(isE2ee: boolean){
        this.isE2ee = isE2ee;
        await db.isE2ee.update(this.channel_id, { isActive: isE2ee });
    }
}

export default encryptionService;
