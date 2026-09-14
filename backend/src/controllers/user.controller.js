const userService = require('../services/user.service');
const { success } = require('../utils/apiResponse');

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user.id);
    return success(res, 201, 'User created', user);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await userService.listUsers(req.query);
    return success(res, 200, 'Users retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUser(req.params.id, req.user);
    return success(res, 200, 'User retrieved', user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    return success(res, 200, 'User updated', user);
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    await userService.deactivateUser(req.params.id, req.user.id);
    return success(res, 200, 'User deactivated');
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, listUsers, getUser, updateUser, deactivateUser };
