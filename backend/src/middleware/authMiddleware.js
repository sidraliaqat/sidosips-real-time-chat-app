const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

/**
 * Protects REST routes. Expects: Authorization: Bearer <token>
 * On success, attaches the authenticated (safe) user to req.user.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide a Bearer token.',
        errors: [],
      });
    }

    const token = header.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication token.';
      return res.status(401).json({ success: false, message, errors: [] });
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.', errors: [] });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profile_image,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
