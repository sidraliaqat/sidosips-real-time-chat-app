const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.register({ name, email, password });
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to sidosips!',
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, message: 'Current user', data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
