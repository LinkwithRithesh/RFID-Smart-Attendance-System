const EventEmitter = require('events');

class SmartAttendEventBus extends EventEmitter {}

// Global singleton event bus instance
const eventBus = new SmartAttendEventBus();

// Maximum listeners to avoid Node warning on high connection counts
eventBus.setMaxListeners(500);

module.exports = eventBus;
