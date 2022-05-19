/* eslint-disable node/no-unpublished-require */
/* eslint-disable node/no-missing-require */
import { VALID_LOCALES } from "@yari-internal/constants";

import fs from "fs";
import path from "path";

// eslint-disable-next-line node/no-unpublished-import
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const dirname = fileURLToPath(new URL(".", import.meta.url));
const root = path.join(dirname, "..", "..", "..");
dotenv.config({
  path: path.join(root, process.env.ENV_FILE || ".env"),
});

function buildRedirectsMap() {
  const redirectMap = new Map();

  ["CONTENT_ROOT", "CONTENT_TRANSLATED_ROOT"].forEach((envvar) => {
    if (!process.env[envvar]) {
      console.error(`Missing ENV variable: ${envvar}`);
      return;
    }

    const base = process.env[envvar];

    VALID_LOCALES.forEach((locale) => {
      const path = [
        // Absolute path.
        `${base}/${locale}/_redirects.txt`,
        `${base}/files/${locale}/_redirects.txt`,
        // Relative path.
        `${root}/${base}/${locale}/_redirects.txt`,
        `${root}/${base}/files/${locale}/_redirects.txt`,
      ].find((path) => fs.existsSync(path));

      if (path) {
        const content = fs.readFileSync(path, "utf8");
        const lines = content.split("\n");
        const redirectLines = lines.filter(
          (line) => line.startsWith("/") && line.includes("\t")
        );
        for (const redirectLine of redirectLines) {
          const [source, target] = redirectLine.split("\t", 2);
          redirectMap.set(source.toLowerCase(), target);
        }
      }
    });
  });

  const output = "redirects.json";

  fs.writeFileSync(output, JSON.stringify(Object.fromEntries(redirectMap)));

  const count = redirectMap.size;
  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`Wrote ${count} redirects in ${kb} KB.`);
}

buildRedirectsMap();