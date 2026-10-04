export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    // message is what the client shows, errors has every field
    const message = errors.map((e) => e.message).join(', ');
    return res.status(400).json({ message, errors });
  }

  next();
};
