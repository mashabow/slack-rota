import { Installation, InstallationQuery } from "@slack/bolt";

const getEnterpriseOrTeamId = (
  installationQuery: InstallationQuery<boolean>
): string => {
  const id =
    (installationQuery.isEnterpriseInstall && installationQuery.enterpriseId) ||
    installationQuery.teamId;
  if (!id) throw new Error();
  return id;
};

export class InstallationStore {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(installation: Installation): Promise<void> {
    const enterpriseOrTeamId =
      installation.isEnterpriseInstall && installation.enterprise
        ? installation.enterprise.id
        : installation.team?.id;
    if (!enterpriseOrTeamId) throw new Error();

    await this.db
      .collection("installation")
      .doc(enterpriseOrTeamId)
      .set(installation);
  }

  async get(
    installationQuery: InstallationQuery<boolean>
  ): Promise<Installation> {
    const doc = await this.db
      .collection("installation")
      .doc(getEnterpriseOrTeamId(installationQuery))
      .get();
    if (!doc.exists) throw new Error();
    return doc.data() as Installation;
  }

  async delete(installationQuery: InstallationQuery<boolean>): Promise<void> {
    await this.db
      .collection("installation")
      .doc(getEnterpriseOrTeamId(installationQuery))
      .delete();
  }
}
