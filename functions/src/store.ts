import { Rotation } from "./rotation";

export class RotationStore {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(rotation: Rotation): Promise<void> {
    const rotationRef = this.db.collection("rotations").doc(rotation.id);
    await rotationRef.set(rotation);
  }
}
