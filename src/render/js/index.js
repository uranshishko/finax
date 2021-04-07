const remote = require('electron').remote;
const db = remote.require('./db/db');

function Confirm(title, msg, buttons, cb) {
    let modal = `
    <div class="modal_popup">
        <div class="modal_popup_title">
            <p>${title}</p>
        </div>
        <div class="modal_popup_msg">
            <p>${msg}</p>
        </div>
        <div class="modal_popup_btns">
            ${buttons[0] ? '<button class="modal_popup_btns_primary">' + buttons[0] + '</button>' : ''}
            ${buttons[1] ? '<button class="modal_popup_btns_secondary">' + buttons[1] + '</button>' : ''}
            ${buttons[2] ? '<button class="modal_popup_btns_tertiary">' + buttons[2] + '</button>' : ''}
        </div>
    </div>
  `;

    let modal_bkg = document.createElement('div');
    modal_bkg.className = 'modal';
    modal_bkg.innerHTML = modal;

    document.getElementById('app').appendChild(modal_bkg);

    let primaryBtn = document.querySelector('.modal_popup_btns_primary');
    let secondaryBtn = document.querySelector('.modal_popup_btns_secondary');
    let tertieryBtn = document.querySelector('.modal_popup_btns_tertiary');

    if (primaryBtn) {
        primaryBtn.onclick = function () {
            cb(true, null, null);
            modal_bkg.remove();
        };
    }

    if (secondaryBtn) {
        secondaryBtn.onclick = function () {
            cb(null, true, null);
            modal_bkg.remove();
        };
    }

    if (tertieryBtn) {
        tertieryBtn.onclick = function () {
            cb(null, null, true);
            modal_bkg.remove();
        };
    }
}

const sideBarComponent = {
    template: '#side-bar-template',
    props: ['showmenu', 'isdisabled'],
};

const routes = [
    { path: '/invoices', component: invoicesComponent },
    { path: '/clients', component: clientsComponent },
    { path: '/settings', component: settingsComponent },
    { path: '/invoice/:id', name: 'invoice', component: invoiceComponent },
    { path: '/client/:id', name: 'client', component: clientComponent },
];

const router = new VueRouter({
    routes: routes,
});

router.beforeEach(function (to, from, next) {
    if (from.name === 'invoice') {
        if (invoiceHasChanged) {
            Confirm('Quit editing?', 'Changes you made so far will not be saved', ['OK', null, 'Cancel'], function (ok, _, _1) {
                if (ok) {
                    invoiceHasChanged = false;
                    next();
                } else {
                    next(false);
                }
            });
        } else {
            next();
        }
    } else if (from.name === 'client') {
        if (clientHasChanged) {
            Confirm('Quit editing?', 'Changes you made so far will not be saved', ['OK', null, 'Cancel'], function (ok, _, _1) {
                if (ok) {
                    clientHasChanged = false;
                    next();
                } else {
                    next(false);
                }
            });
        } else {
            next();
        }
    } else {
        next();
    }
});

const app = new Vue({
    // el: '#app',
    router: router,
    components: {
        'side-bar': sideBarComponent,
    },
    data: {
        showMenu: true,
        username: '',
        isSettingsConfigured: false,
        loadWindow: null,
        settings: null,
    },
    beforeMount: function () {
        this.loadWindow = document.createElement('div');
        this.loadWindow.innerHTML = '<div><div class="loading_wheel"></div></div>';
        Object.assign(this.loadWindow.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: '#fefefe',
            top: '0',
            left: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10',
        });
        document.body.appendChild(this.loadWindow);
    },
    mounted: function () {
        if (this.$route.path === '/') {
            this.updateSettings();
        }

        setTimeout(() => this.loadWindow.remove(), 1300);
    },
    computed: {
        currentRoute: function () {
            return this.$route;
        },
        organizationName: function () {
            if (this.settings && this.settings.organization) {
                return this.settings.organization.name;
            }
            return '';
        },
    },
    methods: {
        updateSettings: function (redirect = true) {
            db.settings.find({}, (_, settings) => {
                let organizationSettings = settings.find((setting) => setting.subcategory === 'organization');
                let generalSettings = settings.find((setting) => setting.subcategory === 'general');
                if (!organizationSettings) {
                    if (redirect) {
                        router.push('/settings');
                    }
                } else {
                    this.isSettingsConfigured = true;
                    this.settings = {
                        general: { ...generalSettings },
                        organization: { ...organizationSettings },
                    };
                    if (redirect) {
                        router.push('/invoices');
                    }
                }
            });
        },
    },
});

router.onReady(() => app.$mount('#app'));
