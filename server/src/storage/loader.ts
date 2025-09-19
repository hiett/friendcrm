import type { StorageDriver } from "./driver";

let driver: StorageDriver | null = null;

export function getDriver(): StorageDriver {
  if (!driver) {
    throw new Error("Storage driver not initialized");
  }

  return driver;
}

export async function setDriver(newDriver: StorageDriver) {
  if (driver) {
    throw new Error("Driver already set");
  }

  driver = newDriver;
  await driver.init();
}
