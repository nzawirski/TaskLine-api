module.exports = {
    port: process.env.PORT || 3001,
    databaseUrl: process.env.MONGODB_URI || 'mongodb://localhost/taskline',
    secretKey: process.env.JWT_SECRET || 't45kl1n3'
  };
