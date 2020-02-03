const { createBenchmark, createConnection } = require('../common');

const { Request, TYPES } = require('../../lib/tedious');

const bench = createBenchmark(main, {
  n: [10],
  size: [
    1024 * 1024,
    10 * 1024 * 1024,
    50 * 1024 * 1024
  ]
});

function main({ n, size }) {
  createConnection(function(connection) {
    const request = new Request('CREATE TABLE #benchmark ([value] varbinary(max))', (err) => {
      if (err) {
        throw err;
      }

      const buf = Buffer.alloc(size);
      buf.fill('x');

      let i = 0;

      bench.start();

      (function cb() {
        const request = new Request('INSERT INTO #benchmark ([value]) VALUES (@value)', (err) => {
          if (err) {
            throw err;
          }

          if (i++ === n) {
            bench.end(n);

            connection.close();

            return;
          }

          cb();
        });

        request.addParameter('value', TYPES.VarBinary, buf);

        connection.execSql(request);
      })();
    });

    connection.execSqlBatch(request);
  });
}