'use strict';

process.env.NODE_ENV = 'test';

const assert = require('chai').assert;
const { suite, test } = require('mocha');
const bcrypt = require('bcrypt');
const request = require('supertest');
const knex = require('../knex');
const server = require('../server');
const { addDatabaseHooks } = require('./utils')

suite('register', addDatabaseHooks(() => {
  test('POST /register', (done) => {
    const password = 'psychology';

    request(server)
      .post('/register')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        firstName: 'Carl',
        lastName: 'Jung',
        email: 'cgjung@gmail.com',
        password
      })
      .expect((res) => {
        delete res.body.createdAt;
        delete res.body.updatedAt;
      })
      .expect(200, `Thanks for registering Carl! You are now able to log in to your account`)
      .expect('Content-Type', /json/)
      .end((httpErr, _res) => {
        if (httpErr) {
          return done(httpErr);
        }

        knex('users')
          .where('id', 4)
          .first()
          .then((user) => {
            const hashedPassword = user.hashed_password;

            delete user.hashed_password;
            delete user.created_at;
            delete user.updated_at;

            assert.deepEqual(user, {
              id: 4,
              first_name: 'Carl',
              last_name: 'Jung',
              email: 'cgjung@gmail.com'
            });

            // eslint-disable-next-line no-sync
            const isMatch = bcrypt.compareSync(password, hashedPassword);

            assert.isTrue(isMatch, "passwords don't match");
            done();
          })
          .catch((dbErr) => {
            done(dbErr);
          });
      });
  });

    test('POST /register with no email', (done) => {
    request(server)
      .post('/register')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        firstName: 'Carl',
        lastName: 'Jung',
        password
      })
      .expect('Content-Type', /json/)
      .expect(400, 'Email must not be blank', done);
  });

  test('POST /register with no password', (done) => {
    request(server)
      .post('/register')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        firstName: 'Carl',
        lastName: 'Jung',
        email: 'cgjung@gmail.com'
      })
      .expect('Content-Type', /json/)
      .expect(400, 'Password must not be blank', done);
  });

  test('POST /register with existing email', (done) => {
    /* eslint-disable no-sync */
    knex('users')
      .insert({
        first_name: 'Carl',
        last_name: 'Jung',
        email: 'cgjung@gmail.com',
        hashed_password: bcrypt.hashSync('psychology', 1)
      })
      .then(() => {
        request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({
            firstName: 'Carl',
            lastName: 'Jung',
            email: 'cgjung@gmail.com',
            password: 'psychology'
          })
          .expect('Content-Type', /plain/)
          .expect(400, 'Our records indicate a user with this email already exists', done);
      })
      .catch((err) => {
        done(err);
      });

  });

  //test for no first or last name?
}));
