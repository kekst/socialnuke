import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

const { srcNodeModulesPath } = webpackPaths;
const { appNodeModulesPath } = webpackPaths;

try {
  fs.unlinkSync(srcNodeModulesPath + '/.yarn-integrity');
} catch {}
try {
  fs.unlinkSync(srcNodeModulesPath);
} catch {}

if (!fs.existsSync(srcNodeModulesPath) && fs.existsSync(appNodeModulesPath)) {
  fs.symlinkSync(appNodeModulesPath, srcNodeModulesPath, 'junction');
}
