const chai = require('chai');
const supertest = require('supertest');

global.expect = chai.expect;
global.request = supertest;
