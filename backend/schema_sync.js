const db = require('./config/db');

db.ready
  .then(() => {
    console.log('schema-ready');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
