import { Router } from 'express';
import * as oauthController from './oauth.controller';
import passport from '../../utils/passport';

const router = Router();

router.get(
  '/google',
  (req, res, next) => {
    const redirectUri = req.query.state as string;
  passport.authenticate('google', { scope: ['profile', 'email'], state: redirectUri
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthController.googleOAuthCallback
);
router.post('/link-provider', oauthController.linkProvider);
router.post('/unlink-provider', oauthController.unLinkProvider);

export default router;