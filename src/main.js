const { BrowserWindow, app, Menu } = require('electron');
const path = require('path');

const isMac = process.platform === 'darwin';

var mainWindow = {
    height: 800,
    width: 1200,
    minWidth: 1100,
    minHeight: 600,
    hide: true,
    icon: path.join(__dirname, 'resources', 'logo', 'Finax_logo.svg'),
    webPreferences: {
        nodeIntegration: true,
    },
};

function createWindow(config) {
    let win = new BrowserWindow(config);

    win.loadFile(path.join(__dirname, 'render', 'html', 'index.html'));

    win.once('ready-to-show', function () {
        win.show();
    });
}

var mw;

app.whenReady().then(() => {
    mw = createWindow(mainWindow);
});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const template = [
    // { role: 'appMenu' }
    ...(isMac
        ? [
              {
                  label: app.name,
                  submenu: [
                      { role: 'about' },
                      { type: 'separator' },
                      { role: 'services' },
                      { type: 'separator' },
                      { role: 'hide' },
                      { role: 'hideothers' },
                      { role: 'unhide' },
                      { type: 'separator' },
                      { role: 'quit' },
                  ],
              },
          ]
        : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                      { role: 'pasteAndMatchStyle' },
                      { role: 'delete' },
                      { role: 'selectAll' },
                      { type: 'separator' },
                      {
                          label: 'Speech',
                          submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
                      },
                  ]
                : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
        ],
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [{ role: 'togglefullscreen' }],
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }] : [{ role: 'close' }]),
        ],
    },
    /* {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://electronjs.org');
                },
            },
        ],
    }, */
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
