import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { User } from '../../models/user.model';

const VALID_PROVIDERS = ['google', 'local'] as const;

export const googleOAuthCallback = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        if (!user) return res.status(400).json({ message: 'No user from Google' });

        const payload = { userId: user._id.toString(), email: user.email };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        user.lastLoginAt = new Date();
        await user.save();
        
        let redirectUri: string;
        try {
            const state = req.query.state as string;
            redirectUri = state 
                ? Buffer.from(state, 'base64').toString('utf-8')
                : (process.env.FRONTEND_URL || 'http://localhost:3000');
        } catch (err) {
            redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';
        }
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        
        res.redirect(
            `${redirectUri}#accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`
        );
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const linkProvider = async (req: Request, res: Response) => {
    try{
        const provider = req.body.provider;
        if (typeof provider !== 'string' || !VALID_PROVIDERS.includes(provider as any)) {
            return res.status(400).json({ message: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` });
        }
        const user = await User.findById(req.user?.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.providers.includes(provider)) {
            user.providers.push(provider);
            await user.save();
        }
        res.json({ message: 'Provider linked successfully', providers: user.providers });
    }catch(err){
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const unLinkProvider = async (req: Request, res: Response) => {
    try{
        const provider = req.body.provider;
        if (typeof provider !== 'string' || !VALID_PROVIDERS.includes(provider as any)) {
            return res.status(400).json({ message: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` });
        }
        const user = await User.findById(req.user?.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.providers = user.providers.filter(p => p !== provider);
        await user.save();
        res.json({ message: 'Provider unlinked successfully', providers: user.providers });
    }catch(err){
        res.status(500).json({ message: 'Internal server error' });
    }
};