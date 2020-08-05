import { Rotation } from "./rotation";

export class RotationStore {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(rotation: Rotation): Promise<void> {
    await this.db.collection("rotations").doc(rotation.id).set(rotation);
  }

  async getByTime(hour: number, minute: number): Promise<readonly Rotation[]> {
    const snapshot = await this.db
      .collection("rotations")
      .where("hour", "==", hour)
      .where("minute", "==", minute)
      .get();
    return snapshot.docs.map((doc) => doc.data() as Rotation);
  }
}
