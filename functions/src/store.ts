import { Rotation } from "./model/rotation";

export class RotationStore {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(rotation: Rotation): Promise<void> {
    await this.db
      .collection("rotations")
      .doc(rotation.id)
      .set(rotation.toJSON());
  }

  async getByTime(
    day: number,
    hour: number,
    minute: number
  ): Promise<readonly Rotation[]> {
    const snapshot = await this.db
      .collection("rotations")
      .where("schedule.days", "array-contains", day)
      .where("schedule.hour", "==", hour)
      .where("schedule.minute", "==", minute)
      .get();
    return snapshot.docs.map((doc) => Rotation.fromJSON(doc.data() as any));
  }
}
