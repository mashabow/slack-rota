import { AnyMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";

// https://github.com/slackapi/bolt-js/blob/1c1eb57881024eba1880d84782bcb54ac26b37b5/src/App.ts#L1152-L1169 より移植
export const isBodyWithTypeEnterpriseInstall = (
  body: AnyMiddlewareArgs["body"]
): boolean => {
  if ("event" in body) {
    const bodyAsEvent = body as SlackEventMiddlewareArgs["body"];
    if (
      Array.isArray(bodyAsEvent.authorizations) &&
      bodyAsEvent.authorizations[0] !== undefined
    ) {
      return !!bodyAsEvent.authorizations[0].is_enterprise_install;
    }
  }
  // command payloads have this property set as a string
  if (typeof body.is_enterprise_install === "string") {
    return body.is_enterprise_install === "true";
  }
  // all remaining types have a boolean property
  if (body.is_enterprise_install !== undefined) {
    return body.is_enterprise_install;
  }
  // as a fallback we assume it's a single team installation (but this should never happen)
  return false;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types
type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
