import { KnownBlock, View } from "@slack/bolt";
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
  Mrkdwn,
  Overflow,
  OverflowItem,
  RadioButtonGroup,
  RadioButton,
} from "jsx-slack";
import { Rotation } from "./models/rotation";
import { INTERVAL_MINUTES, DAY_STRINGS } from "./models/schedule";

export const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  ROTATION_ID: "rotation_id",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
  DAYS: "days",
  HOUR: "hour",
  MINUTE: "minute",
  MENTION_ALL: "mention_all",
  OVERFLOW_MENU: "overflow_menu",
} as const;

export const RotationModal = ({
  channelId,
  rotation,
}: {
  readonly channelId: string;
  readonly rotation?: Rotation;
}): View =>
  JSXSlack(
    <Modal
      callbackId={ID.SUBMIT_CALLBACK}
      title={rotation ? "ローテーション編集" : "ローテーション作成"}
      close="キャンセル"
    >
      <Input type="hidden" name={ID.ROTATION_ID} value={rotation?.id} />
      <UsersSelect
        id={ID.MEMBERS}
        name={ID.MEMBERS}
        required
        multiple
        label="メンバー"
        placeholder="ローテーションさせる順番で選択してください"
        value={rotation?.members as string[]}
      />
      <Textarea
        id={ID.MESSAGE}
        name={ID.MESSAGE}
        required
        label="メッセージ"
        placeholder="お知らせする本文です。Slack の mrkdwn が使えます"
        value={rotation?.message}
      />
      <Input type="hidden" name={ID.CHANNEL} value={channelId} />
      <Select
        id={ID.DAYS}
        name={ID.DAYS}
        required
        multiple
        label="曜日"
        placeholder="複数選択可能です"
        value={rotation?.schedule.days.map((day) => day.toString())}
      >
        {DAY_STRINGS.map((s, i) => {
          return <Option value={i.toString()}>{s}曜</Option>;
        })}
      </Select>
      <Select
        id={ID.HOUR}
        name={ID.HOUR}
        required
        label="時"
        value={(rotation?.schedule.hour ?? 10).toString()}
      >
        {[...Array(24)].map((_, i) => {
          const hour = i.toString();
          return <Option value={hour}>{hour}時</Option>;
        })}
      </Select>
      <Select
        id={ID.MINUTE}
        name={ID.MINUTE}
        required
        label="分"
        value={(rotation?.schedule.minute ?? 0).toString()}
      >
        {[...Array(60 / INTERVAL_MINUTES)].map((_, i) => {
          const minute = (i * INTERVAL_MINUTES).toString();
          return <Option value={minute}>{minute}分</Option>;
        })}
      </Select>
      <RadioButtonGroup
        id={ID.MENTION_ALL}
        name={ID.MENTION_ALL}
        required
        label="メンション"
        value={(rotation?.mentionAll ?? true).toString()}
      >
        <RadioButton value="true">全員にメンションする</RadioButton>
        <RadioButton value="false">担当者だけにメンションする</RadioButton>
      </RadioButtonGroup>
      <Input type="submit" value={rotation ? "保存する" : "作成する"} />
    </Modal>
  );

const Order = ({
  rotation,
  userNameDict,
}: {
  readonly rotation: Rotation;
  readonly userNameDict: Record<string, string> | null;
}) => (
  <>
    👑 <a href={`@${rotation.members[0]}`} />
    {rotation.members.slice(1).map((member) => (
      <>
        {" → "}
        {/* 念のため、条件に !userNameDict を含めてはいるが、
            mentionAll が false の場合は、本当は userNameDict が存在するはず */}
        {rotation.mentionAll || !userNameDict ? (
          <a href={`@${member}`} />
        ) : (
          `@${userNameDict[member]}`
        )}
      </>
    ))}
  </>
);

const OverflowMenu = ({
  rotation,
  canRotate,
}: {
  readonly rotation: Rotation;
  readonly canRotate: boolean;
}) => (
  <Overflow actionId={ID.OVERFLOW_MENU}>
    <OverflowItem value={`edit:${rotation.id}`}>編集</OverflowItem>
    {canRotate && (
      <>
        <OverflowItem value={`rotate:${rotation.id}`}>ひとつ進む</OverflowItem>
        <OverflowItem value={`unrotate:${rotation.id}`}>
          ひとつ戻る
        </OverflowItem>
      </>
    )}
    <OverflowItem value={`noop:${rotation.id}`}>
      {/* 「削除」誤クリック防止のため、divider っぽい項目で区切る */}
      ───────────────────
    </OverflowItem>
    <OverflowItem value={`delete:${rotation.id}`}>削除</OverflowItem>
  </Overflow>
);

type Blocks = KnownBlock[];

export const SuccessMessage = ({
  rotation,
  userId,
  userNameDict,
  isUpdate,
}: {
  readonly rotation: Rotation;
  readonly userId: string;
  readonly userNameDict: Record<string, string> | null;
  readonly isUpdate: boolean;
}): Blocks =>
  JSXSlack(
    <Blocks>
      <Section>
        <p>
          <a href={`@${userId}`} /> さんがローテーションを
          {isUpdate ? "編集" : "作成"}しました！
        </p>
        <p>{rotation.schedule.toString()} に 👇 のような感じでお知らせします</p>
      </Section>
      <Section>
        <Mrkdwn raw verbatim={false}>
          {rotation.message
            .split("\n")
            .map((line) => `&gt; ${line}`)
            .join("\n")}
        </Mrkdwn>
      </Section>
      <Section>
        <blockquote>
          {/* プレビューなので、次回 post 時の順序で表示する */}
          <Order rotation={rotation.rotate()} userNameDict={userNameDict} />
        </blockquote>
        <OverflowMenu rotation={rotation} canRotate={false} />
      </Section>
    </Blocks>
  );

export const RotationMessage = ({
  rotation,
  userNameDict,
}: {
  readonly rotation: Rotation;
  readonly userNameDict: Record<string, string> | null;
}): Blocks =>
  JSXSlack(
    <Blocks>
      <Section>
        <Mrkdwn raw verbatim={false}>
          {rotation.message}
        </Mrkdwn>
      </Section>
      <Section>
        <Order rotation={rotation} userNameDict={userNameDict} />
        <OverflowMenu rotation={rotation} canRotate={true} />
      </Section>
    </Blocks>
  );
