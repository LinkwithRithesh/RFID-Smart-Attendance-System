const announcementService = require('../services/announcement.service');
const { success } = require('../utils/apiResponse');

async function createAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.createAnnouncement(req.body, req.user.id);
    return success(res, 201, 'Announcement created', announcement);
  } catch (err) {
    next(err);
  }
}

async function listAnnouncements(req, res, next) {
  try {
    const result = await announcementService.listAnnouncements(req.query);
    return success(res, 200, 'Announcements retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function pin(req, res, next) {
  try {
    const announcement = await announcementService.togglePin(req.params.id, true, req.user.id);
    return success(res, 200, 'Announcement pinned', announcement);
  } catch (err) {
    next(err);
  }
}

async function unpin(req, res, next) {
  try {
    const announcement = await announcementService.togglePin(req.params.id, false, req.user.id);
    return success(res, 200, 'Announcement unpinned', announcement);
  } catch (err) {
    next(err);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await announcementService.deleteAnnouncement(req.params.id, req.user.id);
    return success(res, 200, 'Announcement deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { createAnnouncement, listAnnouncements, pin, unpin, deleteAnnouncement };
