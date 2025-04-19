import * as esbuild from "esbuild";

import process, { argv } from "node:process";

const buildForProd = async () => {
  await esbuild.build({
    entryPoints: [`${process.cwd()}/src/index.js`],
    bundle: true,
    outfile: "dist/web-controllers.esm.js",
    minify: true,
    format: "esm",
  });

  await esbuild.build({
    entryPoints: [`${process.cwd()}/src/index.js`],
    bundle: true,
    outfile: "dist/web-controllers.iife.js",
    minify: true,
    format: "iife",
    globalName: "WebControllers",
  });
};

if (argv.at(2) === "dev") {
  const ctx = await esbuild.context({
    entryPoints: [`${process.cwd()}/src/index.js`],
    bundle: true,
    outfile: "dist/web-controllers.esm.js",
    minify: true,
    format: "esm",
  });

  ctx.watch();
} else {
  buildForProd();
}
