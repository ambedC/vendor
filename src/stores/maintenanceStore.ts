// Maintenance state store for 503-based maintenance mode
type MaintenanceState = {
  isActive: boolean;
  message: string | null;
};

let maintenanceState: MaintenanceState = {
  isActive: false,
  message: null,
};

const listeners = new Set<() => void>();

export const maintenanceStore = {
  getState: (): MaintenanceState => maintenanceState,

  setMaintenance: (isActive: boolean, message: string | null = null) => {
    maintenanceState = {
      isActive,
      message,
    };
    listeners.forEach((listener) => listener());
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

