const clientsComponent = {
    template: '#clients-template',
    data: function () {
        return {
            clients: null,
            filteredClientsList: null,
            searchText: '',
        };
    },
    methods: {
        createNewClient: function () {
            router.push({ name: 'client', params: { id: 'new' } });
        },
        search: function () {
            if (this.searchText === '' || this.searchText.length < 2) {
                this.filteredClientsList = null;
                return;
            }

            this.filteredClientsList = [];
            for (let client of this.clients) {
                for (let field in client) {
                    if (typeof client[field] === 'string' && client[field].toLowerCase().includes(this.searchText.toLowerCase())) {
                        this.filteredClientsList.push(client);
                        break;
                    }
                }
            }
        },
    },
    beforeRouteEnter: function (to, from, next) {
        db.clients.find({}, function (err, clients) {
            next(function (vm) {
                vm.clients = [...clients];
            });
        });
    },
};

let clientHasChanged = false;

const clientComponent = {
    template: '#client-template',
    data: function () {
        return {
            isOpen: false,
            hasChanged: false,
            client: {
                legalName: '',
                name: '',
                address: '',
                postalCode: '',
                city: '',
                email: '',
                phone: '',
            },
            keyStrokes: [],
        };
    },
    methods: {
        save: function () {
            db.clients.update({ _id: this.client._id }, { ...this.client }, (err, doc) => {
                if (doc === 0) {
                    db.clients.insert({ ...this.client });
                }
                clientHasChanged = false;
                this.hasChanged = false;
            });
        },
        deleteClient: function () {
            Confirm('Delete Client?', 'Are you sure you want to delete ' + this.client.legalName + '?', ['Delete', null, 'Cancel'], (ok, _, _1) => {
                if (ok) {
                    db.clients.remove({ _id: this.client._id }, {}, (err, _) => {
                        if (!err) {
                            router.push('/clients');
                        }
                    });
                } else {
                    return;
                }
            });
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
        isComplete: function () {
            if (this.client.legalName && this.client.name && this.client.address && this.client.postalCode && this.client.city) {
                return true;
            }
        },
    },
    watch: {
        client: {
            handler() {
                if (!this.isOpen) {
                    this.isOpen = true;
                } else {
                    clientHasChanged = true;
                    this.hasChanged = true;
                }
            },
            deep: true,
        },
    },
    mounted: function () {
        window.addEventListener('keydown', this.captureKey);
        window.addEventListener('keyup', this.clearKey);
    },
    beforeDestroy: function () {
        window.removeEventListener('keydown', this.captureKey);
        window.removeEventListener('keyup', this.clearKey);
    },
    beforeRouteEnter: function (to, from, next) {
        let clientID = to.params.id;

        if (!clientID || clientID === 'new') {
            return next();
        } else {
            db.clients.findOne({ _id: clientID }, function (err, client) {
                next((vm) => {
                    vm.client = { ...client };
                });
            });
        }
    },
};
