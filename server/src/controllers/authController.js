import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  token: generateToken(user._id),
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(userResponse(user));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json(userResponse(user));
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (name) req.user.name = name;
  if (address) req.user.address = address;
  const saved = await req.user.save();
  res.json(saved);
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const genericMessage = 'If an account exists for this email, a password reset link has been sent.';

  const user = await User.findOne({ email });

  if (!user) {
    // Do not reveal that the email does not exist
    return res.json({ message: genericMessage });
  }

  // Generate a cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store only the hash in the database
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  // Build reset URL with the RAW token
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  const html = `
    <h2>Password Reset</h2>
    <p>You requested a password reset for your ShopSphere account.</p>
    <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'ShopSphere - Password Reset', html });
  } catch {
    // If email fails, clear the token so the user can try again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Failed to send reset email. Please try again later.');
  }

  res.json({ message: genericMessage });
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    res.status(400);
    throw new Error('Password and confirm password are required');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the token from the URL to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Update password (pre-save hook will hash it)
  user.password = password;

  // Invalidate reset token (single-use)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ message: 'Password has been reset successfully' });
});

