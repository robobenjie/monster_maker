class FirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.ui = null;
        this.listeners = {
            authState: [],
            dataChange: []
        };
    }

    init(config) {
        firebase.initializeApp(config);
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.ui = new firebaseui.auth.AuthUI(this.auth);

        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.listeners.authState.forEach(callback => callback(user));
        });
    }

    // Auth methods
    initUI(containerId, options = {}) {
        const defaultConfig = {
            signInOptions: [
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
            ],
            callbacks: {
                signInSuccessWithAuthResult: (authResult) => {
                    console.log('Sign-in successful:', authResult);
                    return false; // Prevent redirect
                }
            },
            signInFlow: 'popup'
        };

        this.ui.start(containerId, { ...defaultConfig, ...options });
    }

    onAuthStateChanged(callback) {
        this.listeners.authState.push(callback);
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    async logout() {
        await this.auth.signOut();
    }

    // Data methods
    async saveData(path, data) {
        if (!this.getCurrentUser()) {
            throw new Error('User must be logged in to save data');
        }

        try {
            await this.db.doc(path).set({
                json: JSON.stringify(data),
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    async getData(path) {
        try {
            const doc = await this.db.doc(path).get();
            if (doc.exists) {
                return JSON.parse(doc.data().json);
            }
            return null;
        } catch (error) {
            console.error('Error getting data:', error);
            throw error;
        }
    }

    async listData(collectionPath) {
        try {
            const snapshot = await this.db.collection(collectionPath).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error listing data:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const firebaseService = new FirebaseService(); 