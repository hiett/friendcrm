import { z } from "zod";

const configSchema = z.object({
  serverAddress: z
    // .url({
    //   protocol: new RegExp("^(grpc|grpcs)$"),
    // })
    .string()
    .default("localhost:50051"),
  defaultFormat: z.enum(["json", "yaml"]).default("yaml"),
  combinedDataPath: z.string().optional(),
});

let cachedConfig: z.infer<typeof configSchema> | null = null;

export async function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  // look for ~/.friendcrm.json
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const configPath = `${homeDir}/.friendcrm.json`;
  const file = Bun.file(configPath);
  if (!(await file.exists())) {
    return configSchema.parse({});
  }

  const text = await file.text();
  const parsed = JSON.parse(text);
  cachedConfig = configSchema.parse(parsed);
  return cachedConfig;
}

export async function formatOrDefault(format: "json" | "yaml" | undefined) {
  const config = await getConfig();
  return format ?? config.defaultFormat;
}

export async function isJsonDefault() {
  const config = await getConfig();
  return config.defaultFormat === "json";
}
