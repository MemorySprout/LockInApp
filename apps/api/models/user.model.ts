import mongoose, { Document, Schema } from 'mongoose'; 
import btcrypt from 'bcrypt';


export interface IUser extends Document {
    email: string;
    password: string;
    providers: string[];
    refreshToken?: string;
    comparePassword(password: string): Promise<boolean>;
}


const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    providers: { type: [String], default: [] },
    refreshToken: { type: String }
}, { timestamps: true });


UserSchema.methods.comporePassword = async function (password: string): Promise<boolean> {
    return btcrypt.compare(password, this.password);
}


export const User = mongoose.model<IUser>('User', UserSchema);