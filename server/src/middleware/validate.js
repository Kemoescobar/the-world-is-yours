/**
 * Valide req.body avec un schéma Zod. Remplace req.body par les données parsées (allowlist).
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'données invalides',
        details: parsed.error.flatten(),
      });
    }
    req.body = parsed.data;
    next();
  };
}
