import { Rotation } from "./model/rotation";
import { Schedule } from "./model/schedule";

export class RotationStore {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(rotation: Rotation): Promise<void> {
    await this.db
      .collection("rotations")
      .doc(rotation.id)
      .set(rotation.toJSON());
  }

  async getBySchedule(schedule: Schedule): Promise<readonly Rotation[]> {
    if (schedule.days.length !== 1) {
      throw new Error("Length of schedule.days must be 1");
    }

    const snapshot = await this.db
      .collection("rotations")
      .where("schedule.days", "array-contains", schedule.days[0])
      .where("schedule.hour", "==", schedule.hour)
      .where("schedule.minute", "==", schedule.minute)
      .get();
    return snapshot.docs.map((doc) => Rotation.fromJSON(doc.data() as any));
  }

  async has(rotationId: string): Promise<boolean> {
    const doc = await this.db.collection("rotations").doc(rotationId).get();
    return doc.exists;
  }

  async delete(rotationId: string): Promise<void> {
    await this.db.collection("rotations").doc(rotationId).delete();
  }
}
