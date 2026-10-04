import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
  const startTime = performance.now();
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'ShopSphere - Password Reset Request',
        text: `You requested a password reset for your ShopSphere account.\n\nPlease click the link below or copy and paste it into your browser to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4ee; border-radius: 8px;">
            <h2 style="color: #5b3cc4;">ShopSphere Password Reset</h2>
            <p>You requested a password reset for your ShopSphere account.</p>
            <p>Please click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
            <div style="margin: 25px 0;">
              <a href="${resetUrl}" style="background-color: #5b3cc4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #6b6b80; font-size: 0.9em;">If you cannot click the button, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #5b3cc4; font-size: 0.9em;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #e4e4ee; margin: 20px 0;" />
            <p style="color: #6b6b80; font-size: 0.85em;">If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Password reset email failed:', err.message);
      await User.updateOne(
        { _id: user._id, resetPasswordToken: hashedToken },
        { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
      );
      res.status(500);
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  } else {
    // Perform symmetric cryptographic work to prevent CPU/computation profiling
    crypto.randomBytes(32);
    crypto.createHash('sha256').update('dummy-token-timing-mitigation').digest('hex');
  }

  // Enforce a bounded minimum response window (~60ms) to eliminate timing side-channel
  const MIN_RESPONSE_TIME_MS = 60;
  const elapsed = performance.now() - startTime;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_RESPONSE_TIME_MS - elapsed)));
  }

  res.status(200).json({
    message: 'If an account exists for this email, a password reset link has been sent.',
  });
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const password = req.body.password || req.body.newPassword;

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400);
    throw new Error('Password is required and must be at least 6 characters');
  }

  if (!token || typeof token !== 'string') {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    },
    {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    },
    { new: true }
  );

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  res.status(200).json({
    message: 'Password reset successful. You can now login with your new password.',
  });
});

