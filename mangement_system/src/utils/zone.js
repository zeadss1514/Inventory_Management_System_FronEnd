export const NO_ZONE_LABEL = "بدون منطقة";

export function getZoneName(zone) {
  return zone?.name?.trim() || NO_ZONE_LABEL;
}
