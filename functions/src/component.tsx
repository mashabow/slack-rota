/** @jsx JSXSlack.h **/
import { KnownBlock, View } from "@slack/types";
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
  Overflow,
  OverflowItem,
  RadioButtonGroup,
  RadioButton,
} from "@speee-js/jsx-slack";
import { Rotation } from "./model/rotation";
import { INTERVAL_MINUTES, DAY_STRINGS } from "./model/schedule";

export const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
  DAYS: "days",
  HOUR: "hour",
  MINUTE: "minute",
  MENTION_ALL: "mention_all",
  OVERFLOW_MENU: "overflow_menu",
} as const;

export const SettingModal = ({
  channelId,
}: {
  readonly channelId: string;
}): View =>
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
      <Select id={ID.DAYS} name={ID.DAYS} required multiple label="曜日">
        {DAY_STRINGS.map((s, i) => {
          return <Option value={i.toString()}>{s}曜</Option>;
        })}
      </Select>
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
      <RadioButtonGroup
        id={ID.MENTION_ALL}
        name={ID.MENTION_ALL}
        required
        label="メンション"
        value="true"
      >
        <RadioButton value="true">全員にメンションする</RadioButton>
        <RadioButton value="false">担当者だけにメンションする</RadioButton>
      </RadioButtonGroup>
      <Input type="submit" value="設定する" />
    </Modal>
  );

const Order = ({ rotation }: { readonly rotation: Rotation }) => (
  <Fragment>
    👑 <a href={`@${rotation.onDuty}`} />
    {rotation.getOrderedRestMembers().map((member) => (
      <Fragment>
        {" → "}
        <a href={`@${member}`} />
      </Fragment>
    ))}
  </Fragment>
);

const OverflowMenu = ({
  rotation,
  canRotate,
}: {
  readonly rotation: Rotation;
  readonly canRotate: boolean;
}) => (
  <Overflow actionId={ID.OVERFLOW_MENU}>
    {canRotate && (
      <Fragment>
        <OverflowItem value={`rotate:${rotation.id}`}>ひとつ進む</OverflowItem>
        <OverflowItem value={`unrotate:${rotation.id}`}>
          ひとつ戻る
        </OverflowItem>
        <OverflowItem value={`noop:${rotation.id}`}>
          {/* 「削除」誤クリック防止のため、divider っぽい項目で区切る */}
          ───────────────────
        </OverflowItem>
      </Fragment>
    )}
    <OverflowItem value={`delete:${rotation.id}`}>削除</OverflowItem>
  </Overflow>
);

type Blocks = KnownBlock[];

export const SettingSuccessMessage = ({
  rotation,
  userId,
}: {
  readonly rotation: Rotation;
  readonly userId: string;
}): Blocks =>
  JSXSlack(
    <Blocks>
      <Section>
        <p>
          <a href={`@${userId}`} /> さんがローテーションを設定しました！
        </p>
        <p>{rotation.schedule.toString()} に 👇 のような感じでお知らせします</p>
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
      <Section>
        <blockquote>
          {/* プレビューなので、次回 post 時の順序で表示する */}
          <Order rotation={rotation.rotate()} />
        </blockquote>
        <OverflowMenu rotation={rotation} canRotate={false} />
      </Section>
    </Blocks>
  );

export const RotationMessage = ({
  rotation,
}: {
  readonly rotation: Rotation;
}): Blocks =>
  JSXSlack(
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
        <Order rotation={rotation} />
        <OverflowMenu rotation={rotation} canRotate={true} />
      </Section>
    </Blocks>
  );
