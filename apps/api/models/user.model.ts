import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  providers: string[];
  refreshToken?: string;
  isVerified: boolean;
  lastLoginAt?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    passwordHash: { type: String, default: null}, //need to be null due to google auth users @Sorrger
    providers: { type: [String], default: ['local'] },
    refreshToken: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);