// npm packages
const { validate } = require("jsonschema");

// app imports
const { User } = require("../models");
const { APIError } = require("../helpers");
const { thingNewSchema, thingUpdateSchema } = require("../schemas");

/**
 * Validate the POST request body and create a new User
 */
async function createThing(request, response, next) {
  const validation = validate(request.body, thingNewSchema);
  if (!validation.valid) {
    return next(
      new APIError(
        400,
        "Bad Request",
        validation.errors.map(e => e.stack).join(". ")
      )
    );
  }

  try {
    const newThing = await User.createThing(new User(request.body));
    return response.status(201).json(newThing);
  } catch (err) {
    return next(err);
  }
}

/**
 * Get a single user
 * @param {String} name - the name of the User to retrieve
 */
async function readThing(request, response, next) {
  const { name } = request.params;
  try {
    const user = await User.readThing(name);
    return response.json(user);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update a single user
 * @param {String} name - the name of the User to update
 */
async function updateThing(request, response, next) {
  const { name } = request.params;

  const validation = validate(request.body, thingUpdateSchema);
  if (!validation.valid) {
    return next(
      new APIError(
        400,
        "Bad Request",
        validation.errors.map(e => e.stack).join(". ")
      )
    );
  }

  try {
    const user = await User.updateThing(name, request.body);
    return response.json(user);
  } catch (err) {
    return next(err);
  }
}

/**
 * Remove a single user
 * @param {String} name - the name of the User to remove
 */
async function deleteThing(request, response, next) {
  const { name } = request.params;
  try {
    const deleteMsg = await User.deleteThing(name);
    return response.json(deleteMsg);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createThing,
  readThing,
  updateThing,
  deleteThing
};
