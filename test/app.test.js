// test manually and locally: "npm test" or "npm run test" from the project root -> automatic with github actions
// (if it doesn't work on windows, install mocha globally: "npm install -g mocha")
// chai doc: https://www.chaijs.com/
// to ensure that it also reads tests elsewhere write in package.json: " mocha './**/*.test.js' " for example

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app/index');
let should = chai.should();

chai.use(chaiHttp);

describe('Status Server', () => {

  describe('/GET status_server', () => {
    it('it should GET the state of the current server', (done) => {
        chai.request(server)
        .get('/status_server')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object', 'It is not a string because it responds with res.send(). This message appears if this test fails');
            done();
        });
    });
  });

});

      