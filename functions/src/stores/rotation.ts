import { Rotation } from "../models/rotation";
import { Schedule } from "../models/schedule";

export class RotationStore {
  private collection: FirebaseFirestore.CollectionReference;

  constructor(db: FirebaseFirestore.Firestore) {
    this.collection = db.collection("rotations");
  }

  async set(rotation: Rotation): Promise<void> {
    await this.collection.doc(rotation.id).set(rotation.toJSON());
  }

  async get(rotationId: string): Promise<Rotation | null> {
    const doc = await this.collection.doc(rotationId).get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return doc.exists ? Rotation.fromJSON(doc.data() as any) : null;
  }

  async getAllBySchedule(schedule: Schedule): Promise<readonly Rotation[]> {
    if (schedule.days.length !== 1) {
      throw new Error("Length of schedule.days must be 1");
    }

    const snapshot = await this.collection
      .where("schedule.days", "array-contains", schedule.days[0])
      .where("schedule.hour", "==", schedule.hour)
      .where("schedule.minute", "==", schedule.minute)
      .get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((doc) => Rotation.fromJSON(doc.data() as any));
  }

  async getAllByMember(member: string): Promise<readonly Rotation[]> {
    const snapshot = await this.collection
      .where("members", "array-contains", member)
      .get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((doc) => Rotation.fromJSON(doc.data() as any));
  }

  async delete(rotationId: string): Promise<void> {
    await this.collection.doc(rotationId).delete();
  }
}
