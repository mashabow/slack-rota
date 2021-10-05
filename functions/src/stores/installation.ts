import { Installation, InstallationQuery } from "@slack/bolt";

const getInstallationIdFromQuery = (
  installationQuery: InstallationQuery<boolean>
): string => {
  const id =
    (installationQuery.isEnterpriseInstall && installationQuery.enterpriseId) ||
    installationQuery.teamId;
  if (!id)
    throw new Error("Missing enterprise or team ID in installationQuery");
  return id;
};

// installation のキー installationId は、以下の値を使う
// - org-wide app installation の場合、enterprise id（Enterprise Grid の OrG の id）
// - ワークスペースへのインストールの場合、team id（ワークスペースの id）
export class InstallationStore {
  private collection: FirebaseFirestore.CollectionReference;

  constructor(db: FirebaseFirestore.Firestore) {
    this.collection = db.collection("installations");
  }

  async set(installation: Installation): Promise<void> {
    const installationId =
      installation.isEnterpriseInstall && installation.enterprise
        ? installation.enterprise.id
        : installation.team?.id;
    if (!installationId)
      throw new Error("Missing enterprise or team ID in installation");

    await this.collection.doc(installationId).set(installation);
  }

  async get(
    installationQuery: InstallationQuery<boolean>
  ): Promise<Installation> {
    const doc = await this.collection
      .doc(getInstallationIdFromQuery(installationQuery))
      .get();
    if (!doc.exists) throw new Error("Installation not found");
    return doc.data() as Installation;
  }

  async delete(installationQuery: InstallationQuery<boolean>): Promise<void> {
    await this.collection
      .doc(getInstallationIdFromQuery(installationQuery))
      .delete();
  }
}
