import { Router } from 'express';
import * as oauthController from './oauth.controller';
import passport from '../../utils/passport';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthController.googleOAuthCallback
);
router.post('/link-provider', oauthController.linkProvider);
router.post('/unlink-provider', oauthController.unLinkProvider);