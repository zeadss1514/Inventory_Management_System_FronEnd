import { Box, MapPin, MapPinned, Users, Warehouse } from "lucide-react";

// Central place describing the entity types this page can create/edit.
// Add an entry here and it shows up as a new card automatically.
export const MANAGED_ENTITIES = {
  product: { label: "منتج", icon: Box },
  site: { label: "موقع", icon: MapPin },
  inventory: { label: "مخزن", icon: Warehouse },
  zone: { label: "منطقة", icon: MapPinned },
  user: { label: "مستخدم", icon: Users },
};
