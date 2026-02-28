import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  providers: string[];
  refreshToken?: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    providers: { type: [String], default: [] },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);