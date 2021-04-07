const path = require('path');

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
    await Build({
        icon: path.join(__dirname, 'render', 'resources', 'logo', 'Finax-logo.ico'),
        name: 'Finax',
        out: outDir,
        dir: path.join(__dirname, '..'),
        platform,
        prune: true,
    });
})();
