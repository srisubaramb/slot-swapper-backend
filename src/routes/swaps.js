const express = require('express');
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');

const router = express.Router();

// Get all swappable event slots from other users
router.get('/swappable-slots', auth, async (req, res) => {
  try {
    const slots = await Event.find({
      status: 'SWAPPABLE',
      userId: { $ne: req.user.id }
    }).populate('userId', 'name email')
      .sort({ startTime: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch swappable slots' });
  }
});

// Create a new swap request between two event slots
router.post('/request', auth, async (req, res) => {
  const { mySlotId, theirSlotId } = req.body;
  if (!mySlotId || !theirSlotId) {
    return res.status(400).json({ error: 'Both mySlotId and theirSlotId are required' });
  }
  try {
    const mySlot = await Event.findOne({ _id: mySlotId, userId: req.user.id });
    const theirSlot = await Event.findOne({ _id: theirSlotId });
    if (!mySlot || !theirSlot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (mySlot.status !== 'SWAPPABLE' || theirSlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ error: 'Slots must be swappable' });
    }

    // Check if request already exists
    const existingRequest = await SwapRequest.findOne({
      mySlotId,
      theirSlotId,
      status: 'PENDING'
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Request already exists' });
    }

    const swapRequest = await SwapRequest.create({
      mySlotId,
      theirSlotId,
      requesterId: req.user.id,
      ownerId: theirSlot.userId
    });

    // Update slot statuses to SWAP_PENDING
    await Event.updateOne({ _id: mySlotId }, { status: 'SWAP_PENDING' });
    await Event.updateOne({ _id: theirSlotId }, { status: 'SWAP_PENDING' });

    res.status(201).json(swapRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});

// Respond to a swap request (accept or decline)
router.post('/response/:id', auth, async (req, res) => {
  const { status } = req.body;
  if (!['ACCEPTED', 'DECLINED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const swapRequest = await SwapRequest.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    swapRequest.status = status;
    await swapRequest.save();

    if (status === 'ACCEPTED') {
      // Swap the slot owners
      const mySlot = await Event.findById(swapRequest.mySlotId);
      const theirSlot = await Event.findById(swapRequest.theirSlotId);

      if (mySlot && theirSlot) {
        const tempUserId = mySlot.userId;
        mySlot.userId = theirSlot.userId;
        theirSlot.userId = tempUserId;

        // Set both slots to BUSY after successful swap
        mySlot.status = 'BUSY';
        theirSlot.status = 'BUSY';

        await mySlot.save();
        await theirSlot.save();
      }
    } else if (status === 'DECLINED') {
      // Set slots back to SWAPPABLE when declined
      await Event.updateOne({ _id: swapRequest.mySlotId }, { status: 'SWAPPABLE' });
      await Event.updateOne({ _id: swapRequest.theirSlotId }, { status: 'SWAPPABLE' });
    }

    res.json(swapRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond to swap request' });
  }
});

// Get all swap requests (incoming and outgoing) for the authenticated user
router.get('/requests', auth, async (req, res) => {
  try {
    // Get incoming requests (where user is the owner)
    const incomingRequests = await SwapRequest.find({ ownerId: req.user.id })
      .populate('requesterId', 'name')
      .populate('theirSlotId', 'title')
      .populate('mySlotId', 'title')
      .sort({ createdAt: -1 });

    // Get outgoing requests (where user is the requester)
    const outgoingRequests = await SwapRequest.find({ requesterId: req.user.id })
      .populate('ownerId', 'name')
      .populate('theirSlotId', 'title')
      .populate('mySlotId', 'title')
      .sort({ createdAt: -1 });

    const formattedIncoming = incomingRequests.map(req => ({
      _id: req._id,
      type: 'incoming',
      fromUser: req.requesterId.name,
      eventTitle: req.theirSlotId.title,
      myEventTitle: req.mySlotId.title,
      status: req.status
    }));

    const formattedOutgoing = outgoingRequests.map(req => ({
      _id: req._id,
      type: 'outgoing',
      toUser: req.ownerId.name,
      eventTitle: req.theirSlotId.title,
      myEventTitle: req.mySlotId.title,
      status: req.status
    }));

    res.json([...formattedIncoming, ...formattedOutgoing]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get swap history for the authenticated user (accepted and declined requests)
router.get('/history', auth, async (req, res) => {
  try {
    const history = await SwapRequest.find({
      $or: [{ requesterId: req.user.id }, { ownerId: req.user.id }],
      status: { $in: ['ACCEPTED', 'DECLINED'] }
    }).populate('mySlotId theirSlotId')
      .sort({ createdAt: -1 });
    const formattedHistory = history.map(req => ({
      _id: req._id,
      title: req.mySlotId.title,
      startTime: req.mySlotId.startTime,
      endTime: req.mySlotId.endTime,
      status: req.status
    }));
    res.json(formattedHistory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
