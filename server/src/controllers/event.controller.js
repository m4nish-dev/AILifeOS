import Event from '../models/Event.model.js';

// @desc   Get all events (optional range filter via ?from&to)
// @route  GET /api/events
// @access Protected
export const getEvents = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    
    if (req.query.from && req.query.to) {
      filter.start = { $gte: new Date(req.query.from) };
      filter.end = { $lte: new Date(req.query.to) };
    }

    const events = await Event.find(filter).sort({ start: 1 });

    res.status(200).json({
      success: true,
      message: 'Events fetched successfully.',
      data: { events, count: events.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get events by exact range
// @route  GET /api/events/range
// @access Protected
export const getEventsByRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'start and end query parameters are required' });
    }

    // Find any event that overlaps with the requested [start, end] window
    const filter = {
      userId: req.user._id,
      start: { $lt: new Date(end) },
      end: { $gt: new Date(start) }
    };

    const events = await Event.find(filter).sort({ start: 1 });

    res.status(200).json({
      success: true,
      message: 'Events fetched successfully.',
      data: { events, count: events.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single event
// @route  GET /api/events/:id
// @access Protected
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, message: 'Event fetched', data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create event
// @route  POST /api/events
// @access Protected
export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Event created', data: { event } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message }); // 400 for validation errors
  }
};

// @desc   Update event
// @route  PUT /api/events/:id
// @access Protected
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['title', 'description', 'start', 'end', 'allDay', 'color', 'category', 'location', 'recurring'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    await event.save();

    res.status(200).json({ success: true, message: 'Event updated', data: { event } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete event
// @route  DELETE /api/events/:id
// @access Protected
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event deleted', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Move event (drag-drop)
// @route  PATCH /api/events/:id/move
// @access Protected
export const moveEvent = async (req, res) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Both start and end dates are required for move' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event.start = new Date(start);
    event.end = new Date(end);
    
    await event.save();

    res.status(200).json({ success: true, message: 'Event moved', data: { event } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
