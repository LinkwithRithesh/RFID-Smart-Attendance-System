/**
 * Push delivery to the Flutter app (e.g. via Firebase Cloud Messaging) needs
 * an FCM/APNs SDK and project credentials — neither is in the stated tech
 * stack. Rather than fake delivery, this honestly reports "not configured"
 * so Notification rows reflect reality (status: FAILED, a clear reason) and
 * nothing downstream is misled into thinking a push was actually sent.
 * Swap this implementation for a real FCM call once credentials exist —
 * the interface (user, title, message) -> {delivered, reason} won't change.
 */
async function sendPush(user, title, message) {
  return { delivered: false, reason: 'Push provider not configured (no FCM/APNs credentials in scope)' };
}

module.exports = { sendPush };
