import { Installation, InstallationQuery } from "@slack/bolt";
import { decrypt, encrypt } from "../encrypt";

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

type EncryptedInstallation = Omit<Installation, "bot"> &
  Required<Pick<Installation, "bot">>;

/**
 * installation のキー installationId は、以下の値を使う
 * - org-wide app installation の場合、enterprise id（Enterprise Grid の OrG の id）
 * - ワークスペースへのインストールの場合、team id（ワークスペースの id）
 *
 * bot.token の値は暗号化して保存する
 */
export class InstallationStore {
  private collection: FirebaseFirestore.CollectionReference;

  constructor(
    db: FirebaseFirestore.Firestore,
    private encryptionSecret: string
  ) {
    this.collection = db.collection("installations");
  }

  async set(installation: Installation): Promise<void> {
    const installationId =
      installation.isEnterpriseInstall && installation.enterprise
        ? installation.enterprise.id
        : installation.team?.id;
    if (!installationId)
      throw new Error("Missing enterprise or team ID in installation");

    if (!installation.bot?.token) throw new Error("Missing bot token");
    const encryptedInstallation: EncryptedInstallation = {
      ...installation,
      bot: {
        ...installation.bot,
        token: encrypt(installation.bot.token, this.encryptionSecret),
      },
    };

    await this.collection.doc(installationId).set(encryptedInstallation);
  }

  async get(
    installationQuery: InstallationQuery<boolean>
  ): Promise<Installation> {
    const doc = await this.collection
      .doc(getInstallationIdFromQuery(installationQuery))
      .get();
    if (!doc.exists) throw new Error("Installation not found");

    const encryptedInstallation = doc.data() as EncryptedInstallation;
    return {
      ...encryptedInstallation,
      bot: {
        ...encryptedInstallation.bot,
        token: decrypt(encryptedInstallation.bot.token, this.encryptionSecret),
      },
    };
  }

  async delete(installationQuery: InstallationQuery<boolean>): Promise<void> {
    await this.collection
      .doc(getInstallationIdFromQuery(installationQuery))
      .delete();
  }
}
