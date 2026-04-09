export const COSTING_ROUTES = {
  DASHBOARD: '/factory/costing/dashboard',
  SEWING: '/factory/costing/sewing-costing',
  WASH: '/factory/costing/wash-costing',
  CONSUMPTION: {
    FABRIC: '/factory/costing/fabric-consumption',
    SEWING: '/factory/costing/sewing-thread-consumption',
    TRIMS: '/factory/costing/trims-consumption',
  },
};

export const COSTING_MENU = [
  { label: 'Costing Dashboard', to: COSTING_ROUTES.DASHBOARD },
  { label: 'Sewing Costing', to: COSTING_ROUTES.SEWING },
  { label: 'Wash Costing', to: COSTING_ROUTES.WASH },
  {
    label: 'Consumption',
    items: [
      { label: 'Fabric Consumption', to: COSTING_ROUTES.CONSUMPTION.FABRIC },
      { label: 'Sewing Thread Consumption', to: COSTING_ROUTES.CONSUMPTION.SEWING },
      { label: 'Trims & Accessories', to: COSTING_ROUTES.CONSUMPTION.TRIMS },
    ],
  },
];
