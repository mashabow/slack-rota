import { InstallationStore } from "./installation";
import { RotationStore } from "./rotation";

export interface Stores {
  rotationStore: RotationStore;
  installationStore: InstallationStore;
}

export const createStores = (db: FirebaseFirestore.Firestore): Stores => {
  db.settings({ ignoreUndefinedProperties: true });

  return {
  rotationStore: new RotationStore(db),
  installationStore: new InstallationStore(db),
  };
};
