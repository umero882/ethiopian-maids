// Utility helpers to compute display names across entities

export const getDisplayName = (entity) => {
  if (!entity) return 'Unknown';
  const full = (entity.full_name || entity.fullName || entity.name || '').toString().trim();
  if (full) return full;
  const parts = [entity.firstName, entity.middleName, entity.lastName]
    .filter((p) => typeof p === 'string' && p.trim())
    .join(' ')
    .trim();
  return parts || 'Unknown';
};

export const getMaidDisplayName = (maid) => getDisplayName(maid);

export const getSponsorDisplayName = (sponsor) => getDisplayName(sponsor);

export const getAgencyDisplayName = (agency) => {
  if (!agency) return 'Unknown';
  const v = (agency.full_name || agency.agencyName || agency.name || '').toString().trim();
  return v || 'Unknown';
};

export default getDisplayName;

