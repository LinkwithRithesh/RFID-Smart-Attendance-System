const OVERRIDE_RANK = {
  NONE: 0,
  FACULTY: 1,
  HOD: 2,
  ADMIN: 3,
  DEAN: 4,
  EMERGENCY: 5,
};

function rankOf(overrideType) {
  return OVERRIDE_RANK[overrideType] ?? 0;
}

// Strictly higher rank required to override/close someone else's session —
// equal rank is rejected rather than silently allowed, so e.g. one HOD can't
// silently clobber another HOD's already-open session in the same department.
function outranks(a, b) {
  return rankOf(a) > rankOf(b);
}

module.exports = { OVERRIDE_RANK, rankOf, outranks };
