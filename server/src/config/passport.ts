import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { env } from './env';
import { UserModel } from '../models/User';
import { ensureUserCompanions, updateLoginStreak } from '../modules/auth/auth.service';
import logger from '../utils/logger';

export const initializePassport = () => {
  // Only configure Google strategy if credentials are present
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth credentials not configured — Google login disabled');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // 1. Try to find user by googleId
          let user = await UserModel.findOne({ googleId: profile.id });

          if (user) {
            // Existing Google user — update login streak
            updateLoginStreak(user);
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }

          // 2. Try to find user by email (account linking)
          user = await UserModel.findOne({ email });

          if (user) {
            // Link the Google account to the existing local account
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            updateLoginStreak(user);
            await user.save({ validateBeforeSave: false });
            logger.info({ email }, 'Linked Google account to existing user');
            return done(null, user);
          }

          // 3. Create a brand new user
          const newUser = await UserModel.create({
            name: profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            authProvider: 'google',
            avatar: profile.photos?.[0]?.value
          });

          await ensureUserCompanions(newUser.id);
          logger.info({ email }, 'Created new user via Google OAuth');
          return done(null, newUser);
        } catch (error) {
          logger.error({ err: error }, 'Google OAuth strategy error');
          return done(error as Error, undefined);
        }
      }
    )
  );

  logger.info('Google OAuth strategy configured');
};

export default passport;
