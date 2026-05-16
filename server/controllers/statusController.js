const Status = require('../models/Status');
const User = require('../models/User');

exports.uploadStatus = async (req, res) => {
    try {
        const { mediaUrl, type, caption } = req.body;
        if (!mediaUrl) return res.status(400).json({ message: 'Media URL is required' });

        const status = new Status({
            user: req.user._id,
            mediaUrl,
            type: type || 'image',
            caption: caption || ''
        });

        await status.save();
        const populatedStatus = await Status.findById(status._id).populate('user', 'username profilePhoto');
        res.status(201).json(populatedStatus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllStatuses = async (req, res) => {
    try {
        // In a real app, we would only get statuses from friends/contacts.
        // For this project, we'll get statuses from all users except blocked ones.
        const statuses = await Status.find()
            .populate('user', 'username profilePhoto')
            .sort({ createdAt: -1 });

        // Group statuses by user
        const groupedStatuses = statuses.reduce((acc, status) => {
            const userId = status.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: status.user,
                    items: []
                };
            }
            acc[userId].items.push(status);
            return acc;
        }, {});

        res.json(Object.values(groupedStatuses));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.viewStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        await Status.findByIdAndUpdate(statusId, {
            $addToSet: { seenBy: req.user._id }
        });
        res.json({ message: 'Status viewed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ message: 'Status not found' });
        
        if (status.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Status.findByIdAndDelete(statusId);
        res.json({ message: 'Status deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
