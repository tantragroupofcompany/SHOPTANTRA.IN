(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
// Client-side Supabase Polyfill Interceptor
// Bridges Supabase client calls directly to our local Prisma SQLite backend APIs.
class SupabaseQueryBuilder {
    table;
    action = 'select';
    selectColumns = '*';
    insertData = null;
    updateData = null;
    filters = [];
    orderColumn = null;
    orderAscending = true;
    limitCount = null;
    isSingle = false;
    isMaybeSingle = false;
    constructor(table){
        this.table = table;
    }
    select(columns = '*') {
        this.action = 'select';
        this.selectColumns = columns;
        return this;
    }
    insert(data) {
        this.action = 'insert';
        this.insertData = data;
        return this;
    }
    update(data) {
        this.action = 'update';
        this.updateData = data;
        return this;
    }
    delete() {
        this.action = 'delete';
        return this;
    }
    eq(column, value) {
        this.filters.push({
            column,
            operator: 'eq',
            value
        });
        return this;
    }
    neq(column, value) {
        this.filters.push({
            column,
            operator: 'neq',
            value
        });
        return this;
    }
    in(column, values) {
        this.filters.push({
            column,
            operator: 'in',
            value: values
        });
        return this;
    }
    like(column, pattern) {
        this.filters.push({
            column,
            operator: 'like',
            value: pattern
        });
        return this;
    }
    order(column, options) {
        this.orderColumn = column;
        this.orderAscending = options?.ascending !== false;
        return this;
    }
    limit(count) {
        this.limitCount = count;
        return this;
    }
    single() {
        this.isSingle = true;
        return this;
    }
    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }
    // Thenable implementation (Promise interface)
    async then(onfulfilled, onrejected) {
        try {
            const payload = {
                table: this.table,
                action: this.action,
                selectColumns: this.selectColumns,
                insertData: this.insertData,
                updateData: this.updateData,
                filters: this.filters,
                orderColumn: this.orderColumn,
                orderAscending: this.orderAscending,
                limitCount: this.limitCount,
                isSingle: this.isSingle,
                isMaybeSingle: this.isMaybeSingle
            };
            const response = await fetch('/api/supabase-polyfill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Database operation failed');
            }
            const val = {
                data: result.data,
                error: null
            };
            return onfulfilled ? onfulfilled(val) : val;
        } catch (error) {
            console.error(`Supabase polyfill query failed for table ${this.table}:`, error);
            const val = {
                data: null,
                error: {
                    message: error.message || 'Database error occurred'
                }
            };
            return onfulfilled ? onfulfilled(val) : val;
        }
    }
}
const authClient = {
    getSession: async ()=>{
        const sessionStr = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem('st_local_session') : "TURBOPACK unreachable";
        return {
            data: {
                session: sessionStr ? JSON.parse(sessionStr) : null
            },
            error: null
        };
    },
    onAuthStateChange: (callback)=>{
        // Stub onAuthStateChange to prevent crash
        return {
            data: {
                subscription: {
                    unsubscribe: ()=>{}
                }
            }
        };
    },
    signOut: async ()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem('st_local_session');
            localStorage.removeItem('st_local_profile');
        }
        return {
            error: null
        };
    },
    updateUser: async (attributes)=>{
        try {
            const sessionStr = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem('st_local_session') : "TURBOPACK unreachable";
            if (!sessionStr) throw new Error('No active login session found');
            const session = JSON.parse(sessionStr);
            const response = await fetch('/api/supabase-polyfill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table: 'profiles_auth',
                    action: 'update_auth',
                    data: attributes,
                    userId: session.user.id
                })
            });
            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error || 'Failed to update user authentication details');
            return {
                data: {
                    user: resData.user
                },
                error: null
            };
        } catch (err) {
            return {
                data: null,
                error: {
                    message: err.message
                }
            };
        }
    }
};
const supabase = {
    from: (table)=>new SupabaseQueryBuilder(table),
    auth: authClient
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/formUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Form utilities for accessibility and smooth validation experience.
 */ /**
 * Finds the first error message or invalid input field in the document,
 * scrolls to it smoothly, and focuses the input.
 */ __turbopack_context__.s([
    "scrollToErrorAndFocus",
    ()=>scrollToErrorAndFocus
]);
function scrollToErrorAndFocus() {
    // Use a slight delay to ensure React state updates and DOM elements are rendered
    setTimeout(()=>{
        // 1. Look for error alert containers or error text elements
        const errorContainers = document.querySelectorAll('.bg-red-50, [role="alert"], .text-red-600, .text-red-700, .text-red-500');
        // 2. Look for HTML5 invalid inputs
        const invalidInputs = document.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
        let target = null;
        if (errorContainers.length > 0) {
            target = errorContainers[0];
        } else if (invalidInputs.length > 0) {
            target = invalidInputs[0];
        }
        if (target) {
            // Scroll smoothly to the target
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // Attempt to focus the input element
            if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
                target.focus();
            } else {
                // If it's a container, find the first input inside it or immediately following it
                const innerInput = target.querySelector('input, select, textarea');
                if (innerInput instanceof HTMLElement) {
                    innerInput.focus();
                } else {
                    // Check sibling elements for inputs
                    const siblingInput = target.parentElement?.querySelector('input, select, textarea');
                    if (siblingInput instanceof HTMLElement) {
                        siblingInput.focus();
                    }
                }
            }
        } else {
            // Fallback: scroll to top of screen if no error target was matched
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, 150);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Helper to generate a random ID
const generateId = ()=>Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// Helper to validate email format
const validateEmailFormat = (email)=>{
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Initialize session from Supabase or LocalStorage fallback
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            let initialized = false;
            // 1. Attempt to load local storage session first (immediate/offline)
            const localSessionStr = localStorage.getItem('st_local_session');
            const localProfileStr = localStorage.getItem('st_local_profile');
            if (localSessionStr && localProfileStr) {
                try {
                    const localSession = JSON.parse(localSessionStr);
                    const localProfile = JSON.parse(localProfileStr);
                    setSession(localSession);
                    setUser(localSession.user);
                    setProfile(localProfile);
                    setLoading(false);
                    initialized = true;
                } catch (e) {
                    console.error('Error parsing local session:', e);
                }
            }
            // 2. Load Supabase session
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                "AuthProvider.useEffect": ({ data: { session: sbSession } })=>{
                    if (sbSession) {
                        setSession(sbSession);
                        setUser(sbSession.user);
                        fetchProfile(sbSession.user.id).finally({
                            "AuthProvider.useEffect": ()=>setLoading(false)
                        }["AuthProvider.useEffect"]);
                    } else if (!initialized) {
                        setLoading(false);
                    }
                }
            }["AuthProvider.useEffect"]).catch({
                "AuthProvider.useEffect": (err)=>{
                    console.warn('Supabase getSession failed, using local session state:', err);
                    if (!initialized) setLoading(false);
                }
            }["AuthProvider.useEffect"]);
            // 3. Listen to Supabase Auth state changes
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": (_event, sbSession)=>{
                    if (sbSession) {
                        setSession(sbSession);
                        setUser(sbSession.user);
                        fetchProfile(sbSession.user.id);
                    } else {
                        // Only clear if we don't have a local storage session active
                        if (!localStorage.getItem('st_local_session')) {
                            setSession(null);
                            setUser(null);
                            setProfile(null);
                        }
                    }
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>{
                    subscription.unsubscribe();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const fetchProfile = async (userId)=>{
        try {
            const res = await fetch(`/api/seller/profile?userId=${userId}`);
            if (res.ok) {
                const resData = await res.json();
                if (resData.success && resData.data) {
                    setProfile(resData.data);
                    localStorage.setItem('st_local_profile', JSON.stringify(resData.data));
                    return resData.data;
                }
            }
        } catch (e) {
            console.warn('API fetchProfile failed:', e);
        }
        return null;
    };
    const signIn = async (email, password)=>{
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const resData = await response.json();
            if (response.ok && resData.session && resData.profile) {
                setSession(resData.session);
                setUser(resData.session.user);
                setProfile(resData.profile);
                // Sync local storage session
                localStorage.setItem('st_local_session', JSON.stringify(resData.session));
                localStorage.setItem('st_local_profile', JSON.stringify(resData.profile));
                setLoading(false);
                return {
                    error: null,
                    profile: resData.profile
                };
            } else {
                setLoading(false);
                return {
                    error: new Error(resData.error || 'Failed to authenticate.'),
                    profile: null
                };
            }
        } catch (e) {
            console.error('API signIn failed:', e);
            setLoading(false);
            return {
                error: new Error(e.message || 'An error occurred during sign in.'),
                profile: null
            };
        }
    };
    const signUp = async (email, password, fullName, role, businessInfo)=>{
        setLoading(true);
        // Validation checks
        if (!email.trim() || !validateEmailFormat(email)) {
            setLoading(false);
            return {
                error: new Error('Please enter a valid email address.')
            };
        }
        if (!password || password.length < 6) {
            setLoading(false);
            return {
                error: new Error('Password must be at least 6 characters long.')
            };
        }
        if (!fullName.trim()) {
            setLoading(false);
            return {
                error: new Error('Full name is required.')
            };
        }
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    role,
                    businessInfo
                })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                // Auto-login after successful registration
                try {
                    const loginResult = await signIn(email, password);
                    return loginResult;
                } catch (loginErr) {
                    // Registration succeeded but auto-login failed — not critical
                    console.warn('Auto-login after registration failed:', loginErr);
                    setLoading(false);
                    return {
                        error: null
                    }; // Registration was successful
                }
            } else {
                setLoading(false);
                return {
                    error: new Error(resData.error || 'Failed to create account.')
                };
            }
        } catch (e) {
            console.error('API signUp failed:', e);
            setLoading(false);
            return {
                error: new Error(e.message || 'An error occurred during registration.')
            };
        }
    };
    const signOut = async ()=>{
        setLoading(true);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        } catch (e) {
            console.warn('Supabase signOut failed:', e);
        }
        // Clear local storage session
        localStorage.removeItem('st_local_session');
        localStorage.removeItem('st_local_profile');
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
    };
    const refreshProfile = async ()=>{
        if (user) await fetchProfile(user.id);
    };
    const forgotPassword = async (email)=>{
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email
                })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                const apiLink = `${window.location.origin}/reset-password?token=${resData.token}`;
                console.log(`[PASSWORD RESET API LINK]: ${apiLink}`);
                return {
                    error: null,
                    link: apiLink
                };
            } else {
                return {
                    error: new Error(resData.error || 'Failed to request password reset link.')
                };
            }
        } catch (e) {
            console.error('API forgotPassword failed:', e);
            return {
                error: new Error(e.message || 'An error occurred while requesting password reset.')
            };
        }
    };
    const resetPassword = async (token, newPassword)=>{
        if (!newPassword || newPassword.length < 6) {
            return {
                error: new Error('Password must be at least 6 characters long.')
            };
        }
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                return {
                    error: null
                };
            } else {
                return {
                    error: new Error(resData.error || 'Failed to reset password.')
                };
            }
        } catch (e) {
            console.error('API resetPassword failed:', e);
            return {
                error: new Error(e.message || 'An error occurred while resetting the password.')
            };
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            session,
            profile,
            role: profile?.role ?? null,
            loading,
            signIn,
            signUp,
            signOut,
            refreshProfile,
            forgotPassword,
            resetPassword
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 291,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "L8N6tAllQim6AVWCd5spx/8G90w=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/AppContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppProvider",
    ()=>AppProvider,
    "useApp",
    ()=>useApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
const AppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AppProvider({ children }) {
    _s();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AppProvider.useState": ()=>{
            const saved = localStorage.getItem('shoptantra_cart');
            return saved ? JSON.parse(saved) : [];
        }
    }["AppProvider.useState"]);
    const [wishlist, setWishlist] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AppProvider.useState": ()=>{
            const saved = localStorage.getItem('shoptantra_wishlist');
            return saved ? JSON.parse(saved) : [];
        }
    }["AppProvider.useState"]);
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AppProvider.useState": ()=>{
            const saved = localStorage.getItem('shoptantra_theme');
            if (saved === 'dark' || saved === 'light') return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }["AppProvider.useState"]);
    const [language, setLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('EN');
    const [couponCode, setCouponCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [couponDiscount, setCouponDiscount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            id: 'n-1',
            title: 'Welcome to SHOPTANTRA!',
            message: 'Explore millions of products directly from Indian manufacturers.',
            type: 'system',
            read: false,
            time: 'Just now'
        },
        {
            id: 'n-2',
            title: 'Mega Flash Sale Live',
            message: 'Get up to 50% off on premium local brands. Use coupon WELCOME.',
            type: 'promo',
            read: false,
            time: '2 hours ago'
        }
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            localStorage.setItem('shoptantra_cart', JSON.stringify(cart));
        }
    }["AppProvider.useEffect"], [
        cart
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            localStorage.setItem('shoptantra_wishlist', JSON.stringify(wishlist));
        }
    }["AppProvider.useEffect"], [
        wishlist
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            localStorage.setItem('shoptantra_theme', theme);
            const root = window.document.documentElement;
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }["AppProvider.useEffect"], [
        theme
    ]);
    const addToCart = (product, quantity, color, size)=>{
        setCart((prev)=>{
            const existingIdx = prev.findIndex((item)=>item.product.id === product.id && item.selectedColor === color && item.selectedSize === size);
            if (existingIdx > -1) {
                const nextCart = [
                    ...prev
                ];
                nextCart[existingIdx].quantity += quantity;
                return nextCart;
            }
            return [
                ...prev,
                {
                    product,
                    quantity,
                    selectedColor: color,
                    selectedSize: size
                }
            ];
        });
        addNotification('Item Added to Cart', `${product.title} has been added to your shopping cart.`, 'system');
    };
    const removeFromCart = (productId, color, size)=>{
        setCart((prev)=>prev.filter((item)=>!(item.product.id === productId && item.selectedColor === color && item.selectedSize === size)));
    };
    const updateCartQuantity = (productId, quantity, color, size)=>{
        if (quantity <= 0) {
            removeFromCart(productId, color, size);
            return;
        }
        setCart((prev)=>prev.map((item)=>item.product.id === productId && item.selectedColor === color && item.selectedSize === size ? {
                    ...item,
                    quantity
                } : item));
    };
    const clearCart = ()=>{
        setCart([]);
    };
    const toggleWishlist = (product)=>{
        setWishlist((prev)=>{
            const idx = prev.findIndex((item)=>item.id === product.id);
            if (idx > -1) {
                return prev.filter((item)=>item.id !== product.id);
            } else {
                addNotification('Added to Wishlist', `${product.title} added to your wishlist.`, 'system');
                return [
                    ...prev,
                    product
                ];
            }
        });
    };
    const isInWishlist = (productId)=>{
        return wishlist.some((item)=>item.id === productId);
    };
    const applyCoupon = (code)=>{
        const upperCode = code.toUpperCase();
        if (upperCode === 'SHOPTANTRA10') {
            setCouponCode('SHOPTANTRA10');
            setCouponDiscount(10);
            addNotification('Coupon Applied', 'SHOPTANTRA10 gives you 10% off your entire order!', 'promo');
            return true;
        }
        if (upperCode === 'WELCOME') {
            setCouponCode('WELCOME');
            setCouponDiscount(20);
            addNotification('Coupon Applied', 'WELCOME discount applied successfully! 20% off.', 'promo');
            return true;
        }
        if (upperCode === 'FESTIVE50') {
            setCouponCode('FESTIVE50');
            setCouponDiscount(50);
            addNotification('Coupon Applied', 'FESTIVE50 flat 50% discount applied!', 'promo');
            return true;
        }
        return false;
    };
    const addNotification = (title, message, type = 'system')=>{
        setNotifications((prev)=>[
                {
                    id: `n-${Date.now()}`,
                    title,
                    message,
                    type,
                    read: false,
                    time: 'Just now'
                },
                ...prev
            ]);
    };
    const markNotificationsAsRead = ()=>{
        setNotifications((prev)=>prev.map((n)=>({
                    ...n,
                    read: true
                })));
    };
    const toggleTheme = ()=>{
        setTheme((prev)=>prev === 'light' ? 'dark' : 'light');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContext.Provider, {
        value: {
            cart,
            wishlist,
            notifications,
            theme,
            language,
            setLanguage,
            couponCode,
            couponDiscount,
            applyCoupon,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            toggleWishlist,
            isInWishlist,
            addNotification,
            markNotificationsAsRead,
            toggleTheme
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AppContext.tsx",
        lineNumber: 225,
        columnNumber: 5
    }, this);
}
_s(AppProvider, "fuPPbSloaTFVWXNTbo/qYc8gP8E=");
_c = AppProvider;
function useApp() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
_s1(useApp, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AppProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/data/products.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CATEGORIES_LIST",
    ()=>CATEGORIES_LIST,
    "mockProducts",
    ()=>mockProducts
]);
const CATEGORIES_LIST = [
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Beauty',
    'Grocery',
    'Books',
    'Toys',
    'Sports',
    'Automotive',
    'Mobile Accessories',
    'Furniture',
    'Health'
];
const mockProducts = [
    {
        id: 'prod-1',
        title: 'TantraSound Pro 500 Wireless ANC Headphones',
        seller: 'Tantra Electronics India',
        sellerId: 'sel-1',
        price: 4999,
        originalPrice: 8999,
        discount: 44,
        rating: 4.8,
        reviewsCount: 324,
        category: 'Electronics',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Immerse yourself in pure audio with the TantraSound Pro 500. Featuring hybrid active noise cancellation (ANC), up to 50 hours of battery life, and crystal-clear call quality with triple mics.',
        stockStatus: 'In Stock',
        stockCount: 45,
        variants: {
            colors: [
                'Charcoal Black',
                'Arctic Silver',
                'Navy Blue'
            ]
        },
        specifications: {
            'Driver Size': '40mm Dynamic Drivers',
            'ANC Depth': 'Up to 35dB',
            'Bluetooth Version': '5.3',
            'Battery Life': '50 Hours (ANC Off), 35 Hours (ANC On)',
            'Charging Time': '1.5 Hours (Type-C Quick Charge)',
            'Warranty': '1 Year Brand Warranty'
        },
        reviews: [
            {
                id: 'r1',
                userName: 'Aman Verma',
                rating: 5,
                comment: 'Excellent sound quality and ANC is very good for this price range.',
                date: '2026-05-12'
            },
            {
                id: 'r2',
                userName: 'Sneha Patel',
                rating: 4,
                comment: 'Very comfortable for long hours. Battery life is stellar.',
                date: '2026-06-01'
            }
        ]
    },
    {
        id: 'prod-2',
        title: 'Royal Indigo Cotton Kurta Set',
        seller: 'Shiva Designs',
        sellerId: 'sel-2',
        price: 1899,
        originalPrice: 3499,
        discount: 45,
        rating: 4.5,
        reviewsCount: 142,
        category: 'Fashion',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Elevate your traditional look with this Royal Indigo Cotton Kurta Set. Crafted from premium breathable cotton, this set includes a straight fit knee-length kurta with delicate embroidery and matching pajamas.',
        stockStatus: 'In Stock',
        stockCount: 120,
        variants: {
            sizes: [
                'S',
                'M',
                'L',
                'XL',
                'XXL'
            ],
            colors: [
                'Royal Indigo',
                'Deep Saffron'
            ]
        },
        specifications: {
            'Fabric': '100% Khadi Cotton',
            'Pattern': 'Straight Fit, Embroidered Yoke',
            'Sleeve Length': 'Full Sleeves',
            'Occasion': 'Festive / Semi-Formal',
            'Care Instructions': 'Hand wash separately in cold water'
        },
        reviews: [
            {
                id: 'r3',
                userName: 'Rohan Deshmukh',
                rating: 5,
                comment: 'Fitting is perfect. Fabric feels extremely premium and light.',
                date: '2026-05-20'
            }
        ]
    },
    {
        id: 'prod-3',
        title: '7-in-1 Premium Non-Stick Cookware Set',
        seller: 'Tantra Home & Kitchen',
        sellerId: 'sel-3',
        price: 3499,
        originalPrice: 5999,
        discount: 41,
        rating: 4.6,
        reviewsCount: 98,
        category: 'Home & Kitchen',
        images: [
            'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Upgrade your kitchen setup with this 7-piece hard-anodized non-stick cookware set. Consists of a Kadai with lid, frying pan, tawa, spatula, and serving ladle. Designed for even heat distribution and minimal oil cooking.',
        stockStatus: 'In Stock',
        stockCount: 30,
        variants: {
            colors: [
                'Granite Grey',
                'Sunset Saffron'
            ]
        },
        specifications: {
            'Material': 'Hard-Anodized Aluminium',
            'Coating': '5-Layer Granite Non-Stick Coating',
            'Induction Compatible': 'Yes',
            'Dishwasher Safe': 'Yes',
            'Package Contents': '1 Kadai (2.5L), 1 Frypan (24cm), 1 Tawa (25cm), Lid, 3 Accessories'
        },
        reviews: [
            {
                id: 'r4',
                userName: 'Meera Sen',
                rating: 4,
                comment: 'Best non-stick pans I have used. Food does not stick and cleaning is super easy.',
                date: '2026-06-03'
            }
        ]
    },
    {
        id: 'prod-4',
        title: 'Vitamin C & Hyaluronic Glow Serum',
        seller: 'SkinVeda Ayurveda',
        sellerId: 'sel-4',
        price: 649,
        originalPrice: 1199,
        discount: 45,
        rating: 4.7,
        reviewsCount: 512,
        category: 'Beauty',
        images: [
            'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Say goodbye to dark spots and dullness. Formulated with 15% Vitamin C, Ferulic Acid, and Hyaluronic Acid, this serum boosts radiance and intensely hydrates for a youthful skin glow.',
        stockStatus: 'In Stock',
        stockCount: 88,
        variants: {
            sizes: [
                '30ml',
                '50ml'
            ]
        },
        specifications: {
            'Skin Type': 'All Skin Types',
            'Key Ingredients': 'Ethyl Ascorbic Acid, Kakadu Plum, Hyaluronic Acid',
            'Benefits': 'Brightening, Hydration, Spot Correction',
            'Paraben & Sulphate Free': 'Yes',
            'Certification': 'FDA Approved, Cruelty-Free'
        },
        reviews: [
            {
                id: 'r5',
                userName: 'Kriti Sharma',
                rating: 5,
                comment: 'Gives an amazing glow in just 2 weeks. Highly recommended!',
                date: '2026-04-18'
            }
        ]
    },
    {
        id: 'prod-5',
        title: 'Organic A2 Desi Cow Ghee (Bilona Method)',
        seller: 'Swadeshi Farms',
        sellerId: 'sel-5',
        price: 999,
        originalPrice: 1499,
        discount: 33,
        rating: 4.9,
        reviewsCount: 876,
        category: 'Grocery',
        images: [
            'https://images.unsplash.com/photo-1622484211148-716598e0dbd1?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Pure, authentic A2 ghee churned from curd curdled from A2 milk of free-grazing Desi Gir cows using the traditional Vedic Bilona method. Highly aromatic, rich in vitamins, and loaded with healthy fats.',
        stockStatus: 'In Stock',
        stockCount: 150,
        variants: {
            sizes: [
                '500ml',
                '1 Litre'
            ]
        },
        specifications: {
            'Cow Breed': 'Pure Gir Cows',
            'Method': 'Vedic Hand Churned Bilona Process',
            'Container': 'Glass Jar',
            'Shelf Life': '12 Months',
            'Nutritional Benefits': 'Aids Digestion, Boosts Immunity, Natural Antioxidant'
        },
        reviews: [
            {
                id: 'r6',
                userName: 'Rajesh V.',
                rating: 5,
                comment: 'Reminds me of home. The aroma and grainy texture is top notch!',
                date: '2026-06-11'
            }
        ]
    },
    {
        id: 'prod-6',
        title: 'Chanakya Neeti & Indian Wisdom Books Combo',
        seller: 'Vidya Publications',
        sellerId: 'sel-6',
        price: 499,
        originalPrice: 999,
        discount: 50,
        rating: 4.4,
        reviewsCount: 220,
        category: 'Books',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'A comprehensive paperback collection of ancient Indian strategic thinking, administration, and personal ethics. Includes Chanakya Neeti, Vidur Niti, and Hitopadesh translations in easy-to-understand English & Hindi.',
        stockStatus: 'In Stock',
        stockCount: 65,
        specifications: {
            'Author': 'Ancient Translators Consortium',
            'Publisher': 'Vidya Publications',
            'Language': 'English & Hindi Dual Edition',
            'Binding': 'Paperback',
            'Total Pages': '540 Pages'
        },
        reviews: [
            {
                id: 'r7',
                userName: 'Devendra S.',
                rating: 4,
                comment: 'Timeless principles. The translation is very modern and easy to read.',
                date: '2026-05-05'
            }
        ]
    },
    {
        id: 'prod-7',
        title: 'Smart STEM Robotics kit for Kids (8+)',
        seller: 'Tantra Toys Ltd',
        sellerId: 'sel-7',
        price: 2499,
        originalPrice: 3999,
        discount: 37,
        rating: 4.7,
        reviewsCount: 112,
        category: 'Toys',
        images: [
            'https://images.unsplash.com/photo-1530089785124-1381b6f91448?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Cultivate logic and engineering curiosity in your child. This STEM kit contains 120+ modular building blocks and simple instruction sets to create up to 10 working robots, controlled via Bluetooth app.',
        stockStatus: 'In Stock',
        stockCount: 20,
        specifications: {
            'Recommended Age': '8 to 14 Years',
            'Learning Value': 'Robotics, Coding Logic, Mechanical Principles',
            'Power Source': '4 AA Batteries required',
            'App Compatibility': 'Android / iOS'
        },
        reviews: [
            {
                id: 'r8',
                userName: 'Anjali Gupta',
                rating: 5,
                comment: 'My son absolutely loves it. Keeps him engaged and off screens for hours!',
                date: '2026-06-10'
            }
        ]
    },
    {
        id: 'prod-8',
        title: 'Vajra Carbon Fiber Badminton Racket Combo',
        seller: 'Vajra Sports',
        sellerId: 'sel-8',
        price: 1599,
        originalPrice: 2999,
        discount: 46,
        rating: 4.6,
        reviewsCount: 184,
        category: 'Sports',
        images: [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Engineered for dominance on the court. This Vajra racket combo features a high-modulus carbon fiber body, lightweight 4U frame (82g), and high tension capacity (up to 30 lbs) for explosive smashes.',
        stockStatus: 'In Stock',
        stockCount: 40,
        variants: {
            colors: [
                'Saffron Fire',
                'Electric Blue',
                'Jet Black'
            ]
        },
        specifications: {
            'Material': 'High Modulus Carbon Fiber',
            'Weight': '4U (80-84g)',
            'Grip Size': 'G4',
            'Tension capacity': '24-30 lbs',
            'Package Contents': '2 Rackets, 3 Feather Shuttlecocks, 1 Premium Carrying Bag'
        },
        reviews: [
            {
                id: 'r9',
                userName: 'Vikram Singh',
                rating: 5,
                comment: 'Extremely lightweight, superb control. Best value racket bundle.',
                date: '2026-05-28'
            }
        ]
    },
    {
        id: 'prod-9',
        title: 'UltraClean High-Pressure Car Washer (150 Bar)',
        seller: 'Autocraft Tech',
        sellerId: 'sel-9',
        price: 6499,
        originalPrice: 11999,
        discount: 45,
        rating: 4.5,
        reviewsCount: 205,
        category: 'Automotive',
        images: [
            'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Get professional car detailing results at home. This high pressure washer features a robust 1800W copper motor, delivering 150 bars of maximum water pressure to blast away mud, grime, and grease from vehicles and patios.',
        stockStatus: 'In Stock',
        stockCount: 15,
        specifications: {
            'Motor Power': '1800 Watts Induction Motor',
            'Max Pressure': '150 Bar',
            'Flow Rate': '6.5 Litres/Min',
            'Hose Pipe Length': '8 Metres Heavy Duty Hose',
            'Weight': '7.2 kg'
        },
        reviews: [
            {
                id: 'r10',
                userName: 'Harish K.',
                rating: 4,
                comment: 'High pressure, very effective for mud build-up on my SUV. Accessories are good.',
                date: '2026-06-08'
            }
        ]
    },
    {
        id: 'prod-10',
        title: 'Premium Metal MagSafe Phone Stand & Ring',
        seller: 'Tantra Accessories',
        sellerId: 'sel-10',
        price: 799,
        originalPrice: 1499,
        discount: 46,
        rating: 4.4,
        reviewsCount: 155,
        category: 'Mobile Accessories',
        images: [
            'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Sleek, secure, and multi-functional. Crafted from high-density zinc alloy, this MagSafe-compatible stand snaps onto the back of your iPhone, providing a secure grip ring, 360-degree rotation stand, and desktop mounting.',
        stockStatus: 'In Stock',
        stockCount: 250,
        variants: {
            colors: [
                'Metallic Grey',
                'Matte Black',
                'Rose Gold'
            ]
        },
        specifications: {
            'Material': 'Zinc Alloy and N52 Neodymium Magnets',
            'Compatibility': 'iPhone 12 and above (MagSafe native), all devices with metal rings',
            'Rotation': '360° Rotatable, 180° Flip Ring',
            'Thickness': 'Ultra-thin 3mm'
        },
        reviews: [
            {
                id: 'r11',
                userName: 'Kabir Lal',
                rating: 4,
                comment: 'Magnet is incredibly strong. Rings rotate smoothly. Metal feels premium.',
                date: '2026-05-19'
            }
        ]
    },
    {
        id: 'prod-11',
        title: 'Sheesham Wood Solid 3-Seater Sofa',
        seller: 'Royal Wood Krafts',
        sellerId: 'sel-11',
        price: 18499,
        originalPrice: 29999,
        discount: 38,
        rating: 4.7,
        reviewsCount: 78,
        category: 'Furniture',
        images: [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Transform your living room with our handcrafted Sheesham Wood Sofa. Showcases beautiful natural wood grains and features thick high-density foam cushions (40-density) upholstered in premium velvet fabric.',
        stockStatus: 'In Stock',
        stockCount: 10,
        variants: {
            colors: [
                'Teak Finish, Beige Fabric',
                'Walnut Finish, Navy Blue Fabric'
            ]
        },
        specifications: {
            'Wood Type': '100% Solid Seasoned Sheesham Wood',
            'Seating Capacity': '3 Seater',
            'Cushion Density': '40 Density Foam',
            'Dimensions': '72" W x 30" D x 32" H',
            'Assembly': 'Do-It-Yourself (Easy installation guide provided)'
        },
        reviews: [
            {
                id: 'r12',
                userName: 'Ritu Jain',
                rating: 5,
                comment: 'Sturdy wood, very comfortable cushions. Looks extremely royal in our hall.',
                date: '2026-04-30'
            }
        ]
    },
    {
        id: 'prod-12',
        title: 'TantraPran Ayurvedic Ashwagandha KSM-66 capsules',
        seller: 'AyurHealth Pharma',
        sellerId: 'sel-12',
        price: 899,
        originalPrice: 1499,
        discount: 40,
        rating: 4.8,
        reviewsCount: 422,
        category: 'Health',
        images: [
            'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Unlock natural strength and mental calm. Formulated with KSM-66, the highest concentration Ashwagandha root extract available. Clinically proven to reduce stress, boost energy, and improve sleep quality.',
        stockStatus: 'In Stock',
        stockCount: 190,
        specifications: {
            'Extract Type': 'KSM-66 Ashwagandha Root Extract (5% Withanolides)',
            'Capsules Count': '60 Vegan Capsules',
            'Serving Size': '1-2 Capsules daily',
            'Certified': 'GMP Certified, USDA Organic, 100% Vegan'
        },
        reviews: [
            {
                id: 'r13',
                userName: 'Devang Patel',
                rating: 5,
                comment: 'Significant improvement in my sleep cycle and general energy levels. Best Ashwagandha!',
                date: '2026-06-05'
            }
        ]
    },
    {
        id: 'prod-13',
        title: '4K Ultra HD Smart LED TV 55 Inch',
        seller: 'Tantra Electronics India',
        sellerId: 'sel-1',
        price: 38999,
        originalPrice: 64999,
        discount: 40,
        rating: 4.6,
        reviewsCount: 180,
        category: 'Electronics',
        images: [
            'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Experience spectacular clarity and detail with 4K UHD. Features Dolby Vision, 30W DTS Virtual-X speakers, Google TV interface, and hands-free voice control.',
        stockStatus: 'In Stock',
        stockCount: 12,
        specifications: {
            'Display': '4K UHD, HDR10+, Dolby Vision',
            'Sound Output': '30 Watts Dolby Audio',
            'OS': 'Google TV with Play Store',
            'Refresh Rate': '60 Hz',
            'Ports': '3 HDMI, 2 USB, Dual-band Wi-Fi'
        },
        reviews: [
            {
                id: 'r14',
                userName: 'Pranav M.',
                rating: 5,
                comment: 'Phenomenal display and UI is butter smooth. Best budget 55 inch TV!',
                date: '2026-05-15'
            }
        ]
    },
    {
        id: 'prod-14',
        title: 'Waterproof Leather Hiking Shoes',
        seller: 'Vajra Sports',
        sellerId: 'sel-8',
        price: 3499,
        originalPrice: 5999,
        discount: 41,
        rating: 4.7,
        reviewsCount: 88,
        category: 'Sports',
        images: [
            'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Engineered for rugged trails. These hiking shoes feature water-resistant nubuck leather, a breathable mesh interior lining, and dual-density EVA midsoles for all-day comfort and stability.',
        stockStatus: 'In Stock',
        stockCount: 22,
        variants: {
            sizes: [
                '7',
                '8',
                '9',
                '10',
                '11'
            ]
        },
        specifications: {
            'Material': 'Nubuck Leather & TPU Sole',
            'Waterproof': 'Yes (HydroGuard Membrane)',
            'Sole Type': 'Vibram Traction Outsole',
            'Weight': '450g per shoe'
        },
        reviews: [
            {
                id: 'r15',
                userName: 'Sanjay Dutt',
                rating: 5,
                comment: 'Hiked in Himachal with these. Feet remained completely dry and grip is amazing.',
                date: '2026-06-09'
            }
        ]
    },
    {
        id: 'prod-15',
        title: 'Glacial Cooling Hydro Flask (1.2L)',
        seller: 'Eco Living',
        sellerId: 'sel-13',
        price: 1299,
        originalPrice: 1999,
        discount: 35,
        rating: 4.8,
        reviewsCount: 310,
        category: 'Home & Kitchen',
        images: [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Double-walled vacuum insulated flask that keeps drinks ice cold for up to 24 hours and hot for 12 hours. Crafted from premium 18/8 food-grade stainless steel with sweat-free powder coating.',
        stockStatus: 'In Stock',
        stockCount: 95,
        variants: {
            colors: [
                'Obsidian Black',
                'Glacier Teal',
                'Saffron Flame'
            ]
        },
        specifications: {
            'Material': '18/8 Pro-Grade Stainless Steel',
            'Insulation': 'TempShield Double Wall Vacuum',
            'Capacity': '1200 ml',
            'BPA Free': 'Yes'
        },
        reviews: [
            {
                id: 'r16',
                userName: 'Nikhil Roy',
                rating: 4,
                comment: 'Insulation works perfectly. Saffron color looks absolutely stunning!',
                date: '2026-05-30'
            }
        ]
    },
    {
        id: 'prod-16',
        title: 'Glow-Up Hydrating Lip Oil Tint',
        seller: 'Beauty Naturals',
        sellerId: 'sel-14',
        price: 499,
        originalPrice: 899,
        discount: 44,
        rating: 4.5,
        reviewsCount: 190,
        category: 'Beauty',
        images: [
            'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Formulated with organic Jojoba, Rosehip, and Almond oils. Nourishes dry lips like a balm while delivering a beautiful high-gloss pink tint and plumpness without being sticky.',
        stockStatus: 'In Stock',
        stockCount: 130,
        variants: {
            colors: [
                'Rosy Coral',
                'Saffron Glow',
                'Berry Mauve'
            ]
        },
        specifications: {
            'Key Ingredients': 'Jojoba Oil, Vitamin E, Rosehip Extract',
            'Texture': 'Non-sticky lightweight oil-gel',
            'Benefits': 'Moisturizes, Plumps, Leaves a long lasting tint',
            'Volume': '6 ml'
        },
        reviews: [
            {
                id: 'r17',
                userName: 'Ananya Roy',
                rating: 4,
                comment: 'Tint is subtle but lasts very long. Keeps lips hydrated for hours.',
                date: '2026-06-12'
            }
        ]
    },
    {
        id: 'prod-17',
        title: 'Premium Cold Pressed Mustard Oil (1L)',
        seller: 'Swadeshi Farms',
        sellerId: 'sel-5',
        price: 249,
        originalPrice: 349,
        discount: 28,
        rating: 4.8,
        reviewsCount: 380,
        category: 'Grocery',
        images: [
            'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=60'
        ],
        description: '100% pure yellow mustard oil cold-pressed in wooden Kolhu at low temperatures. Retains original pungency, nutrients, and natural antioxidants. Essential for authentic Indian cooking.',
        stockStatus: 'In Stock',
        stockCount: 400,
        specifications: {
            'Extraction Method': 'Wooden Kolhu Cold Pressed (Kachi Ghani)',
            'Mustard Type': 'Yellow Mustard Seeds',
            'Cholesterol Free': 'Yes',
            'Pack Size': '1 Litre bottle'
        },
        reviews: [
            {
                id: 'r18',
                userName: 'Mamta D.',
                rating: 5,
                comment: 'Very high quality mustard oil. Pure aroma, excellent for pickle making.',
                date: '2026-06-14'
            }
        ]
    },
    {
        id: 'prod-18',
        title: 'The Alchemist (Premium Deluxe Edition)',
        seller: 'Vidya Publications',
        sellerId: 'sel-6',
        price: 349,
        originalPrice: 599,
        discount: 41,
        rating: 4.9,
        reviewsCount: 1205,
        category: 'Books',
        images: [
            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Paulo Coelho\'s masterpiece about Santiago, an Andalusian shepherd boy who journeys to find a worldly treasure. This special edition features premium hardbound binding and custom gold-foiled illustrations.',
        stockStatus: 'In Stock',
        stockCount: 80,
        specifications: {
            'Author': 'Paulo Coelho',
            'Publisher': 'HarperCollins',
            'Format': 'Hardcover Gift Edition',
            'Genre': 'Fiction / Allegory'
        },
        reviews: [
            {
                id: 'r19',
                userName: 'Rahul G.',
                rating: 5,
                comment: 'A book everyone should read. The cover design on this deluxe edition is spectacular.',
                date: '2026-05-24'
            }
        ]
    },
    {
        id: 'prod-19',
        title: 'Interactive Wooden Kitchen Playset',
        seller: 'Tantra Toys Ltd',
        sellerId: 'sel-7',
        price: 3299,
        originalPrice: 5499,
        discount: 40,
        rating: 4.6,
        reviewsCount: 65,
        category: 'Toys',
        images: [
            'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Delight young chefs. Handcrafted from eco-friendly pine wood and painted with non-toxic water-based paints. Includes microwave, stove, sink, kitchen clock, and 5 metal cookware accessories.',
        stockStatus: 'In Stock',
        stockCount: 15,
        specifications: {
            'Material': 'Pine Wood, Plywood (Eco-friendly)',
            'Dimensions': '24" L x 12" W x 32" H',
            'Age Recommendation': '3 Years and above',
            'Certifications': 'EN71 Safety Standard Certified'
        },
        reviews: [
            {
                id: 'r20',
                userName: 'Pallavi S.',
                rating: 5,
                comment: 'Outstanding craftsmanship. Paint is smooth and wood has no sharp edges.',
                date: '2026-06-02'
            }
        ]
    },
    {
        id: 'prod-20',
        title: 'Dual-Cylinder Rapid Tyre Inflator (150 PSI)',
        seller: 'Autocraft Tech',
        sellerId: 'sel-9',
        price: 2299,
        originalPrice: 3999,
        discount: 42,
        rating: 4.7,
        reviewsCount: 190,
        category: 'Automotive',
        images: [
            'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'An emergency essential. This heavy-duty dual-cylinder compressor operates on 12V DC, inflating a standard car tyre in under 2 minutes. Includes high-precision digital gauge, LED light, and auto-shutoff.',
        stockStatus: 'In Stock',
        stockCount: 50,
        specifications: {
            'Power Source': '12V DC (Car Cigarette Lighter / Battery Clamps)',
            'Max Pressure': '150 PSI',
            'Air Flow Rate': '50 Litres/Min',
            'Display': 'Digital Backlit LCD with presets',
            'Safety Features': 'Auto-Shutoff, Overheat Protection'
        },
        reviews: [
            {
                id: 'r21',
                userName: 'Siddharth R.',
                rating: 4,
                comment: 'Inflates my SUV tyres extremely fast. Gauge is accurate and LED flashlight is helpful at night.',
                date: '2026-05-18'
            }
        ]
    },
    {
        id: 'prod-21',
        title: 'USB-C GaN Rapid Charger (65W 3-Port)',
        seller: 'Tantra Accessories',
        sellerId: 'sel-10',
        price: 1499,
        originalPrice: 2999,
        discount: 50,
        rating: 4.8,
        reviewsCount: 310,
        category: 'Mobile Accessories',
        images: [
            'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Charge your laptop, tablet, and phone simultaneously. Powered by Gallium Nitride (GaN) technology, this charger delivers up to 65W output while being 50% smaller than standard chargers.',
        stockStatus: 'In Stock',
        stockCount: 140,
        specifications: {
            'Technology': 'Gallium Nitride (GaN) Tech',
            'Output Ports': '2 x USB-C (PD 3.0), 1 x USB-A (QC 4.0)',
            'Max Output': '65W Power Delivery',
            'Safety Certs': 'BIS Certified, Short-Circuit & Over-Current Protection'
        },
        reviews: [
            {
                id: 'r22',
                userName: 'Vinay T.',
                rating: 5,
                comment: 'Easily charges my MacBook Air and iPhone fast at the same time. Very compact!',
                date: '2026-06-12'
            }
        ]
    },
    {
        id: 'prod-22',
        title: 'Wingback Ergonomic Home Office Chair',
        seller: 'Royal Wood Krafts',
        sellerId: 'sel-11',
        price: 8499,
        originalPrice: 14999,
        discount: 43,
        rating: 4.6,
        reviewsCount: 142,
        category: 'Furniture',
        images: [
            'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Designed for long working hours. Features a tall breathable mesh backrest, adjustable 3D lumber support, height-adjustable padded armrests, tilt-lock mechanism, and heavy-duty nylon wheelbase.',
        stockStatus: 'In Stock',
        stockCount: 18,
        variants: {
            colors: [
                'Charcoal Black',
                'Arctic Grey',
                'Royal Saffron Accent'
            ]
        },
        specifications: {
            'Backrest Type': 'Breathable Nylon Mesh & PP Frame',
            'Tilt Range': '90° to 135° Recline',
            'Gas Lift Class': 'Class 4 Heavy Duty',
            'Weight capacity': 'Up to 135 kg'
        },
        reviews: [
            {
                id: 'r23',
                userName: 'Pradeep J.',
                rating: 4,
                comment: 'Lumber support is fantastic. Mesh keeps my back sweat-free. Very solid build.',
                date: '2026-06-04'
            }
        ]
    },
    {
        id: 'prod-23',
        title: 'Instant-Read Digital Arm BP Monitor',
        seller: 'AyurHealth Pharma',
        sellerId: 'sel-12',
        price: 1799,
        originalPrice: 2999,
        discount: 40,
        rating: 4.5,
        reviewsCount: 230,
        category: 'Health',
        images: [
            'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60'
        ],
        description: 'Monitor your health accurately. This fully automatic blood pressure monitor uses oscillometric measurement to deliver fast, highly accurate readings. Features standard large cuff, voice broadcast, and irregular heartbeat alert.',
        stockStatus: 'In Stock',
        stockCount: 110,
        specifications: {
            'Cuff Size': 'Universal 22-42 cm cuff',
            'Display': 'Extra Large Backlit LCD Screen',
            'Memory': 'Dual Users, 90 sets of readings each',
            'Power Source': '4 AAA Batteries or Type-C Cable support'
        },
        reviews: [
            {
                id: 'r24',
                userName: 'Anil Chawla',
                rating: 5,
                comment: 'Reads very quickly and matching close to clinic readings. Backlight is very nice for elderly.',
                date: '2026-05-14'
            }
        ]
    },
    {
        id: 'prod-24',
        title: 'Pure Premium Organic Saffron / Kesar (1g)',
        seller: 'Swadeshi Farms',
        sellerId: 'sel-5',
        price: 349,
        originalPrice: 699,
        discount: 50,
        rating: 4.9,
        reviewsCount: 654,
        category: 'Grocery',
        images: [
            'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60'
        ],
        description: '100% pure Grade-A original Kashmiri Mongra saffron threads. Handpicked carefully from fresh saffron flowers of Pampore fields. Deep red color, potent aroma, and rich medicinal properties.',
        stockStatus: 'In Stock',
        stockCount: 300,
        specifications: {
            'Grade': 'Grade A+ Mongra Saffron',
            'Harvesting Season': 'Fresh Harvest Pampore',
            'Packaging': 'Airtight acrylic gift box',
            'Net Weight': '1 Gram'
        },
        reviews: [
            {
                id: 'r25',
                userName: 'Sunita Joshi',
                rating: 5,
                comment: 'Incredible aroma and deep golden color. The best quality Kesar I have purchased online.',
                date: '2026-06-15'
            }
        ]
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/layouts/PublicLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PublicLayout",
    ()=>PublicLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Navbar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Footer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AIChatbot$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AIChatbot.tsx [app-client] (ecmascript)");
;
;
;
;
;
function PublicLayout() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex flex-col bg-transparent transition-colors duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Navbar"], {}, void 0, false, {
                fileName: "[project]/src/layouts/PublicLayout.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Outlet"], {}, void 0, false, {
                    fileName: "[project]/src/layouts/PublicLayout.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/layouts/PublicLayout.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Footer"], {}, void 0, false, {
                fileName: "[project]/src/layouts/PublicLayout.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AIChatbot$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/layouts/PublicLayout.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/layouts/PublicLayout.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
_c = PublicLayout;
var _c;
__turbopack_context__.k.register(_c, "PublicLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/layouts/SellerLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SellerLayout",
    ()=>SellerLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router-dom/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/store.js [app-client] (ecmascript) <export default as Store>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-bag.js [app-client] (ecmascript) <export default as ShoppingBag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bar-chart-2.js [app-client] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-client] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-client] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tag.js [app-client] (ecmascript) <export default as Tag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const navItems = [
    {
        label: 'Dashboard',
        to: '/seller',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"]
    },
    {
        label: 'Store Settings',
        to: '/seller/store',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__["Store"]
    },
    {
        label: 'Products',
        to: '/seller/products',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"]
    },
    {
        label: 'Add Product',
        to: '/seller/products/new',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
    },
    {
        label: 'Inventory',
        to: '/seller/inventory',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
    },
    {
        label: 'Orders',
        to: '/seller/orders',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__["ShoppingBag"]
    },
    {
        label: 'Shipments',
        to: '/seller/shipments',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"]
    },
    {
        label: 'Coupons',
        to: '/seller/coupons',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"]
    },
    {
        label: 'Earnings',
        to: '/seller/earnings',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"]
    },
    {
        label: 'Sales Reports',
        to: '/seller/reports',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"]
    },
    {
        label: 'Analytics',
        to: '/seller/analytics',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
    },
    {
        label: 'Reviews',
        to: '/seller/reviews',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"]
    },
    {
        label: 'Profile',
        to: '/seller/profile',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"]
    },
    {
        label: 'Settings',
        to: '/seller/settings',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
function SellerLayout() {
    _s();
    const [sidebarOpen, setSidebarOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user, profile, loading, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const location = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"])();
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"
            }, void 0, false, {
                fileName: "[project]/src/layouts/SellerLayout.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/layouts/SellerLayout.tsx",
            lineNumber: 34,
            columnNumber: 7
        }, this);
    }
    if (!user || profile?.role !== 'seller') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Navigate"], {
            to: "/login",
            replace: true
        }, void 0, false, {
            fileName: "[project]/src/layouts/SellerLayout.tsx",
            lineNumber: 41,
            columnNumber: 12
        }, this);
    }
    const isActive = (to)=>{
        if (to === '/seller') return location.pathname === '/seller';
        return location.pathname.startsWith(to);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 flex",
        children: [
            sidebarOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 z-30 lg:hidden",
                onClick: ()=>setSidebarOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/layouts/SellerLayout.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
        fixed top-0 left-0 h-full w-64 bg-[#1B3A6B] text-white z-40
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/SHOPTANTRA.png",
                                alt: "ShopTantra",
                                className: "h-8 w-auto"
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(false),
                                className: "lg:hidden p-1 rounded hover:bg-white/10",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 64,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold",
                                    children: profile?.full_name?.[0] ?? 'S'
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 70,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm font-medium truncate",
                                            children: profile?.full_name ?? 'Seller'
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/SellerLayout.tsx",
                                            lineNumber: 74,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-300",
                                            children: "Seller Account"
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/SellerLayout.tsx",
                                            lineNumber: 75,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/SellerLayout.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 p-3 space-y-0.5 overflow-y-auto",
                        children: navItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                to: item.to,
                                onClick: ()=>setSidebarOpen(false),
                                className: `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive(item.to) ? 'bg-orange-500 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
              `,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                        className: "w-4 h-4 shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                                        lineNumber: 93,
                                        columnNumber: 15
                                    }, this),
                                    item.label
                                ]
                            }, item.to, true, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 border-t border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: signOut,
                            className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 104,
                                    columnNumber: 13
                                }, this),
                                "Sign Out"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/SellerLayout.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/SellerLayout.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 lg:ml-64 flex flex-col min-h-screen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(true),
                                className: "lg:hidden p-2 rounded-lg hover:bg-gray-100",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden lg:block",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "Seller Dashboard"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/SellerLayout.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 ml-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                        to: "/seller/notifications",
                                        className: "p-2 rounded-lg hover:bg-gray-100 relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                                className: "w-5 h-5 text-gray-600"
                                            }, void 0, false, {
                                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                                lineNumber: 120,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"
                                            }, void 0, false, {
                                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                                lineNumber: 121,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                                        lineNumber: 119,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                        to: "/",
                                        className: "text-xs text-gray-500 hover:text-orange-500",
                                        children: "View Store"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                                        lineNumber: 123,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/layouts/SellerLayout.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 p-4 sm:p-6 lg:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Outlet"], {}, void 0, false, {
                            fileName: "[project]/src/layouts/SellerLayout.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/SellerLayout.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/SellerLayout.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/layouts/SellerLayout.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_s(SellerLayout, "7y/QPMBO0231NFj7/u6/apA5Ax4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"]
    ];
});
_c = SellerLayout;
var _c;
__turbopack_context__.k.register(_c, "SellerLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/layouts/BuyerLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BuyerLayout",
    ()=>BuyerLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router-dom/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-bag.js [app-client] (ecmascript) <export default as ShoppingBag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ticket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ticket$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ticket.js [app-client] (ecmascript) <export default as Ticket>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const navItems = [
    {
        label: 'Dashboard',
        to: '/buyer',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"]
    },
    {
        label: 'My Profile',
        to: '/buyer/profile',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"]
    },
    {
        label: 'Order History',
        to: '/buyer/orders',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__["ShoppingBag"]
    },
    {
        label: 'Wishlist',
        to: '/buyer/wishlist',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"]
    },
    {
        label: 'Saved Addresses',
        to: '/buyer/addresses',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"]
    },
    {
        label: 'Notifications',
        to: '/buyer/notifications',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"]
    },
    {
        label: 'Support Tickets',
        to: '/buyer/tickets',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ticket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ticket$3e$__["Ticket"]
    },
    {
        label: 'Invoices',
        to: '/buyer/invoices',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
    },
    {
        label: 'Account Settings',
        to: '/buyer/settings',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
function BuyerLayout() {
    _s();
    const [sidebarOpen, setSidebarOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user, profile, loading, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const location = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"])();
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"
            }, void 0, false, {
                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/layouts/BuyerLayout.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this);
    }
    if (!user || profile?.role !== 'buyer') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Navigate"], {
            to: "/login",
            replace: true
        }, void 0, false, {
            fileName: "[project]/src/layouts/BuyerLayout.tsx",
            lineNumber: 35,
            columnNumber: 12
        }, this);
    }
    const isActive = (to)=>{
        if (to === '/buyer') return location.pathname === '/buyer';
        return location.pathname.startsWith(to);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 flex",
        children: [
            sidebarOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 z-30 lg:hidden",
                onClick: ()=>setSidebarOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                lineNumber: 46,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
        fixed top-0 left-0 h-full w-64 bg-[#1B3A6B] text-white z-40
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/SHOPTANTRA.png",
                                alt: "ShopTantra",
                                className: "h-8 w-auto"
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(false),
                                className: "lg:hidden p-1 rounded hover:bg-white/10",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 58,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold",
                                    children: profile?.full_name?.[0] ?? 'B'
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 64,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm font-medium truncate",
                                            children: profile?.full_name ?? 'Buyer'
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                            lineNumber: 68,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-300",
                                            children: "Buyer Account"
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 67,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/BuyerLayout.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 p-3 space-y-0.5 overflow-y-auto",
                        children: navItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                to: item.to,
                                onClick: ()=>setSidebarOpen(false),
                                className: `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive(item.to) ? 'bg-orange-500 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
              `,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                        className: "w-4 h-4 shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                        lineNumber: 87,
                                        columnNumber: 15
                                    }, this),
                                    item.label
                                ]
                            }, item.to, true, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 76,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 border-t border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: signOut,
                            className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 98,
                                    columnNumber: 13
                                }, this),
                                "Sign Out"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/BuyerLayout.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 lg:ml-64 flex flex-col min-h-screen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(true),
                                className: "lg:hidden p-2 rounded-lg hover:bg-gray-100",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 107,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 106,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden lg:block",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "My Account"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 110,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 ml-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                    to: "/",
                                    className: "text-xs text-gray-500 hover:text-orange-500",
                                    children: "Continue Shopping"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 p-4 sm:p-6 lg:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Outlet"], {}, void 0, false, {
                            fileName: "[project]/src/layouts/BuyerLayout.tsx",
                            lineNumber: 118,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/BuyerLayout.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/BuyerLayout.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/layouts/BuyerLayout.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
_s(BuyerLayout, "7y/QPMBO0231NFj7/u6/apA5Ax4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"]
    ];
});
_c = BuyerLayout;
var _c;
__turbopack_context__.k.register(_c, "BuyerLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/layouts/AdminLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminLayout",
    ()=>AdminLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-router-dom/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-bag.js [app-client] (ecmascript) <export default as ShoppingBag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bar-chart-2.js [app-client] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-client] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tag.js [app-client] (ecmascript) <export default as Tag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-client] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-client] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/store.js [app-client] (ecmascript) <export default as Store>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const navGroups = [
    {
        label: 'Overview',
        items: [
            {
                label: 'Dashboard',
                to: '/admin',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"]
            },
            {
                label: 'Analytics',
                to: '/admin/analytics',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
            },
            {
                label: 'Revenue',
                to: '/admin/revenue',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"]
            },
            {
                label: 'Reports',
                to: '/admin/reports',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"]
            }
        ]
    },
    {
        label: 'Users',
        items: [
            {
                label: 'All Users',
                to: '/admin/users',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"]
            },
            {
                label: 'Sellers',
                to: '/admin/sellers',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__["Store"]
            },
            {
                label: 'Buyers',
                to: '/admin/buyers',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"]
            }
        ]
    },
    {
        label: 'Marketplace',
        items: [
            {
                label: 'Products',
                to: '/admin/products',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"]
            },
            {
                label: 'Orders',
                to: '/admin/orders',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__["ShoppingBag"]
            },
            {
                label: 'Shipments',
                to: '/admin/shipments',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"]
            },
            {
                label: 'Categories',
                to: '/admin/categories',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"]
            }
        ]
    },
    {
        label: 'Business',
        items: [
            {
                label: 'Leads',
                to: '/admin/leads',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
            },
            {
                label: 'Subscriptions',
                to: '/admin/subscriptions',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
            }
        ]
    },
    {
        label: 'System',
        items: [
            {
                label: 'CMS',
                to: '/admin/cms',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"]
            },
            {
                label: 'Banners',
                to: '/admin/cms?tab=banners',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"]
            },
            {
                label: 'Blog Management',
                to: '/admin/blog-management',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
            },
            {
                label: 'Roles & Access',
                to: '/admin/roles',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"]
            },
            {
                label: 'Security Logs',
                to: '/admin/security-logs',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"]
            },
            {
                label: 'Settings',
                to: '/admin/settings',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
            }
        ]
    }
];
function AdminLayout() {
    _s();
    const [sidebarOpen, setSidebarOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user, profile, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const location = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"])();
    // Enforce admin authentication
    if (!user || profile?.role !== 'admin') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Navigate"], {
            to: "/login",
            replace: true
        }, void 0, false, {
            fileName: "[project]/src/layouts/AdminLayout.tsx",
            lineNumber: 64,
            columnNumber: 12
        }, this);
    }
    const isActive = (to)=>{
        if (to === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(to);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 flex",
        children: [
            sidebarOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 z-30 lg:hidden",
                onClick: ()=>setSidebarOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/layouts/AdminLayout.tsx",
                lineNumber: 75,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
        fixed top-0 left-0 h-full w-64 bg-[#1B3A6B] text-white z-40
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: "/SHOPTANTRA.png",
                                        alt: "ShopTantra",
                                        className: "h-8 w-auto"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 86,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-orange-400 mt-0.5 font-medium",
                                        children: "Admin Panel"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(false),
                                className: "lg:hidden p-1 rounded hover:bg-white/10",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/AdminLayout.tsx",
                                    lineNumber: 90,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold",
                                    children: profile?.full_name?.[0] ?? 'A'
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/AdminLayout.tsx",
                                    lineNumber: 96,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm font-medium truncate",
                                            children: profile?.full_name ?? 'Admin'
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/AdminLayout.tsx",
                                            lineNumber: 100,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-orange-300 font-medium",
                                            children: "Administrator"
                                        }, void 0, false, {
                                            fileName: "[project]/src/layouts/AdminLayout.tsx",
                                            lineNumber: 101,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/layouts/AdminLayout.tsx",
                                    lineNumber: 99,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/AdminLayout.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 p-3 space-y-4 overflow-y-auto",
                        children: navGroups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1",
                                        children: group.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-0.5",
                                        children: group.items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                                to: item.to,
                                                onClick: ()=>setSidebarOpen(false),
                                                className: `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                      ${isActive(item.to) ? 'bg-orange-500 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                    `,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                        className: "w-4 h-4 shrink-0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                                        lineNumber: 125,
                                                        columnNumber: 21
                                                    }, this),
                                                    item.label
                                                ]
                                            }, item.to, true, {
                                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                                lineNumber: 114,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 112,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, group.label, true, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 border-t border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: signOut,
                            className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/AdminLayout.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this),
                                "Sign Out"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/layouts/AdminLayout.tsx",
                            lineNumber: 135,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/AdminLayout.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 lg:ml-64 flex flex-col min-h-screen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarOpen(true),
                                className: "lg:hidden p-2 rounded-lg hover:bg-gray-100",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/layouts/AdminLayout.tsx",
                                    lineNumber: 148,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden lg:flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                        className: "w-4 h-4 text-orange-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 151,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Admin Control Panel"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 152,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 ml-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                        to: "/admin/notifications",
                                        className: "p-2 rounded-lg hover:bg-gray-100 relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                                className: "w-5 h-5 text-gray-600"
                                            }, void 0, false, {
                                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                                lineNumber: 156,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                                            }, void 0, false, {
                                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                                lineNumber: 157,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 155,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2d$dom$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Link"], {
                                        to: "/",
                                        className: "text-xs text-gray-500 hover:text-orange-500",
                                        children: "View Site"
                                    }, void 0, false, {
                                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                                        lineNumber: 159,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/layouts/AdminLayout.tsx",
                                lineNumber: 154,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 p-4 sm:p-6 lg:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Outlet"], {}, void 0, false, {
                            fileName: "[project]/src/layouts/AdminLayout.tsx",
                            lineNumber: 164,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/layouts/AdminLayout.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/layouts/AdminLayout.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/layouts/AdminLayout.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
_s(AdminLayout, "ipvc1wHjjRtkJEIAzl1U5B6Ky08=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$router$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useLocation"]
    ];
});
_c = AdminLayout;
var _c;
__turbopack_context__.k.register(_c, "AdminLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/ClientApp.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/ClientApp.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_0frct6o._.js.map