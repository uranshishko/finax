(() => {
    const electron = require('electron');
    const ipcRenderer = electron.ipcRenderer;
    const BrowserWindow = electron.remote.BrowserWindow;
    const dialog = electron.remote.dialog;
    const fs = electron.remote.require('fs');

    ipcRenderer.on('data', (_, data) => {
        document.title = 'Invoice ' + data.invoice.number;

        new Vue({
            el: '#app',
            data: { ...data, scrolled: false, isPrinting: false },
            mounted: function () {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 200) {
                        this.scrolled = true;
                    } else {
                        this.scrolled = false;
                    }
                });
            },
            computed: {
                termsOfPayment: function () {
                    return Math.floor((Date.parse(this.invoice.dueDate) - Date.parse(this.invoice.date)) / 1000 / 60 / 60 / 24);
                },
                subTotal: function () {
                    let sum = 0;
                    this.invoice.rows.forEach((row) => {
                        sum += row.quantity * row.price;
                    });
                    return sum;
                },
                tax: function () {
                    let tax = 0;
                    this.invoice.rows.forEach((row) => {
                        tax += row.price * row.quantity * (row.taxRate / 100);
                    });
                    return tax;
                },
                total: function () {
                    return this.subTotal + this.tax;
                },
                moveUpInvoice: function () {
                    if (this.isPrinting) {
                        return {
                            marginTop: '-60px',
                        };
                    } else {
                        return null;
                    }
                },
                rows: function () {
                    return this.invoice.rows;
                },
                customerNote: function () {
                    return this.invoice.customerNote
                        .split('\n')
                        .map((row) => {
                            return `<p>${row}</p>`;
                        })
                        .join('');
                },
            },
            methods: {
                print: function () {
                    let self = this;
                    this.isPrinting = true;
                    let options = {
                        marginsType: 0,
                        pageSize: 'A4',
                        printBackground: true,
                        printSelectionOnly: false,
                        landscape: false,
                    };

                    let currentWindow = BrowserWindow.getFocusedWindow();

                    currentWindow.webContents.printToPDF(options).then((data) => {
                        let options = {
                            title: 'Save file',
                            defaultPath: self.invoice.number,
                            buttonLabel: 'Save',

                            filters: [
                                { name: 'pdf', extensions: ['pdf'] },
                                { name: 'All Files', extensions: ['*'] },
                            ],
                        };

                        dialog.showSaveDialog(null, options).then(({ filePath }) => {
                            if (filePath) {
                                fs.writeFileSync(filePath, data);
                            }

                            self.isPrinting = false;
                        });
                    });
                },
            },
        });
    });
})();
