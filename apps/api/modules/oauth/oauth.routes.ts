import { Router } from 'express';
import * as oauthController from './oauth.controller';
import passport from '../../utils/passport';
import session from 'express-session';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

const router = Router();

router.get(
  '/google',
  (req, res, next) => {
    req.session.redirect_uri = req.query.redirect_uri;
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthController.googleOAuthCallback
);
router.post('/link-provider', oauthController.linkProvider);
router.post('/unlink-provider', oauthController.unLinkProvider);

export default router;