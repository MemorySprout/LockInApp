import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email from Google'));
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            username: profile.displayName,
            providers: ['google'],
            isVerified: true,
          });
        } else if (!user.providers.includes('google')) {
          user.providers.push('google');
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await User.findById(userId);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;