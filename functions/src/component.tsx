/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Modal,
  Input,
  Textarea,
  UsersSelect,
  Blocks,
  Section,
  Select,
  Option,
  Fragment,
  Mrkdwn,
} from "@speee-js/jsx-slack";
import { Rotation, INTERVAL_MINUTES } from "./rotation";

export const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
  HOUR: "hour",
  MINUTE: "minute",
} as const;

export const SettingModal = ({ channelId }: { readonly channelId: string }) =>
  JSXSlack(
    <Modal callbackId={ID.SUBMIT_CALLBACK} title="Rota" close="キャンセル">
      <UsersSelect
        id={ID.MEMBERS}
        name={ID.MEMBERS}
        required
        multiple
        label="メンバー"
      />
      <Textarea id={ID.MESSAGE} name={ID.MESSAGE} required label="メッセージ" />
      <Input type="hidden" name={ID.CHANNEL} value={channelId} />
      {/* TODO: 曜日指定 */}
      <Select id={ID.HOUR} name={ID.HOUR} required label="時" value="10">
        {[...Array(24)].map((_, i) => {
          const hour = i.toString();
          return <Option value={hour}>{hour}時</Option>;
        })}
      </Select>
      <Select id={ID.MINUTE} name={ID.MINUTE} required label="分" value="0">
        {[...Array(60 / INTERVAL_MINUTES)].map((_, i) => {
          const minute = (i * INTERVAL_MINUTES).toString();
          return <Option value={minute}>{minute}分</Option>;
        })}
      </Select>
      <Input type="submit" value="設定する" />
    </Modal>
  );

export const SettingSuccessMessage = ({
  rotation,
  userId,
}: {
  readonly rotation: Rotation;
  readonly userId: string;
}) =>
  JSXSlack(
    <Blocks>
      <Section>
        <p>
          <a href={`@${userId}`} /> さんがローテーションを設定しました！
        </p>
        <p>
          {rotation.hour}:{rotation.minute.toString().padStart(2, "0")} に 👇
          のような感じでお知らせします
        </p>
      </Section>
      <Section>
        <Mrkdwn verbatim={false}>
          {rotation.message.split("\n").map((line) => (
            <Fragment>
              &gt; {line}
              <br />
            </Fragment>
          ))}
        </Mrkdwn>
      </Section>
    </Blocks>
  );

export const RotationMessage = ({
  rotation,
}: {
  readonly rotation: Rotation;
}) => {
  const index = rotation.members.indexOf(rotation.onDuty);
  const restMembers = [
    ...rotation.members.slice(index + 1),
    ...rotation.members.slice(0, index),
  ];
  return JSXSlack(
    <Blocks>
      <Section>
        <Mrkdwn verbatim={false}>
          {rotation.message.split("\n").map((line) => (
            <Fragment>
              {line}
              <br />
            </Fragment>
          ))}
        </Mrkdwn>
      </Section>
      <Section>
        👑 <a href={`@${rotation.onDuty}`} />
        {restMembers.map((member) => (
          <Fragment>
            {" → "}
            <a href={`@${member}`} />
          </Fragment>
        ))}
      </Section>
    </Blocks>
  );
};
