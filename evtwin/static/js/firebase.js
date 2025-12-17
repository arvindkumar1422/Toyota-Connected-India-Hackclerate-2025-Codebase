// firebase.js
// Modern Firebase v9+ modular API for authentication
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then((result) => {
        fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'login', user: result.user.email, details: 'Google login' })
        });
        window.location.href = '/dashboard';
    });
}
window.loginWithGoogle = loginWithGoogle;

function logout() {
    signOut(auth).then(() => {
        fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'logout', user: '', details: 'User signed out' })
        });
        window.location.href = '/';
    });
}
window.logout = logout;

// Protect dashboard and security routes
if (window.location.pathname === '/dashboard' || window.location.pathname === '/security') {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = '/';
        } else {
            // Show user info
            let header = document.querySelector('.header');
            if (header && !document.getElementById('user-info')) {
                let info = document.createElement('span');
                info.id = 'user-info';
                info.style.float = 'right';
                info.style.fontSize = '1rem';
                info.style.marginLeft = '2rem';
                info.innerHTML = `<img src='${user.photoURL}' alt='User' style='width:28px;height:28px;border-radius:50%;vertical-align:middle;margin-right:8px;'>${user.displayName} <button onclick='logout()' style='margin-left:8px;'>Sign Out</button>`;
                header.appendChild(info);
            }
        }
    });
} 