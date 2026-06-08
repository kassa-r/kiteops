import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const appDir = process.cwd();

describe('Project Structure and Dependencies', () => {
  it('should have package.json containing typescript, tailwindcss, and eslint as devDependencies', () => {
    const packageJsonPath = path.join(appDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('tailwindcss');
    expect(packageJson.devDependencies).toHaveProperty('eslint');
  });

  it('should have eslint.config.mjs', () => {
    const eslintConfigPath = path.join(appDir, 'eslint.config.mjs');
    expect(fs.existsSync(eslintConfigPath)).toBe(true);
  });

  it('should have tailwindcss configured via postcss.config.mjs or globals.css', () => {
    const postcssConfigPath = path.join(appDir, 'postcss.config.mjs');
    const globalsCssPath = path.join(appDir, 'app/globals.css');

    // Check if postcss.config.mjs exists and contains tailwindcss
    if (fs.existsSync(postcssConfigPath)) {
      const postcssConfig = fs.readFileSync(postcssConfigPath, 'utf-8');
      expect(postcssConfig).toContain('tailwindcss');
    } else if (fs.existsSync(globalsCssPath)) {
      // If postcss.config.mjs doesn't exist, check globals.css for tailwind directives
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');
      expect(globalsCss).toContain('@tailwind base');
      expect(globalsCss).toContain('@tailwind components');
      expect(globalsCss).toContain('@tailwind utilities');
    } else {
      // Neither file found, fail the test
      expect(true).toBe(false); // Force fail
    }
  });
});