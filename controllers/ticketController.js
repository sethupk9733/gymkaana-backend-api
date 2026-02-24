const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Helper to mark messages as read
const markMessagesAsRead = async (ticket, userId) => {
    let updated = false;
    ticket.replies.forEach(reply => {
        if (reply.senderId.toString() !== userId.toString()) {
            const alreadyRead = reply.readBy.some(r => r.userId.toString() === userId.toString());
            if (!alreadyRead) {
                reply.readBy.push({ userId: userId });
                updated = true;
            }
        }
    });

    if (updated) {
        await ticket.save();
    }
};

const getPrimaryRole = (user) => {
    if (!user.roles || user.roles.length === 0) return 'user';
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('owner')) return 'owner';
    return 'user';
};

// Create a unified support conversation (ticket or chat message)
exports.createTicket = async (req, res) => {
    try {
        const { subject, description } = req.body;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required' });
        }

        // Check if user already has a support conversation
        let ticket = await Ticket.findOne({
            userId: req.user._id,
            subject: 'Support Conversation'
        });

        // If no conversation exists, create one
        if (!ticket) {
            ticket = new Ticket({
                userId: req.user._id,
                subject: 'Support Conversation',
                description: 'Unified support tickets and chat'
            });
        }

        // Add the ticket/message as a reply
        const user = await User.findById(req.user._id);
        const reply = {
            senderId: req.user._id,
            senderName: user.name,
            senderRole: getPrimaryRole(user),
            message: `**[TICKET]** ${subject}\n\n${description}`
        };

        ticket.replies.push(reply);
        ticket.updatedAt = Date.now();
        if (ticket.status === 'closed') ticket.status = 'open'; // Reopen if closed

        await ticket.save();
        const updated = await Ticket.findById(ticket._id)
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name roles');

        res.status(201).json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all support conversations (admin only)
exports.getAllTickets = async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user._id);
        if (!user.roles || !user.roles.includes('admin')) {
            return res.status(403).json({ message: 'Only admins can view all tickets' });
        }

        const tickets = await Ticket.find({})
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name roles')
            .sort({ updatedAt: -1 });

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single ticket
exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name roles');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check authorization - user can view their own tickets, admins can view all
        const user = await User.findById(req.user._id);
        if ((!user.roles || !user.roles.includes('admin')) && ticket.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }

        // Mark messages as read
        await markMessagesAsRead(ticket, req.user._id);

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add reply to ticket
exports.addReply = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check authorization
        const user = await User.findById(req.user._id);
        if ((!user.roles || !user.roles.includes('admin')) && ticket.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
        }

        const reply = {
            senderId: req.user._id,
            senderName: user.name,
            senderRole: getPrimaryRole(user),
            message
        };

        ticket.replies.push(reply);
        ticket.updatedAt = Date.now();

        // If admin is replying, set status to in-progress
        if (user.roles && user.roles.includes('admin') && ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        const updatedTicket = await Ticket.findById(req.params.id)
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name role');

        res.json(updatedTicket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update ticket status (admin only)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.roles || !user.roles.includes('admin')) {
            return res.status(403).json({ message: 'Only admins can update ticket status' });
        }

        if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete ticket (admin only)
exports.deleteTicket = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.roles || !user.roles.includes('admin')) {
            return res.status(403).json({ message: 'Only admins can delete tickets' });
        }

        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Get or create unified support conversation
exports.getSupportChat = async (req, res) => {
    try {
        // Look for existing support conversation
        let ticket = await Ticket.findOne({
            userId: req.user._id,
            subject: 'Support Conversation'
        })
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name roles');

        // If no conversation exists, create one
        if (!ticket) {
            const user = await User.findById(req.user._id);
            ticket = new Ticket({
                userId: req.user._id,
                subject: 'Support Conversation',
                description: 'Unified support tickets and chat',
                status: 'open'
            });
            await ticket.save();
            ticket = await ticket.populate('userId', 'name email phoneNumber');
        }

        // Mark messages as read
        await markMessagesAsRead(ticket, req.user._id);

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Send chat message
exports.sendChatMessage = async (req, res) => {
    try {
        const { message } = req.body;

        // Get or create unified support conversation
        let ticket = await Ticket.findOne({
            userId: req.user._id,
            subject: 'Support Conversation'
        });

        if (!ticket) {
            ticket = new Ticket({
                userId: req.user._id,
                subject: 'Support Conversation',
                description: 'Unified support tickets and chat',
                status: 'open'
            });
            await ticket.save();
        }

        const user = await User.findById(req.user._id);
        const reply = {
            senderId: req.user._id,
            senderName: user.name,
            senderRole: getPrimaryRole(user),
            message
        };

        ticket.replies.push(reply);
        ticket.updatedAt = Date.now();
        if (ticket.status === 'closed') ticket.status = 'open'; // Reopen if closed
        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('userId', 'name email phoneNumber')
            .populate('replies.senderId', 'name roles');

        res.json(updatedTicket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        let count = 0;

        if (user.roles && user.roles.includes('admin')) {
            const tickets = await Ticket.find({ status: { $ne: 'closed' } });
            tickets.forEach(ticket => {
                const isUnread = ticket.replies.some(reply => {
                    if (reply.senderId.toString() !== userId.toString()) {
                        return !reply.readBy.some(r => r.userId.toString() === userId.toString());
                    }
                    return false;
                });
                if (isUnread) count++;
            });
        } else {
            const tickets = await Ticket.find({
                userId: userId,
                status: { $ne: 'closed' }
            });

            tickets.forEach(ticket => {
                const isUnread = ticket.replies.some(reply => {
                    if (reply.senderId.toString() !== userId.toString()) {
                        return !reply.readBy.some(r => r.userId.toString() === userId.toString());
                    }
                    return false;
                });
                if (isUnread) count++;
            });
        }

        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};