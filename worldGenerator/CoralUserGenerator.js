'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const log = require('./../server/log');

export class CoralUserGenerator {
  constructor (conn, number, startLocationId) {
    this.conn = conn;
    this.name = 'coral';
    this.number = number;

    this.user = {
      x: 0,
      y: 0,
      direction: 'up',
      login: undefined,
      location: startLocationId,
      online: false};
  }

  generate () {
    rethinkDB
      .tableCreate('userPosition')
      .run(this.conn, (err) => {
        if (err) throw err;

        let login;

        for (let i = 0; i < this.number; i++) {
          this.user.login = `${this.name}${i}`;

          log.info(`Create test user ${this.user.login}`);

          rethinkDB
            .table('userPosition')
            .insert(this.user)
            .run(this.conn, (err) => {
              if (err) {
                // maybe need a hack for ReqlOpFailedError
                log.error(`Data for ${login} isn't inserted.`);
                throw err;
              }
            });
        }
      });
  }
}

