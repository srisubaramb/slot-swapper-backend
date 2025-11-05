const express = require('express');
const auth = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// GET /events
router.get('/', auth, async (req, res) => {
  const events = await Event.find({ userId: req.user.id }).sort({ startTime: 1 });
  res.json(events);
});

// POST /events
router.post('/', auth, async (req, res) => {
  const { title, fromDate, toDate } = req.body;
  if (!title || !fromDate || !toDate) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const event = await Event.create({
    userId: req.user.id,
    title,
    startTime: fromDate,
    endTime: toDate,
    status: 'SWAPPABLE'
  });
  res.status(201).json(event);
});

// DELETE /events/:id
router.delete('/:id', auth, async (req, res) => {
  const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
});

router.patch("/:id/status", auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Only allow toggling if status is SWAPPABLE or BUSY
    if (event.status === "SWAP_PENDING") {
      return res.status(400).json({ error: "Cannot toggle status while swap is pending" });
    }

    // Only allow toggling if status is SWAPPABLE or BUSY (not after swap is completed)
    if (event.status !== "SWAPPABLE" && event.status !== "BUSY") {
      return res.status(400).json({ error: "Cannot toggle status of completed swap events" });
    }

    // Toggle between SWAPPABLE and BUSY
    event.status = event.status === "SWAPPABLE" ? "BUSY" : "SWAPPABLE";
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;
