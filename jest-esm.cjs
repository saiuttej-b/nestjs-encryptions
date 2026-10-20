const babel = require('@babel/core');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const t = babel.types;

/**
 * Jest on Node before 24.9 cannot require() ESM.
 * Nest 12 ships ESM, including `import.meta`, which Babel's CJS transform leaves
 * in place and Node then rejects inside a CommonJS wrapper.
 */
function replaceImportMeta(filename) {
  return {
    visitor: {
      MetaProperty(nodePath) {
        const { meta, property } = nodePath.node;
        if (meta.name !== 'import' || property.name !== 'meta') {
          return;
        }

        nodePath.replaceWith(
          t.objectExpression([
            t.objectProperty(t.identifier('url'), t.stringLiteral(pathToFileURL(filename).href)),
            t.objectProperty(t.identifier('filename'), t.stringLiteral(filename)),
            t.objectProperty(t.identifier('dirname'), t.stringLiteral(path.dirname(filename))),
          ]),
        );
      },
    },
  };
}

module.exports = {
  process(src, filename) {
    const result = babel.transformSync(src, {
      filename,
      babelrc: false,
      configFile: false,
      sourceMaps: false,
      plugins: [replaceImportMeta(filename)],
      presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
    });

    return { code: result?.code ?? src };
  },
};
