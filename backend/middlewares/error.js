module.exports = (err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    // only show stack trace in dev
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
