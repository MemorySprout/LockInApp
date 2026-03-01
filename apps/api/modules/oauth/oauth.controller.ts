import { Request, Response } from 'express';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { User } from '../../models/user.model';

export const googleOAuthCallback = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        if (!user) return res.status(400).json({ message: 'No user from Google' });

        const payload = { userId: user._id.toString(), email: user.email };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        user.refreshToken = refreshToken;
        user.lastLoginAt = new Date();
        await user.save();
        
        const redirectUri = (req.query.state as string) || 
                            process.env.FRONTEND_URL || 
                            'http://localhost:3000';

        res.redirect(
            `${redirectUri}?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`
        );
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//@Sorrger to ważne żeby nie robić duplikatow kont jak ktos sie loguje na localu a potem przez googla
export const linkProvider = async (req: Request, res: Response) => {
    try{
        const provider = req.body.provider;
        const user = await User.findById(req.user?.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.providers.includes(provider)) {
            user.providers.push(provider);
            await user.save();
        }
        res.json({ message: 'Provider linked successfully', providers: user.providers });
    }catch(err){
        console.error('Error linking provider:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const unLinkProvider = async (req: Request, res: Response) => {
    try{
        const provider = req.body.provider;
        const user = await User.findById(req.user?.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.providers = user.providers.filter(p => p !== provider);
        await user.save();
        res.json({ message: 'Provider unlinked successfully', providers: user.providers });
    }catch(err){
        console.error('Error unlinking provider:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};