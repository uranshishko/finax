const path = require('path');
const { existsSync } = require('fs');

const packager = require('electron-packager');

const outDir = process.argv[2] !== undefined ? process.argv[2] : '.';

const platform = process.argv[3] !== undefined ? process.argv[3] : process.platform;

async function Build(options) {
    try {
        const appPaths = await packager(options);
        console.log(`Electron app bundles created:\n${appPaths.join('\n')}`);
    } catch (e) {
        console.log('Error: ' + e);
    }
}

(async () => {
    const outDirExists = existsSync(outDir);

    if (!outDirExists) {
        throw new Error('Out directory path provided does not exist');
    }

    await Build({
        icon: path.join(__dirname, 'render', 'resources', 'logo', 'Finax_logo' + (platform.includes('win') ? '.ico' : 'png')),
        name: 'Finax',
        out: outDir,
        dir: path.join(__dirname, '..'),
        platform,
        prune: true,
    });
})();
