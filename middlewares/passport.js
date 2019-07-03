import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import db from '../db/models';

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACk,
      profileFields: ['id', 'displayName', 'photos', 'emails', 'name']
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const lastName = profile.name.familyName.toLocaleLowerCase();
      const firstName = profile.name.givenName.toLocaleLowerCase();
      const username = profile.displayName.replace(/ /g, '_').toLocaleLowerCase();
      const image = profile.photos[0].value;

      const exist = await db.User.findOne({
        where: { email }
      });

      if (!exist) {
        const user = await db.User.create({
          email,
          firstName,
          lastName,
          username,
          social: true,
          image
        });
        return done(null, user.response());
      }
      return done(null, exist.response());
    }
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACk,
      includeEmail: true
    },
    async (token, tokenSecret, profile, done) => {
      const { username } = profile;
      let { displayName } = profile;
      const image = profile.photos[0].value;
      const email = profile.emails[0].value.toLocaleLowerCase();
      displayName = displayName.split(' ');
      const firstName = displayName[0].toLocaleLowerCase();
      const lastName = displayName[1].toLocaleLowerCase();

      const exist = await db.User.findOne({
        where: { email }
      });

      if (!exist) {
        const user = await db.User.create({
          email,
          firstName,
          lastName,
          username,
          social: true,
          image
        });
        return done(null, user.response());
      }
      return done(null, exist.response());
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
