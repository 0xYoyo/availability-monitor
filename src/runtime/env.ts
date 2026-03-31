import { existsSync } from "node:fs";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

export function loadRuntimeEnvironment(configPath: string): void {
  const configDirectory = path.dirname(configPath);
  const candidatePaths = new Set<string>([
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(configDirectory, ".env"),
    path.resolve(configDirectory, ".env.local")
  ]);

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    loadDotenv({
      path: candidatePath,
      override: false
    });
  }
}

