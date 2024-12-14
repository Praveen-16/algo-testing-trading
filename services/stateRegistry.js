const { user5CeState, user5PeState } = require('../user_stratagies/user5');
const { day1009CeState, day1009PeState } = require('../user_stratagies/day1009');
const { user10CeState, user10PeState } = require('../user_stratagies/user10');
const { user9015CeState, user9015PeState } = require('../user_stratagies/user9015');

const stateRegistry = {
  user5: { ceState: user5CeState, peState: user5PeState },
  day1009: { ceState: day1009CeState, peState: day1009PeState },
  user10: { ceState: user10CeState, peState: user10PeState },
  user9015: { ceState: user9015CeState, peState: user9015PeState },
};

module.exports = stateRegistry;
