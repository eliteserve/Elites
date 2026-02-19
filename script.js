const firebaseConfig = {
    apiKey: "AIzaSyCaTi4EzdMiWEVA6yLG1dSNLWBnEWHm3Ow",
    authDomain: "eliteserveportal.firebaseapp.com",
    projectId: "eliteserveportal",
    storageBucket: "eliteserveportal.firebasestorage.app",
    messagingSenderId: "523778273155",
    appId: "1:523778273155:web:558457cc6ce68200e4d0b6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const app = {
    state: {
        isSignup: false,
        user: null
    },

    init: () => {
        app.ui.observer();
        if(window.emailjs) emailjs.init("YOUR_PUBLIC_KEY");
        
        history.replaceState({ view: 'public' }, '');
        window.onpopstate = (e) => app.router.handle(e.state);

        auth.onAuthStateChanged(user => {
            document.getElementById('loader_overlay').style.display = 'none';
            if (user) {
                app.state.user = user;
                app.data.load(user.uid);
                document.getElementById('nav_public').classList.add('hidden');
                document.getElementById('nav_private').classList.remove('hidden');
                if(history.state?.view !== 'dashboard') {
                    history.pushState({ view: 'dashboard' }, '', '#dashboard');
                    app.router.toDashboard();
                }
            } else {
                app.state.user = null;
                document.getElementById('nav_public').classList.remove('hidden');
                document.getElementById('nav_private').classList.add('hidden');
                if(history.state?.view === 'dashboard') history.back();
            }
        });
    },

    router: {
        handle: (state) => {
            document.getElementById('modal_auth').style.display = 'none';
            if (state?.view === 'dashboard' && app.state.user) app.router.toDashboard();
            else if (state?.view === 'modal') document.getElementById('modal_auth').style.display = 'flex';
            else app.router.toPublic();
        },
        toPublic: () => {
            document.getElementById('view_public').classList.remove('hidden');
            document.getElementById('view_dashboard').classList.add('hidden');
        },
        toDashboard: () => {
            document.getElementById('view_public').classList.add('hidden');
            document.getElementById('view_dashboard').classList.remove('hidden');
            window.scrollTo(0, 0);
            setTimeout(app.ui.observer, 100);
        }
    },

    auth: {
        trigger: (mode) => {
            app.state.isSignup = (mode === 'signup');
            app.auth.updateUI();
            document.getElementById('modal_auth').style.display = 'flex';
            history.pushState({ view: 'modal' }, '', '#auth');
        },
        toggle: () => {
            app.state.isSignup = !app.state.isSignup;
            app.auth.updateUI();
        },
        updateUI: () => {
            const isSign = app.state.isSignup;
            document.getElementById('modal_title').innerText = isSign ? "Partner Registration" : "Partner Login";
            document.getElementById('btn_auth_action').innerText = isSign ? "Create Account" : "Access Dashboard";
            document.getElementById('txt_toggle').innerText = isSign ? "Already have an account? Log In" : "New Partner? Register";
            isSign ? document.getElementById('fields_signup').classList.remove('hidden') : document.getElementById('fields_signup').classList.add('hidden');
        },
        execute: async () => {
            const email = document.getElementById('inp_email').value;
            const pass = document.getElementById('inp_pass').value;
            const btn = document.getElementById('btn_auth_action');

            if (!email || !pass) return alert("Credentials required.");
            btn.innerText = "Processing..."; btn.disabled = true;

            try {
                if (app.state.isSignup) {
                    const name = document.getElementById('inp_name').value;
                    const phone = document.getElementById('inp_phone').value;
                    const cred = await auth.createUserWithEmailAndPassword(email, pass);
                    await db.collection('users').doc(cred.user.uid).set({ name, phone, email, joined: new Date() });
                } else {
                    await auth.signInWithEmailAndPassword(email, pass);
                }
            } catch (err) {
                alert(err.message);
                btn.innerText = "Try Again"; btn.disabled = false;
            }
        },
        logout: () => {
            auth.signOut();
            history.pushState({ view: 'public' }, '', ' ');
            app.router.toPublic();
        }
    },

    data: {
        load: async (uid) => {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                const d = doc.data();
                document.getElementById('display_name').innerText = d.name.split(' ')[0];
                document.getElementById('dash_name').innerText = d.name;
                document.getElementById('dash_phone').innerText = d.phone;
            }
        }
    },

    dash: {
        submit: () => {
            const btn = document.querySelector('#requisition_form button');
            const status = document.getElementById('req_status');
            btn.innerHTML = 'Transmitting...';
            setTimeout(() => {
                btn.innerHTML = 'Request Transmitted';
                btn.style.background = '#4CAF50';
                status.innerHTML = '<span style="color:#4CAF50">Requirement received.</span>';
                setTimeout(() => {
                    btn.innerHTML = 'Transmit Request';
                    btn.style.background = '';
                    status.innerHTML = '';
                    document.getElementById('requisition_form').reset();
                }, 3000);
            }, 1500);
        }
    },

    ui: {
        observer: () => {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active-reveal'); });
            }, { threshold: 0.1 });
            document.querySelectorAll('.reveal-up, .reveal-left').forEach(el => obs.observe(el));
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
