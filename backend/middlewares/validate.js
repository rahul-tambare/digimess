module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    console.log(`[VALIDATION ERROR] ${req.method} ${req.url}:`, error.details[0].message, 'Data:', req.body);
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
