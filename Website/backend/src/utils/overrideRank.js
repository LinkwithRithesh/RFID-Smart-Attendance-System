// Emergency > Dean > Admin > HOD > Automatic (NONE), exactly as specified.
const OVERRIDE_RANK = {
  NONE: 0,
  HOD: 1,
  ADMIN: 2,
  DEAN: 3,
  EMERGENCY: 4,
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
