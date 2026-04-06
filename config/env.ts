
export const ENV = {
  DEMO_MODE: false,
  DEV_LOGIN: false,
  IS_PROD: import.meta.env.PROD
};

console.log(`Config Loaded: DEMO_MODE=${ENV.DEMO_MODE}, DEV_LOGIN=${ENV.DEV_LOGIN}, IS_PROD=${ENV.IS_PROD}`);
