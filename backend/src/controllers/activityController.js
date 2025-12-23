const Activity = require('../models/Activity');

const getActivity = async (req, res) => {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const raw = await Activity.find({
    user: req.user.id,
    createdAt: { $gte: twoDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const filtered = raw
    .filter((item) => item.target !== 'Calendar')
    .map((item) => {
      if (!item.details) {
        return item;
      }
      const cleaned = item.details.replace(/\([0-9a-f]{24}\)/gi, '').trim();
      return { ...item, details: cleaned };
    });

  res.status(200).json(filtered);
};

module.exports = {
  getActivity,
};
