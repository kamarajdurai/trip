// Local Storage Mock Firebase Implementation for Offline Development

// Helper to get from localStorage
const getLocalData = (key, defaultVal = {}) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

// Helper to set in localStorage
const setLocalData = (key, val) => {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        console.error("localStorage error:", e);
    }
};

// Auth State & Listeners
const authListeners = new Set();
const notifyAuthChange = (user) => {
    authListeners.forEach(cb => {
        try {
            cb(user);
        } catch (e) {
            console.error("Auth listener error:", e);
        }
    });
};

export const auth = {
    get currentUser() {
        return getLocalData('local_auth_current_user', null);
    }
};

// firebase/app exports
export const initializeApp = () => {
    return { name: '[MockApp]' };
};

// firebase/auth exports
export const getAuth = () => auth;
export const GoogleAuthProvider = class {};

export const onAuthStateChanged = (authObj, callback) => {
    authListeners.add(callback);
    // Call immediately with the current user state
    const currentUser = auth.currentUser;
    setTimeout(() => {
        callback(currentUser);
    }, 0);
    return () => {
        authListeners.delete(callback);
    };
};

export const createUserWithEmailAndPassword = async (authObj, email, password) => {
    const users = getLocalData('local_auth_users', {});
    const lowerEmail = email.toLowerCase();
    
    if (users[lowerEmail]) {
        throw new Error("auth/email-already-in-use");
    }
    
    const uid = 'uid_' + Math.random().toString(36).substring(2, 11);
    const newUser = {
        uid,
        email: lowerEmail,
        displayName: email.split('@')[0],
    };
    
    users[lowerEmail] = { ...newUser, password };
    setLocalData('local_auth_users', users);
    
    // Do not log in the user automatically on sign up, just store the details
    return { user: newUser };
};

export const signInWithEmailAndPassword = async (authObj, emailOrUsername, password) => {
    const users = getLocalData('local_auth_users', {});
    let userRecord = null;
    
    const lowerIdentifier = emailOrUsername.toLowerCase();
    
    if (users[lowerIdentifier]) {
        userRecord = users[lowerIdentifier];
    } else {
        // Fallback: Check if it's a username mapping in local_firestore
        const firestore = getLocalData('local_firestore', {});
        const usernamePath = `usernames/${lowerIdentifier}`;
        if (firestore[usernamePath]) {
            const email = firestore[usernamePath].email;
            if (users[email]) {
                userRecord = users[email];
            }
        }
    }
    
    if (!userRecord || userRecord.password !== password) {
        throw new Error("auth/wrong-password");
    }
    
    const currentUser = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
    };
    
    setLocalData('local_auth_current_user', currentUser);
    notifyAuthChange(currentUser);
    
    return { user: currentUser };
};

export const signInWithPopup = async (authObj, provider) => {
    const mockUser = {
        uid: 'uid_google_' + Math.random().toString(36).substring(2, 11),
        email: 'googleuser@company.com',
        displayName: 'Google User',
    };
    
    const users = getLocalData('local_auth_users', {});
    users[mockUser.email] = { ...mockUser, password: 'google_login' };
    setLocalData('local_auth_users', users);
    
    setLocalData('local_auth_current_user', mockUser);
    notifyAuthChange(mockUser);
    
    return { user: mockUser };
};

export const signOut = async (authObj) => {
    setLocalData('local_auth_current_user', null);
    notifyAuthChange(null);
};

// firebase/firestore exports
export const db = {};
export const getFirestore = () => db;

const dbListeners = new Set();
const notifyDbChange = () => {
    dbListeners.forEach(listener => {
        try {
            listener.run();
        } catch (e) {
            console.error("DB listener error:", e);
        }
    });
};

export const doc = (database, ...paths) => {
    const fullPath = paths.filter(Boolean).join('/');
    const segments = fullPath.split('/');
    const id = segments[segments.length - 1];
    return {
        type: 'document',
        path: fullPath,
        id
    };
};

export const collection = (database, ...paths) => {
    const fullPath = paths.filter(Boolean).join('/');
    return {
        type: 'collection',
        path: fullPath
    };
};

const resolveSpecialFields = (data, existingData = {}) => {
    if (!data || typeof data !== 'object') return data;
    const resolved = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
        const val = data[key];
        if (val && typeof val === 'object' && val.__type === 'increment') {
            const currentVal = existingData[key] || 0;
            resolved[key] = currentVal + val.value;
        } else if (val && typeof val === 'object' && val.__type === 'serverTimestamp') {
            resolved[key] = new Date().toISOString();
        } else if (val && typeof val === 'object') {
            resolved[key] = resolveSpecialFields(val, existingData[key]);
        } else {
            resolved[key] = val;
        }
    }
    return resolved;
};

export const getDoc = async (docRef) => {
    const firestore = getLocalData('local_firestore', {});
    const data = firestore[docRef.path];
    return {
        exists: () => !!data,
        data: () => data || null,
        id: docRef.id
    };
};

export const setDoc = async (docRef, data, options = {}) => {
    const firestore = getLocalData('local_firestore', {});
    const existing = firestore[docRef.path] || {};
    let newData;
    
    if (options.merge) {
        newData = { ...existing, ...resolveSpecialFields(data, existing) };
    } else {
        newData = resolveSpecialFields(data, existing);
    }
    
    firestore[docRef.path] = newData;
    setLocalData('local_firestore', firestore);
    notifyDbChange();
};

export const updateDoc = async (docRef, data) => {
    const firestore = getLocalData('local_firestore', {});
    const existing = firestore[docRef.path] || {};
    
    const newData = { ...existing, ...resolveSpecialFields(data, existing) };
    firestore[docRef.path] = newData;
    
    setLocalData('local_firestore', firestore);
    notifyDbChange();
};

export const addDoc = async (collRef, data) => {
    const id = 'doc_' + Math.random().toString(36).substring(2, 11);
    const docRef = doc(db, collRef.path, id);
    await setDoc(docRef, data);
    return docRef;
};

export const deleteDoc = async (docRef) => {
    const firestore = getLocalData('local_firestore', {});
    delete firestore[docRef.path];
    setLocalData('local_firestore', firestore);
    notifyDbChange();
};

export const query = (collRef, ...constraints) => {
    return {
        type: 'query',
        path: collRef.path,
        constraints
    };
};

export const orderBy = (field, direction = 'asc') => {
    return { type: 'orderBy', field, direction };
};

export const where = (field, operator, value) => {
    return { type: 'where', field, operator, value };
};

export const serverTimestamp = () => {
    return { __type: 'serverTimestamp' };
};

export const increment = (value) => {
    return { __type: 'increment', value };
};

export const onSnapshot = (ref, callback) => {
    const runCallback = () => {
        const firestore = getLocalData('local_firestore', {});
        
        if (ref.type === 'document') {
            const data = firestore[ref.path];
            callback({
                exists: () => !!data,
                data: () => data || null,
                id: ref.id
            });
        } else {
            // Collection or Query
            const prefix = ref.path + '/';
            const docs = [];
            
            for (const key in firestore) {
                if (key.startsWith(prefix)) {
                    const suffix = key.substring(prefix.length);
                    // direct children only
                    if (!suffix.includes('/')) {
                        docs.push({
                            id: suffix,
                            data: () => firestore[key]
                        });
                    }
                }
            }
            
            // Handle query constraints if any (orderBy)
            if (ref.constraints) {
                const orderByConstraint = ref.constraints.find(c => c.type === 'orderBy');
                if (orderByConstraint) {
                    const { field, direction } = orderByConstraint;
                    docs.sort((a, b) => {
                        const valA = a.data()[field];
                        const valB = b.data()[field];
                        if (valA === undefined || valB === undefined) return 0;
                        if (valA < valB) return direction === 'asc' ? -1 : 1;
                        if (valA > valB) return direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
            }
            
            callback({
                docs,
                forEach: (cb) => docs.forEach(cb),
                size: docs.length
            });
        }
    };
    
    // Run immediately asynchronously to prevent blocking React render cycles
    setTimeout(() => {
        runCallback();
    }, 0);
    
    const listener = {
        run: runCallback
    };
    dbListeners.add(listener);
    
    return () => {
        dbListeners.delete(listener);
    };
};

// firebase/storage exports
export const getStorage = () => ({});

const storageFiles = new Map();

export const ref = (storageObj, path) => {
    return { path, __type: 'storage_ref' };
};

export const uploadBytes = async (storageRef, file) => {
    storageFiles.set(storageRef.path, file);
    return { ref: storageRef };
};

export const getDownloadURL = async (storageRef) => {
    const file = storageFiles.get(storageRef.path);
    if (file) {
        return URL.createObjectURL(file);
    }
    return 'https://picsum.photos/400/300'; // Fallback dummy image
};

// firebase/analytics exports
export const getAnalytics = () => ({});
