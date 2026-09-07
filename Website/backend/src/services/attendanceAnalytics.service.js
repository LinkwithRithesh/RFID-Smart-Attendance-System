/**
 * Server-Side Attendance Analytics & Math Service
 * Single source of truth for:
 * - Overall and subject-wise percentage
 * - Consecutive streak calculation
 * - Safe misses calculation (classes that can be missed while staying >= 75%)
 * - Required classes to reach 75% threshold
 * - Method breakdown (% RFID, Face, Dual, Manual)
 */

function calculateAttendanceMetrics(records = []) {
  const total = records.length;
  if (total === 0) {
    return {
      held: 0,
      attended: 0,
      absent: 0,
      late: 0,
      od: 0,
      percentage: 100,
      streak: 0,
      safeMisses: 0,
      requiredTo75: 0,
      status: 'SAFE',
      methodBreakdown: {
        rfid: 0,
        face: 0,
        dual: 0,
        manual: 0,
      },
    };
  }

  let attended = 0;
  let absent = 0;
  let late = 0;
  let od = 0;

  let rfidCount = 0;
  let faceCount = 0;
  let dualCount = 0;
  let manualCount = 0;

  // Sort chronological for streak calculation
  const sorted = [...records].sort((a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime());

  sorted.forEach((r) => {
    const status = String(r.status).toUpperCase();
    if (status === 'PRESENT') {
      attended++;
    } else if (status === 'LATE') {
      attended++;
      late++;
    } else if (status === 'OD') {
      attended++;
      od++;
    } else {
      absent++;
    }

    const method = String(r.method || '').toUpperCase();
    if (method.includes('DUAL')) dualCount++;
    else if (method.includes('FACE')) faceCount++;
    else if (method.includes('MANUAL')) manualCount++;
    else rfidCount++;
  });

  const percentage = Number(((attended / total) * 100).toFixed(1));

  // Streak: consecutive present/late/OD at the end of chronological record
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = String(sorted[i].status).toUpperCase();
    if (s === 'PRESENT' || s === 'LATE' || s === 'OD') {
      streak++;
    } else {
      break;
    }
  }

  // Safe misses: floor((attended - 0.75 * held) / 0.75)
  // Required: ceil((0.75 * held - attended) / 0.25)
  let safeMisses = 0;
  let requiredTo75 = 0;

  if (percentage >= 75) {
    safeMisses = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
  } else {
    requiredTo75 = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  }

  let status = 'SAFE';
  if (percentage >= 90) status = 'ELIGIBLE';
  else if (percentage >= 75) status = 'SAFE';
  else if (percentage >= 70) status = 'WARNING';
  else status = 'SHORTAGE';

  return {
    held: total,
    attended,
    absent,
    late,
    od,
    percentage,
    streak,
    safeMisses,
    requiredTo75,
    status,
    methodBreakdown: {
      rfid: attended > 0 ? Number(((rfidCount / attended) * 100).toFixed(1)) : 0,
      face: attended > 0 ? Number(((faceCount / attended) * 100).toFixed(1)) : 0,
      dual: attended > 0 ? Number(((dualCount / attended) * 100).toFixed(1)) : 0,
      manual: attended > 0 ? Number(((manualCount / attended) * 100).toFixed(1)) : 0,
    },
  };
}

function calculateConsecutiveStreak(records = []) {
  const sorted = [...records].sort((a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime());
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = String(sorted[i].status).toUpperCase();
    if (s === 'PRESENT' || s === 'LATE' || s === 'OD') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateSafeMisses(attended, held) {
  if (held === 0) return 0;
  const percentage = (attended / held) * 100;
  if (percentage < 75) return 0;
  return Math.max(0, Math.floor((attended - 0.75 * held) / 0.75));
}

function calculateRequiredTo75(attended, held) {
  if (held === 0) return 0;
  const percentage = (attended / held) * 100;
  if (percentage >= 75) return 0;
  return Math.max(0, Math.ceil((0.75 * held - attended) / 0.25));
}

module.exports = {
  calculateAttendanceMetrics,
  calculateConsecutiveStreak,
  calculateSafeMisses,
  calculateRequiredTo75,
};
