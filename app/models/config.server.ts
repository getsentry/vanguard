import type { Config } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Config } from "@prisma/client";

export async function getConfig(key: Config["key"], defaultValue: any = null) {
  const result = await prisma.config.findUnique({ where: { key } });
  if (!result) return defaultValue;
  return JSON.parse(result.value);
}

export async function setConfig(key: Config["key"], value: Config["value"]) {
  return await prisma.config.upsert({
    where: {
      key,
    },
    update: {
      value: JSON.stringify(value),
    },
    create: {
      key,
      value: JSON.stringify(value),
    },
  });
}

export async function deleteConfig(key: Config["key"]) {
  return await prisma.config.delete({
    where: {
      key,
    },
  });
}
