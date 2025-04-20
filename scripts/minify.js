import * as esbuild from "esbuild";

import process, { argv } from "node:process";

const buildForProd = async () => {
  const commonESMOptions = {
    bundle: true,
    outdir: "dist",
    outExtension: {
      ".js": ".esm.js",
    },
    minify: true,
    format: "esm",
  };

  // Build esm files.
  await esbuild.build({
    ...commonESMOptions,
    entryPoints: [`${process.cwd()}/src/index.js`],
    entryNames: "index",
  });
  await esbuild.build({
    ...commonESMOptions,
    entryPoints: [
      `${process.cwd()}/src/customElements/index.js`,
      `${process.cwd()}/src/helpers/index.js`,
    ],
    entryNames: "/[dir]",
  });

  const commonIIFEOptions = {
    bundle: true,
    outdir: "dist",
    minify: true,
    format: "iife",
    entryNames: "/[dir]",
    outExtension: {
      ".js": ".iife.js",
    },
    globalName: "WebControllers",
  };

  await esbuild.build({
    ...commonIIFEOptions,
    entryPoints: [`${process.cwd()}/src/index.js`],
    entryNames: "index",
  });
  await esbuild.build({
    ...commonIIFEOptions,
    entryPoints: [
      `${process.cwd()}/src/customElements/index.js`,
      `${process.cwd()}/src/helpers/index.js`,
    ],
    entryNames: "/[dir]",
  });

  await esbuild.build({
    entryPoints: [`${process.cwd()}/src/_barrel.js`],
    bundle: true,
    outfile: "dist/bundled/web-controllers.esm.js",
    minify: true,
    format: "esm",
  });

  await esbuild.build({
    entryPoints: [`${process.cwd()}/src/_barrel.js`],
    bundle: true,
    outfile: "dist/bundled/web-controllers.iife.js",
    minify: true,
    format: "iife",
    globalName: "WebControllers",
  });
};

if (argv.at(2) === "dev") {
  const ctx = await esbuild.context({
    entryPoints: [`${process.cwd()}/src/_barrel.js`],
    bundle: true,
    outfile: "dist/bundled/web-controllers.esm.js",
    minify: true,
    format: "esm",
  });

  ctx.watch();
} else {
  buildForProd();
}
