const settingsComponent = {
    template: '#settings-template',
    data: function () {
        return {
            showGeneralSettings: false,
            showOrganizationSettings: false,
            organizationSettingsUpdated: false,
            generalSettingsUpdated: false,
            generalSettings: {
                customerNote: '',
            },
            organizationSettings: {
                legalName: '',
                name: '',
                address: '',
                postalCode: '',
                city: '',
                bank: '',
                accountType: '',
                accountNumber: '',
                email: '',
                phone: '',
                logo: '',
            },
        };
    },
    computed: {
        isComplete: function () {
            if (
                this.organizationSettings.legalName &&
                this.organizationSettings.name &&
                this.organizationSettings.address &&
                this.organizationSettings.postalCode &&
                this.organizationSettings.city &&
                this.organizationSettings.bank &&
                this.organizationSettings.accountType &&
                this.organizationSettings.accountNumber
            ) {
                return true;
            }
        },
    },
    methods: {
        processLogoImage: function (uploadEvent) {
            let file = uploadEvent.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.addEventListener('load', (loadedFile) => {
                    this.organizationSettings.logo = loadedFile.target.result;
                    this.$forceUpdate();
                });
                reader.readAsDataURL(file);
            }
        },
        saveOrganizationSettings: function () {
            this.organizationSettings.subcategory = 'organization';
            db.settings.update({ subcategory: 'organization' }, { ...this.organizationSettings }, (_, settings) => {
                if (settings === 0) {
                    db.settings.insert({ ...this.organizationSettings });
                }
                this.$emit('settingsupdated', false);
                this.organizationSettingsUpdated = false;
            });
        },
        saveGeneralSettings: function () {
            this.generalSettings.subcategory = 'general';
            db.settings.update({ subcategory: 'general' }, { ...this.generalSettings }, (_, settings) => {
                if (settings === 0) {
                    db.settings.insert({ ...this.generalSettings });
                }
                this.$emit('settingsupdated', false);
                this.generalSettingsUpdated = false;
            });
        },
    },
    beforeRouteEnter: function (to, from, next) {
        db.settings.find({}, function (err, settings) {
            if (settings) {
                next((vm) => {
                    var organizationSettings = settings.find((setting) => setting.subcategory === 'organization');
                    var generalSettings = settings.find((setting) => setting.subcategory === 'general');
                    vm.organizationSettings = { ...organizationSettings };
                    vm.generalSettings = { ...generalSettings };
                });
            } else {
                next();
            }
        });
    },
    watch: {
        organizationSettings: {
            handler: function () {
                if (this.showOrganizationSettings) {
                    this.organizationSettingsUpdated = true;
                }
            },
            deep: true,
        },
        generalSettings: {
            handler: function () {
                if (this.showGeneralSettings) {
                    this.generalSettingsUpdated = true;
                }
            },
            deep: true,
        },
    },
};
