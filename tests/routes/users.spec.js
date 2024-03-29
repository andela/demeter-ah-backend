import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { transporter } from '../../utils/mailer';
import { app, db } from '../../server';
import { createUser, createTestFakeUsers } from '../helpers';
import * as utils from '../../utils';

let mockUploadImage;
const { expect } = chai;
let mockTransporter;

chai.use(chaiHttp);
let register = {};
let login = {};
let user;
describe('USER AUTHENTICATION', () => {
  beforeEach(async () => {
    mockTransporter = sinon.stub(transporter, 'sendMail').resolves({});
    register = {
      firstName: 'vincent',
      lastName: 'hamza',
      username: 'kev',
      password: '12345678',
      email: 'frank@gmail.com',
      role: 'admin'
    };

    user = await createUser(register);

    login = {
      password: '12345678',
      email: 'frank@gmail.com',
    };
  });

  afterEach(async () => {
    await db.User.destroy({ truncate: true, cascade: true });
    mockTransporter.restore();
  });

  describe('Sign up', () => {
    it('should sign up user if info is valid', async () => {
      const res = await chai.request(app).post('/api/v1/users/signup').send({
        ...register,
        email: 'john@havens.com',
        username: 'kav'
      });
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
      expect(res.body.user.firstName).to.include(register.firstName);
      expect(res.body.user.lastName).to.include(register.lastName);
      expect(res.body.user.username).to.include('kav');
      expect(res.body.user.email).to.include('john@havens.com');
    });

    it('Should not signup user with invalid data', async () => {
      const res = await chai.request(app).post('/api/v1/users/signup').send({
        ...register,
        firstName: 9999,
        email: 'frank.john',
        username: 'jill'
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object');
      expect(res.body.message[0].message).to.equal(
        'Only letters allowed as firstName'
      );
      expect(res.body.message[1].message).to.equal(
        'The value provided is not an email'
      );
    });

    it('Should not signup user with already existing email', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/users/signup')
        .send({ ...register, username: 'lolu' });
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object');
      expect(res.body.message[0].message).to.equal('email already existed');
    });

    it('Should not signup user with already username', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/users/signup')
        .send({ ...register, email: 'lolu@gmail.com' });
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object');
      expect(res.body.message[0].message).to.equal('username already existed');
    });
  });

  describe('Log in', () => {
    it('should not login user if info is invalid', async () => {
      login.password = '1234567';
      const res = await chai
        .request(app)
        .post('/api/v1/users/login')
        .send(login);
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('error');
      expect(res.body.error).to.be.a('string');
      expect(res.body.error).to.include('Invalid email or password');
    });

    it('should login user if info is valid', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/users/login')
        .send(login);
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
      expect(res.body.user).to.include.all.keys(
        'token',
        'id',
        'firstName',
        'lastName',
        'username'
      );
      expect(res.body.user.email).to.include(login.email);
    });

    it('Should not login user with invalid data', async () => {
      const res = await chai.request(app).post('/api/v1/users/login').send({
        ...login,
        email: 'frank.john',
      });
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object');
      expect(res.body.message[0].message).to.equal(
        'The value provided is not an email'
      );
    });

    it('Should not login user if not registered', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/users/login')
        .send({
          ...login,
          email: 'frank.john@gmail.com',
        });
      expect(res.body).to.be.an('object');
      expect(res.body.error).to.include('Invalid email or password');
    });
  });

  describe('UPDATE USER PROFILE || PUT api/v1/users', () => {
    afterEach(() => {
      mockUploadImage.restore();
    });
    it('should update user profile image', async () => {
      mockUploadImage = sinon.stub(utils, 'uploadImage')
        .callsFake(() => new Promise(resolve => resolve('//temp/up.jpg')));
      const { token } = user.response();
      const res = await chai
        .request(app)
        .put('/api/v1/users')
        .field('Content-Type', 'multipart/form-data')
        .attach('image', `${__dirname}/test.jpg`)
        .set('x-access-token', token);
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
      expect(res.body.user.image).to.include('//temp/up.jpg');
    });
    it('should not update if no field is provided for update', async () => {
      const { token } = user.response();
      const res = await chai
        .request(app)
        .put('/api/v1/users/')
        .set('x-access-token', token)
        .send({});
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
    });
    it('Only current authenticated user should be able to update profile', async () => {
      const { token } = user.response();
      const res = await chai
        .request(app)
        .put('/api/v1/users/')
        .set('x-access-token', token)
        .send({ username: 'john' });
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
      expect(res.body.user.username).to.include('john');
    });
  });

  describe('Sign Out', () => {
    it('should sign user out', async () => {
      const { token } = user.response();
      const res = await chai
        .request(app)
        .post('/api/v1/users/signout')
        .set('x-access-token', token)
        .send(login);
      expect(res.body).to.be.an('object');
      expect(res.status).to.equal(200);
    });
  });
  describe('PASSWORD RESET', () => {
    beforeEach(async () => {
      await db.User.destroy({ truncate: true, cascade: true });
    });

    it('should send reset password link for an existing user', async () => {
      await db.User.create(register);

      const res = await chai
        .request(app)
        .post('/api/v1/users/reset-password')
        .send({ email: register.email });
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(200);
      expect(res.body).to.include.all.keys('message');
      expect(res.body.message).to.be.a('string');
      expect(res.body.message).to.include(
        'Password reset successful. Check your email for password reset link!'
      );
    });
    it('should not send a reset password link for a user that does not exist', async () => {
      await db.User.create(register);
      const res = await chai
        .request(app)
        .post('/api/v1/users/reset-password')
        .send({ email: 'wrong@gmail.com' });
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(400);
      expect(res.body).to.include.all.keys('message');
      expect(res.body.message).to.be.a('string');
      expect(res.body.message).to.include('User does not exist');
    });

    it('should not send a reset password on a wrong email format', async () => {
      await db.User.create(register);
      const res = await chai
        .request(app)
        .post('/api/v1/users/reset-password')
        .send({ email: 'wrong@' });
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(400);
      expect(res.body).to.include.all.keys('message');
      expect(res.body.message[0].message).to.equal(
        'The value provided is not an email'
      );
      expect(res.body.message[0].field).to.equal('email');
    });
  });
  describe('PASSWORD CHANGE', () => {
    it('should not change the password on invalid token', async () => {
      const date = new Date();
      date.setHours(date.getHours() + 2);
      await db.User.create({
        ...register,
        passwordResetToken: 'sample-test-token',
        passwordResetExpire: date,
        email: 'kelvinese@gmail.com',
        username: 'kel',
      });
      const res = await chai
        .request(app)
        .put('/api/v1/users/change-password?resetToken=wrong-test-token')
        .send({ password: '12345678' });
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(401);
      expect(res.body).to.include.all.keys('error');
      expect(res.body.error).to.be.a('string');
      expect(res.body.error).to.include('Invalid operation');
    });
    it('should change the password on valid token', async () => {
      const date = new Date();
      date.setHours(date.getHours() + 2);
      await db.User.create({
        ...register,
        email: 'kelvin@gmail.com',
        passwordResetToken: 'sample-test-token',
        passwordResetExpire: date,
        username: 'ken',
      });
      const res = await chai
        .request(app)
        .put('/api/v1/users/change-password?resetToken=sample-test-token')
        .send({ password: '12345678' });
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(200);
      expect(res.body).to.include.all.keys('message');
      expect(res.body.message).to.be.a('string');
      expect(res.body.message).to.include(
        'Password has successfully been changed.'
      );
    });

    it('should not change the password on an empty field with wrong resetToken', async () => {
      const date = new Date();
      date.setHours(date.getHours() + 2);
      await db.User.create({
        ...register,
        email: 'kelvin',
        passwordResetToken: 'sample-test-token',
        passwordResetExpire: date,
        username: 'kes',
      });
      const res = await chai
        .request(app)
        .put('/api/v1/users/change-password')
        .send({});
      expect(res.body).to.be.an('object');
      expect(res).to.have.status(400);
      expect(res.body).to.include.all.keys('message');
      expect(res.body.message[0].message).to.equal('Input your password');
      expect(res.body.message[0].field).to.equal('password');
      expect(res.body.message[1].message).to.equal('Input your resetToken');
      expect(res.body.message[1].field).to.equal('resetToken');
    });
  });
  describe('Signup Email Activation', () => {
    it('should activate verification mail', async () => {
      const newUser = await db.User.create({
        ...register,
        email: 'vinay@yahoo.com',
        username: 'vel',
      });
      const activationString = newUser.emailVerificationToken;
      const res = await chai
        .request(app)
        .put(`/api/v1/users/activate/${activationString}`)
        .send();
      expect(res).to.have.status(200);
      expect(res.body.user).to.be.an('object');
      expect(res.body.message).to.be.a('string');
      expect(res.body).to.include.all.keys('user', 'message');
      expect(res.body.user.firstName).to.include(register.firstName);
      expect(res.body.user.lastName).to.include(register.lastName);
      expect(res.body.user.username).to.include('vel');
      expect(res.body.user.email).to.include('vinay@yahoo.com');
      expect(res.body.message).to.include(
        'Activation successful, You can now login'
      );
    });
    it('should not activate user if token is wrong', async () => {
      register.emailActivationToken = 'wrongtoken';
      const res = await chai
        .request(app)
        .put(`/api/v1/users/activate/${register.emailActivationToken}`)
        .send();
      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.include.all.keys('error');
      expect(res.body.error).to.be.a('string');
      expect(res.body.error).to.include('Invalid activation Link');
    });
  });

  describe('Get all Users', () => {
    beforeEach(async () => {
      try {
        await createTestFakeUsers();
      } catch (e) {
        console.log(e.message);
      }
    });

    it('should get all first 20 users', async () => {
      const { token } = user.response();
      const res = await chai
        .request(app)
        .get('/api/v1/users')
        .set('x-access-token', token);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.users).to.be.an('array');
      expect(res.body.users).to.have.length(20);
    });

    it('should get all second 10 users', async () => {
      const { token } = user.response();
      const res = await chai
        .request(app)
        .get('/api/v1/users?limit=10&offset=1')
        .set('x-access-token', token);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.users).to.be.an('array');
      expect(res.body.users).to.have.length(10);
    });
  });

  describe('Admin Create, Update and Delete User', () => {
    let userToken;
    beforeEach(async () => {
      const { token } = user.response();
      userToken = token;
    });

    describe('Admin create user', () => {
      it('Should create a user by admin', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/users')
          .set('x-access-token', userToken)
          .send({
            ...register, email: 'newuser@havens.com', username: 'newuser'
          });
        expect(res.status).to.equal(201);
        expect(res.body).to.be.an('object');
        expect(res.body.user.firstName).to.include(register.firstName);
        expect(res.body.user.lastName).to.include(register.lastName);
        expect(res.body.user.username).to.include('newuser');
        expect(res.body.user.email).to.include('newuser@havens.com');
      });

      it('Should not create a user with invalid data', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/users')
          .set('x-access-token', userToken)
          .send({
            ...register,
            firstName: 9999,
            email: 'frank.john',
            username: 'jill'
          });

        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object');
        expect(res.body.message[0].message).to.equal(
          'Only letters allowed as firstName'
        );
        expect(res.body.message[1].message).to.equal(
          'The value provided is not an email'
        );
      });

      it('Should not create a user with already existing email', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/users')
          .set('x-access-token', userToken)
          .send({ ...register, username: 'lolu' });
        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object');
        expect(res.body.message[0].message).to.equal('email already existed');
      });

      it('Should create user with already existing username', async () => {
        const res = await chai
          .request(app)
          .post('/api/v1/users')
          .set('x-access-token', userToken)
          .send({ ...register, email: 'lolu@gmail.com' });
        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object');
        expect(res.body.message[0].message).to.equal('username already existed');
      });
    });

    describe('Admin update a user', () => {
      afterEach(() => {
        mockUploadImage.restore();
      });

      it('should update user profile image', async () => {
        mockUploadImage = sinon.stub(utils, 'uploadImage')
          .callsFake(() => new Promise(resolve => resolve('//temp/up.jpg')));
        const { username } = user.response();

        const res = await chai
          .request(app)
          .put(`/api/v1/users/${username}`)
          .field('Content-Type', 'multipart/form-data')
          .attach('image', `${__dirname}/test.jpg`)
          .set('x-access-token', userToken);
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('user');
        expect(res.body.user).to.be.an('object');
        expect(res.body.user.image).to.include('//temp/up.jpg');
      });

      it('should update with previous data when no field is provided', async () => {
        const { username } = user.response();

        const res = await chai
          .request(app)
          .put(`/api/v1/users/${username}`)
          .set('x-access-token', userToken)
          .send({});
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('user');
        expect(res.body.user).to.be.an('object');
      });

      it('Should update user profile by admin when new information is passed', async () => {
        const { username } = user.response();

        const res = await chai
          .request(app)
          .put(`/api/v1/users/${username}`)
          .set('x-access-token', userToken)
          .send({ username: 'john' });
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('user');
        expect(res.body.user).to.be.an('object');
        expect(res.body.user.username).to.include('john');
      });

      it('should not update user if not exist', async () => {
        const { username } = user.response();

        const res = await chai
          .request(app)
          .delete(`/api/v1/users/${username}-1234`)
          .set('x-access-token', userToken)
          .send({});
        expect(res.status).to.equal(404);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('error');
        expect(res.body.error).to.equal('User does not exist');
      });
    });

    describe('Admin delete a user', () => {
      it('should delete user if user exist', async () => {
        const { username } = user.response();

        const res = await chai
          .request(app)
          .delete(`/api/v1/users/${username}`)
          .set('x-access-token', userToken);
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('message');
        expect(res.body.message).to.equal('User profile deactivated successfully');
      });

      it('should not delete user if not exist', async () => {
        const { username } = user.response();

        const res = await chai
          .request(app)
          .delete(`/api/v1/users/${username}-1234`)
          .set('x-access-token', userToken);
        expect(res.status).to.equal(404);
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.key('error');
        expect(res.body.error).to.equal('User does not exist');
      });
    });
  });
});
