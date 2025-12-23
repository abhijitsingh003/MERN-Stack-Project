const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Calendar = require('../models/Calendar');
const CalendarShare = require('../models/CalendarShare');
const PendingShare = require('../models/PendingShare');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const sendEmail = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
  });

  if (user) {
    const defaultCalendar = await Calendar.create({
      user: user.id,
      name: 'Personal',
      color: '#3b82f6',
      isDefault: true,
      settings: {
        defaultView: 'month',
        notifications: {
          emailReminders: true,
          inAppReminders: true,
        },
      },
    });

    await Activity.create({
      user: user.id,
      action: 'created',
      target: 'Calendar',
      details: `Default calendar "Personal" created (${defaultCalendar._id})`,
    });

    // Check for pending shares (invites sent before registration)
    const pendingShares = await PendingShare.find({ email: normalizedEmail });
    if (pendingShares.length > 0) {
      for (const pending of pendingShares) {
        // Convert to CalendarShare
        const share = await CalendarShare.create({
          calendar: pending.calendar,
          user: user.id,
          role: pending.role,
          status: 'accepted' // Auto-accept since they signed up from invite? Or 'pending'? 
          // Requirement says: "Automatic calendar addition to their personal profile upon registration" -> So 'accepted'.
        });

        // Create Notification
        await Notification.create({
          user: user.id,
          message: `You have been added to calendar (auto-accepted from invite)`,
          type: 'invite',
          referenceId: share._id,
          isRead: false
        });

        // Cleanup
        await pending.deleteOne();
      }
    }

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';

  // Check for user email
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(normalizedPassword))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `http://localhost:5173/login?resetToken=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalizedEmail)}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fb;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fb;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); padding: 40px 40px 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">📅</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">CalManage</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">Your Smart Calendar Assistant</p>
                  </td>
                </tr>
                
                <!-- Main content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1e293b; text-align: center;">Password Reset Request</h2>
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #64748b; text-align: center;">
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 24px;">
                          <a href="${resetLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); transition: all 0.2s;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Timer warning -->
                    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 24px; vertical-align: top;">
                            <span style="font-size: 18px;">⏱️</span>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
                              This link expires in <strong>15 minutes</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Security notice -->
                    <div style="background-color: #f1f5f9; border-radius: 10px; padding: 16px;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                        <strong style="color: #475569;">🔒 Security Notice</strong>
                      </p>
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8; text-align: center;">
                      Having trouble? Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; font-size: 12px; word-break: break-all; color: #3b82f6; text-align: center;">
                      <a href="${resetLink}" style="color: #3b82f6; text-decoration: none;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
                

                <tr>
                  <td style="padding: 20px 40px 24px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      © ${new Date().getFullYear()} CalManage. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await sendEmail(normalizedEmail, 'Reset your CalManage password', html);

    const response = { message: 'If that email exists, a reset link was sent.' };
    // Only add debug info in non-production if email failed
    if (process.env.NODE_ENV !== 'production' && !info) {
      response.emailSent = false;
      response.warning = 'Email could not be sent. Check SMTP configuration.';
    }
    res.status(200).json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'An error occurred while processing your request',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const rawToken = typeof token === 'string' ? token.trim() : '';
  const nextPassword = typeof password === 'string' ? password : '';

  if (!rawToken || !nextPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = nextPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
};
