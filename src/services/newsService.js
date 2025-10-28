// Lightweight news/announcements service used by AnnouncementBanner
// Provides a default export with minimal functionality and safe fallbacks.

let cachedAnnouncements = [];
let lastUpdate = Date.now();
let updating = false;

function getFormattedAnnouncements() {
  // Return cached announcements; empty array is safe and hides the banner
  return Array.isArray(cachedAnnouncements) ? cachedAnnouncements : [];
}

function getLastUpdateTime() {
  return lastUpdate;
}

function isCurrentlyUpdating() {
  return updating;
}

async function forceUpdate() {
  // Simulate a quick refresh cycle; keep offline-friendly
  updating = true;
  try {
    // No external fetch; optionally seed simple announcements
    cachedAnnouncements = cachedAnnouncements || [];
    lastUpdate = Date.now();
  } finally {
    updating = false;
  }
}

export default {
  getFormattedAnnouncements,
  getLastUpdateTime,
  isCurrentlyUpdating,
  forceUpdate,
};
