const CalendarShare = require('../models/CalendarShare');
const PendingShare = require('../models/PendingShare');
const Calendar = require('../models/Calendar');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/emailService');

// @desc    Share a calendar
// @route   POST /api/shares
// @access  Private
const shareCalendar = async (req, res) => {
  const { calendarId, email, role } = req.body;

  // Verify calendar ownership
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  if (calendar.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized to share this calendar' });
  }

  // Prevent sharing default calendar
  if (calendar.isDefault) {
    return res.status(400).json({ message: 'Default calendar cannot be shared. Create a new calendar to share with others.' });
  }

  // Check if user exists
  const recipient = await User.findOne({ email });

  if (recipient) {
    // User exists - Create internal invite

    // Check if already shared
    const existingShare = await CalendarShare.findOne({
      calendar: calendarId,
      user: recipient._id,
    });

    if (existingShare) {
      return res.status(400).json({ message: 'Calendar already shared with this user' });
    }

    const share = await CalendarShare.create({
      calendar: calendarId,
      user: recipient._id,
      role: role || 'viewer',
      status: 'pending', // Requires acceptance
    });

    // Create Notification
    await Notification.create({
      user: recipient._id,
      message: `${req.user.name} invited you to join calendar "${calendar.name}"`,
      type: 'invite',
      referenceId: share._id,
      isRead: false
    });

    res.status(200).json({ message: 'Invitation sent to user', share });
  } else {
    // User does not exist - Create pending share and send email

    // Check if already invited
    const existingPending = await PendingShare.findOne({
      calendar: calendarId,
      email: email
    });

    if (existingPending) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    await PendingShare.create({
      calendar: calendarId,
      email: email,
      invitedBy: req.user.id,
      role: role || 'viewer'
    });

    // Send Email
    const signupLink = `http://localhost:5173/signup?email=${encodeURIComponent(email)}`;
    const roleText = role === 'editor' ? 'edit and manage' : 'view';
    const emailHtml = `
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
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 40px 40px 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">🗓️</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">You're Invited!</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">Join a shared calendar on CalManage</p>
                  </td>
                </tr>
                
                <!-- Main content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #64748b; text-align: center;">
                      <strong style="color: #1e293b;">${req.user.name}</strong> has invited you to ${roleText} their calendar.
                    </p>
                    
                    <!-- Calendar Card -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 48px; vertical-align: top;">
                            <div style="width: 48px; height: 48px; background-color: #22c55e; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;">
                              <span style="font-size: 24px;">📅</span>
                            </div>
                          </td>
                          <td style="padding-left: 16px; vertical-align: middle;">
                            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">${calendar.name}</p>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #4ade80;">
                              ${role === 'editor' ? '✏️ Editor Access' : '👁️ View Access'}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 24px;">
                          <a href="${signupLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                            Sign Up & Join Calendar
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- What you'll get -->
                    <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1e293b;">✨ What you'll get:</p>
                      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 13px; line-height: 1.8; color: #64748b;">
                        <li>Access to "${calendar.name}" calendar</li>
                        <li>Real-time event notifications</li>
                        <li>Seamless collaboration with ${req.user.name}</li>
                        ${role === 'editor' ? '<li>Create and edit events</li>' : '<li>View all events and reminders</li>'}
                      </ul>
                    </div>
                    
                    <!-- Pre-filled email notice -->
                    <div style="text-align: center; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
                      <p style="margin: 0; font-size: 13px; color: #3b82f6;">
                        📧 Your email <strong>${email}</strong> will be pre-filled during sign up
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
                    <p style="margin: 0; font-size: 12px; word-break: break-all; color: #10b981; text-align: center;">
                      <a href="${signupLink}" style="color: #10b981; text-decoration: none;">${signupLink}</a>
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

    await sendEmail(email, `${req.user.name} invited you to join "${calendar.name}" calendar`, emailHtml);

    res.status(200).json({ message: 'Invitation email sent' });
  }
};

// @desc    Get calendars shared with current user (Accepted only for main view)
// @route   GET /api/shares
// @access  Private
const getShares = async (req, res) => {
  const shares = await CalendarShare.find({
    user: req.user.id,
    status: 'accepted'
  }).populate({
    path: 'calendar',
    populate: { path: 'user', select: 'name email' }
  });

  res.status(200).json(shares);
};

// @desc    Get pending invites (shares) for the current user
// @route   GET /api/shares/invites
// @access  Private
const getMyInvites = async (req, res) => {
  const invites = await CalendarShare.find({
    user: req.user.id,
    status: 'pending'
  }).populate({
    path: 'calendar',
    populate: { path: 'user', select: 'name email' } // Get owner info
  });

  res.status(200).json(invites);
};

// @desc    Accept/Decline invite
// @route   PATCH /api/shares/invites/:id
// @access  Private
const respondToInvite = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'declined' (if declined, we delete)
  const share = await CalendarShare.findById(req.params.id);

  if (!share) {
    return res.status(404).json({ message: 'Invite not found' });
  }

  if (share.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (status === 'accepted') {
    share.status = 'accepted';
    await share.save();
    res.status(200).json(share);
  } else {
    // Declined -> delete share
    await share.deleteOne();
    res.status(200).json({ message: 'Invite declined' });
  }
};

// @desc    Remove a share
// @route   DELETE /api/shares/:shareId
// @access  Private
const removeShare = async (req, res) => {
  const { shareId } = req.params;

  // Try to find in existing shares (internal users)
  let share = await CalendarShare.findById(shareId).populate('calendar');

  if (share) {
    const calendarOwnerId = share.calendar.user.toString();
    const recipientId = share.user.toString();

    // Allow removal if user is owner of calendar OR recipient of share
    if (req.user.id !== calendarOwnerId && req.user.id !== recipientId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await share.deleteOne();
    return res.status(200).json({ message: 'Share removed' });
  }

  // If not found, check pending shares (external emails)
  const pendingShare = await PendingShare.findById(shareId);

  if (pendingShare) {
    // Only calendar owner can remove pending external invites (sender)
    // We need to fetch calendar to check ownership
    const calendar = await Calendar.findById(pendingShare.calendar);

    if (!calendar) {
      // Clean up orphaned pending share
      await pendingShare.deleteOne();
      return res.status(200).json({ message: 'Share removed' });
    }

    if (calendar.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await pendingShare.deleteOne();
    return res.status(200).json({ message: 'Invitation removed' });
  }

  return res.status(404).json({ message: 'Share not found' });
};

// @desc    Get all shares for a specific calendar (for owner to manage)
// @route   GET /api/shares/calendar/:calendarId
// @access  Private
const getCalendarShares = async (req, res) => {
  const { calendarId } = req.params;

  // Verify calendar exists and user is the owner
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  if (calendar.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized - only calendar owner can view shares' });
  }

  // Get all shares for this calendar
  const shares = await CalendarShare.find({ calendar: calendarId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  // Also get pending shares (external emails)
  const pendingShares = await PendingShare.find({ calendar: calendarId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    shares: shares.map(s => ({
      _id: s._id,
      user: s.user,
      role: s.role,
      status: s.status,
      createdAt: s.createdAt
    })),
    pendingShares: pendingShares.map(p => ({
      _id: p._id,
      email: p.email,
      role: p.role,
      createdAt: p.createdAt,
      status: 'pending_signup'
    }))
  });
};

module.exports = {
  shareCalendar,
  getShares,
  removeShare,
  getMyInvites,
  respondToInvite,
  getCalendarShares
};
