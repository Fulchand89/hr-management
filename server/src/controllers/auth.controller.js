const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, {
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // Optional: Set refresh token as httpOnly cookie for web clients
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.refreshTokens(token);

    return ApiResponse.success(res, {
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password request
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    return ApiResponse.success(res, {
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return ApiResponse.success(res, {
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getProfile = async (req, res) => {
  return ApiResponse.success(res, {
    message: 'Profile retrieved successfully',
    data: { user: req.user.toSafeJSON() }
  });
};

/**
 * Update authenticated user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const allowedFields = ['firstName', 'lastName', 'phone', 'designation'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: { user: user.toSafeJSON() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change authenticated user password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    return ApiResponse.success(res, {
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken');

    return ApiResponse.success(res, {
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
