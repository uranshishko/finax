function createPdfWindow(data) {
    const BrowserWindow = remote.BrowserWindow;
    const path = remote.require('path');

    const pdfWindow = new BrowserWindow({
        height: 800,
        width: 1100,
        minWidth: 1100,
        maxWidth: 1100,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    pdfWindow.setMenu(null);

    pdfWindow.loadURL(path.join(__dirname, 'pdf.html'));

    pdfWindow.webContents.on('did-finish-load', () => {
        pdfWindow.webContents.send('data', data ? data : null);
    });

    return pdfWindow;
}

function idgenerator() {
    return '#INV-xxxxxxxx'.replace(/[x]/g, function () {
        return Math.floor(Math.random() * 9);
    });
}

const invoicesComponent = {
    template: '#invoices-template',
    data: function () {
        return {
            invoices: null,
            filteredInvoicesList: null,
            searchText: '',
        };
    },
    methods: {
        createNewInvoice: function () {
            router.push({ name: 'invoice', params: { id: 'new' } });
        },
        sum: function (invoice) {
            let sum = 0;
            invoice.rows.forEach((row) => {
                sum = row.price * row.quantity;
                sum += (row.price * row.quantity * row.taxRate) / 100;
            });
            return sum;
        },
        search: function () {
            if (this.searchText === '' || this.searchText.length < 2) {
                this.filteredInvoicesList = null;
                return;
            }

            this.filteredInvoicesList = [];

            const searchInvoice = (field) => {
                for (let row in field) {
                    if (field[row]) {
                        if (typeof field[row] === 'string' && field[row].toLowerCase().includes(this.searchText.toLowerCase())) {
                            this.filteredInvoicesList.push(invoice);
                            break;
                        }

                        if (typeof field[row] === 'object') {
                            return searchInvoice(field[row]);
                        }
                    }
                }
            };

            for (let invoice of this.invoices) {
                searchInvoice(invoice);
            }
        },
    },
    beforeRouteEnter: function (to, from, next) {
        db.invoices.find({}, function (err, invoices) {
            next(function (vm) {
                vm.invoices = [...invoices];
            });
        });
    },
};

let invoiceHasChanged = false;

const invoiceComponent = {
    template: '#invoice-template',
    props: ['settings'],
    data: function () {
        return {
            hasChanged: false,
            invoiceHasLoaded: false,
            rowsHaveLoaded: false,
            pdfWindow: null,
            invoice: {
                number: idgenerator(),
                client: '',
                date: '',
                dueDate: '',
                state: 'draft',
                currency: {},
                rows: [],
                customerNote: '',
            },
            clients: null,
            currency: [
                {
                    symbol: '$',
                    name: 'Dollar',
                },
                {
                    symbol: '€',
                    name: 'Euro',
                },
                {
                    symbol: '£',
                    name: 'Pound',
                },
                {
                    symbol: 'SEK',
                    name: 'Swedish Crown',
                },
            ],
            states: ['payed', 'confirmed', 'void', 'draft', 'overdue'],
            keyStrokes: [],
        };
    },
    methods: {
        addRow: function () {
            this.invoice.rows.push({
                description: '',
                quantity: 0,
                price: 0,
                taxRate: undefined,
            });
        },
        save: function () {
            db.invoices.update({ number: this.invoice.number }, { ...this.invoice }, (err, doc) => {
                if (doc === 0) {
                    db.invoices.insert({ ...this.invoice });
                }
                invoiceHasChanged = false;
                this.hasChanged = false;
            });
        },
        deleteInvoice: function () {
            Confirm('Delete Invoice?', 'Are you sure you want to delete ' + this.invoice.number + '?', ['Delete', null, 'Cancel'], (ok, _, _1) => {
                if (ok) {
                    db.invoices.remove({ number: this.invoice.number }, {}, (err, _) => {
                        if (!err) {
                            router.push('/invoices');
                        }
                    });
                } else {
                    return;
                }
            });
        },
        printPDF: function () {
            if (!this.pdfWindow) {
                this.pdfWindow = createPdfWindow({
                    organization: { ...this.settings.organization },
                    invoice: { ...this.invoice },
                });

                this.pdfWindow.on('close', () => (this.pdfWindow = null));
            } else {
                this.pdfWindow.focus();
            }
        },
        captureKey: function (event) {
            this.keyStrokes.push(event.key);

            if (this.keyStrokes.join('+') === 'Control+s') {
                this.save();
            }
        },
        clearKey: function (event) {
            this.keyStrokes.splice(this.keyStrokes.indexOf(event.key), 1);
        },
    },
    computed: {
        hasInvoiceNumber: function () {
            return this.invoice.number < 1;
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
        rows: function () {
            return this.invoice.rows;
        },
    },
    watch: {
        invoice: {
            handler: function () {
                if (!this.invoiceHasLoaded) {
                    this.invoiceHasLoaded = true;
                } else {
                    invoiceHasChanged = true;
                    this.hasChanged = true;
                }
            },
            deep: true,
        },
        rows: {
            handler: function () {
                if (!this.rowsHaveLoaded) {
                    this.rowsHaveLoaded = true;
                } else {
                    invoiceHasChanged = true;
                    this.hasChanged = true;
                }
            },
            deep: true,
        },
    },
    mounted: function () {
        if (!this.invoice.customerNote) {
            this.invoice.customerNote = this.settings.general.customerNote ? this.settings.general.customerNote : '';
        }

        window.addEventListener('keydown', this.captureKey);
        window.addEventListener('keyup', this.clearKey);
    },
    beforeDestroy: function () {
        window.removeEventListener('keydown', this.captureKey);
        window.removeEventListener('keyup', this.clearKey);
    },
    beforeRouteEnter: function (to, from, next) {
        let invoiceNumber = to.params.id;

        db.clients.find({}, function (err, clients) {
            if (!invoiceNumber || invoiceNumber === 'new') {
                next((vm) => {
                    vm.clients = { ...clients };
                    vm.invoiceHasLoaded = true;
                    vm.rowsHaveLoaded = true;
                });
            } else {
                db.invoices.findOne({ number: invoiceNumber }, function (err, invoice) {
                    next((vm) => {
                        vm.invoice = { ...invoice };
                        vm.invoice.client = clients.find((client) => client._id === vm.invoice.client._id);
                        vm.invoice.rows = [];
                        invoice.rows.forEach((row) => {
                            vm.rows.push({
                                description: row.description,
                                quantity: row.quantity,
                                price: row.price,
                                taxRate: row.taxRate,
                            });
                        });
                        vm.clients = clients;
                    });
                });
            }
        });
    },
};
