import { Router } from 'express';
import * as oauthController from './oauth.controller';
import passport from '../../utils/passport';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get(
  '/google',
  (req, res, next) => {
    const redirectUri = req.query.redirect_uri as string || process.env.FRONTEND_URL || '';
    const state = Buffer.from(redirectUri).toString('base64');
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
  }
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthController.googleOAuthCallback
);
router.post('/link-provider', requireAuth, oauthController.linkProvider);
router.post('/unlink-provider', requireAuth, oauthController.unLinkProvider);

export default router;