import Sequelize from 'sequelize';
import db from '../../db/models';
import {
  blackListThisToken, randomString, hashPassword, uploadImage
} from '../../utils';
import { sendMail } from '../../utils/mailer';
import { resetPasswordMessage } from '../../utils/mailer/mails';

export default {
  signUp: async (req, res) => {
    const {
      firstName, lastName, password, email, username
    } = req.body;
    try {
      const user = await db.User.create({
        firstName,
        lastName,
        password,
        email,
        username
      });
      return res.status(201).json({
        message: 'User Registration successful',
        user: user.response()
      });
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  },

  logIn: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.User.findOne({
        where: { email }
      });
      if (!user) {
        return res.status(400).send({
          error: 'Invalid email or password'
        });
      }
      const isPasswordValid = await user.passwordsMatch(password);
      if (!isPasswordValid) {
        return res.status(400).send({
          error: 'Invalid email or password'
        });
      }
      return res.status(200).json({
        message: 'User Login in successful',
        user: user.response()
      });
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const image = req.files
        ? await uploadImage(req.files.image, `${req.user.username}-profileImg`)
        : req.user.image;

      const user = await req.user.update(
        {
          username: req.body.username || req.user.username,
          firstName: req.body.firstName || req.user.firstName,
          lastName: req.body.lastName || req.user.lastName,
          image,
          bio: req.body.bio || req.user.bio
        }
      );
      res.status(200).json({
        message: 'User profile successfully updated',
        user: user.response()
      });
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  },

  signOut: async (req, res) => {
    const token = req.headers['x-access-token'];
    await blackListThisToken(token);
    return res.status(200).send({
      message: 'Signed out successfully'
    });
  },
  resetPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await db.User.findOne({ where: { email } });
      if (user) {
        const passwordResetToken = randomString();
        const date = new Date();
        date.setHours(date.getHours() + 2);
        await user.update({ passwordResetToken, passwordResetExpire: date });
        await sendMail({
          email: user.email,
          subject: 'Password Reset LInk',
          content: resetPasswordMessage(user.email, passwordResetToken)
        });

        return res.status(200).json({
          message: 'Password reset successful. Check your email for password reset link!'
        });
      }

      return res.status(400).json({
        message: 'User does not exist'
      });
    } catch (err) {
      /* istanbul ignore next */
      return res.status(400).json({
        message: 'Something went wrong'
      });
    }
  },

  activate: async (req, res) => {
    try {
      const user = await db.User.findOne({
        where: { emailVerificationToken: req.params.token, activated: false }
      });
      if (user) {
        await user.update({ activated: true, emailVerificationToken: null });
        return res.status(200).json({
          message: 'Activation successful, You can now login',
          user: user.response()
        });
      }
      return res.status(400).json({
        error: 'Invalid activation Link'
      });
    } catch (e) {
      /* istanbul ignore next */
      return res.status(400).json({
        message: 'Bad request'
      });
    }
  },

  changePassword: async (req, res) => {
    const { password } = req.body;
    const { Op } = Sequelize;

    const passwordHash = await hashPassword(password);

    const { resetToken } = req.query;
    try {
      const user = await db.User.findOne({
        where: {
          passwordResetToken: resetToken,
          passwordResetExpire: {
            [Op.gt]: new Date()
          }
        }
      });
      if (user) {
        user.update({
          password: passwordHash,
          resetToken: null,
          resetExpire: null
        });
        return res.status(200).json({
          message: 'Password has successfully been changed.'
        });
      }
      return res.status(401).json({
        error: 'Invalid operation'
      });
    } catch (err) {
      /* istanbul ignore next */
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  },

  home: async (req, res) => res.status(200).send({
    user: req.user
  }),

  changeEmailNotification: async (req, res) => {
    const { user } = req;
    const notifyMe = user.emailNotify;
    const result = await user.update({
      emailNotify: !notifyMe,
    });

    return res.status(200).send({
      user: result
    });
  },

  changeInAppNotification: async (req, res) => {
    const { user } = req;
    const notifyMe = user.inAppNotify;
    const result = await user.update({
      inAppNotify: !notifyMe,
    });

    return res.status(200).send({
      user: result
    });
  },

  getNotifications: async (req, res) => {
    const { id } = req.user;

    const notifications = await db.Notification.findAll({
      where: {
        receiverId: id,
      }
    });

    return res.status(200).send({
      notifications
    });
  },

  readNotification: async (req, res) => {
    const { id } = req.user;

    const notifyId = req.params.id;
    let notification = await db.Notification.findOne({
      where: {
        receiverId: id,
        id: notifyId,
      }
    });
    if (notification) {
      const { seen } = notification;
      if (!seen) {
        notification = await notification.update({
          seen: true
        });
      }
      return res.status(200).send({
        notification
      });
    }
    return res.status(404).send({
      error: 'Notification not Found'
    });
  },

  getUsers: async (req, res) => {
    try {
      const { query } = req;
      const limit = query.limit || 20;
      const offset = query.offset ? (query.offset * limit) : 0;

      const users = await db.User.findAndCountAll({
        offset,
        limit,
        attributes: ['username', 'firstName', 'lastName', 'image']
      });
      return res.status(200).json({
        users: users.rows,
        usersCount: users.count
      });
    } catch (e) {
      return res.status(500).json({
        message: 'Something went wrong',
        error: e.message,
      });
    }
  }
};
