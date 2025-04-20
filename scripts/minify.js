import * as esbuild from "esbuild";
import process from "node:process";

await esbuild.build({
  entryPoints: [`${process.cwd()}/src/_barrel.js`],
  bundle: true,
  outfile: "dist/web-controllers.esm.js",
  minify: true,
  format: "esm",
});

await esbuild.build({
  entryPoints: [`${process.cwd()}/src/_barrel.js`],
  bundle: true,
  outfile: "dist/web-controllers.iife.js",
  minify: true,
  format: "iife",
  globalName: "WebControllers",
});
