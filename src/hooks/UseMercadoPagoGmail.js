import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

// ─── Configuración OAuth Gmail ───────────────────────────────────────────────
// Reemplazá con tu Client ID de Google Cloud Console (mismo proyecto Firebase)
const GOOGLE_CLIENT_ID = 'TU_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';

const GMAIL_SCOPES = [
'openid',
'profile',
'email',
'https://www.googleapis.com/auth/gmail.readonly',
];

const DISCOVERY = {
authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
tokenEndpoint:         'https://oauth2.googleapis.com/token',
revocationEndpoint:    'https://accounts.google.com/o/oauth2/revoke',
};

const STORAGE_KEY = 'mp_gmail_token';

// ─── Patrones de parseo de emails de Mercado Pago ────────────────────────────
// MP cambia el asunto seguido, por eso usamos múltiples patrones
const MP_PATTERNS = [
  // Gastos
  { regex: /pagaste\s+\$?([\d.,]+)\s+en\s+(.+)/i,         type: 'expense', amountIdx: 1, descIdx: 2 },
  { regex: /compraste\s+en\s+(.+?)\s+por\s+\$?([\d.,]+)/i, type: 'expense', amountIdx: 2, descIdx: 1 },
  { regex: /debitamos\s+\$?([\d.,]+)\s+de\s+tu\s+cuenta/i, type: 'expense', amountIdx: 1, descIdx: null },
  { regex: /realizaste una transferencia de \$?([\d.,]+)/i, type: 'expense', amountIdx: 1, descIdx: null },
  { regex: /pagaste \$?([\d.,]+)/i,                        type: 'expense', amountIdx: 1, descIdx: null },
  // Ingresos
  { regex: /recibiste\s+\$?([\d.,]+)/i,                    type: 'income',  amountIdx: 1, descIdx: null },
  { regex: /te\s+enviaron\s+\$?([\d.,]+)/i,                type: 'income',  amountIdx: 1, descIdx: null },
  { regex: /acreditamos\s+\$?([\d.,]+)/i,                  type: 'income',  amountIdx: 1, descIdx: null },
  { regex: /transferencia recibida de \$?([\d.,]+)/i,      type: 'income',  amountIdx: 1, descIdx: null },
  { regex: /recibiste una transferencia de \$?([\d.,]+)/i, type: 'income',  amountIdx: 1, descIdx: null },
];

// Convierte “1.500,50” o “1500.50” a número
const parseAmount = (str) => {
if (!str) return 0;
const cleaned = str.replace(/./g, '').replace(',', '.');
return parseFloat(cleaned) || 0;
};

// Intenta parsear el asunto del email
const parseSubject = (subject) => {
const lower = subject.toLowerCase();
for (const pattern of MP_PATTERNS) {
const match = lower.match(pattern.regex);
if (match) {
const amount = parseAmount(match[pattern.amountIdx]);
const description = pattern.descIdx
? (match[pattern.descIdx] || 'Mercado Pago')
: 'Mercado Pago';
if (amount > 0) {
return { amount, type: pattern.type, description: description.trim() };
}
}
}
return null;
};

// Decodifica base64url de Gmail
const decodeBase64 = (data) => {
try {
const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
return decodeURIComponent(
atob(base64)
.split('')
.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
.join('')
);
} catch (e) {
return '';
}
};

export function useMercadoPagoGmail() {
const [accessToken, setAccessToken] = useState(null);
const [loading, setLoading] = useState(false);
const [syncing, setSyncing] = useState(false);
const [error, setError] = useState(null);
const [pendingTx, setPendingTx] = useState([]);   // Para confirmar antes de importar
const [lastSync, setLastSync] = useState(null);
const [connected, setConnected] = useState(false);

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'com.flowcash.app',useProxy: true });

const [request, response, promptAsync] = AuthSession.useAuthRequest(
{
clientId: GOOGLE_CLIENT_ID,
scopes: GMAIL_SCOPES,
redirectUri,
responseType: AuthSession.ResponseType.Code,
extraParams: { access_type: 'offline', prompt: 'consent' },
},
DISCOVERY
);

// Al arrancar, restaurar token guardado
useEffect(() => {
const restore = async () => {
try {
const saved = await SecureStore.getItemAsync(STORAGE_KEY);
if (saved) {
const parsed = JSON.parse(saved);
setAccessToken(parsed.accessToken);
setConnected(true);
setLastSync(parsed.lastSync ? new Date(parsed.lastSync) : null);
}
} catch (e) {}
};
restore();
}, []);

// Manejar respuesta del OAuth
useEffect(() => {
if (response?.type === 'success') {
const { code } = response.params;
exchangeCodeForToken(code);
} else if (response?.type === 'error') {
setError('Error al conectar con Google');
setLoading(false);
}
}, [response]);

// Intercambiar código por access token
const exchangeCodeForToken = async (code) => {
try {
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
body: new URLSearchParams({
code,
client_id: GOOGLE_CLIENT_ID,
redirect_uri: redirectUri,
grant_type: 'authorization_code',
}).toString(),
});
const tokenData = await tokenRes.json();
if (tokenData.access_token) {
setAccessToken(tokenData.access_token);
setConnected(true);
await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({
accessToken: tokenData.access_token,
lastSync: null,
}));
} else {
setError('No se pudo obtener el token de acceso');
}
} catch (e) {
setError('Error al autenticar');
}
setLoading(false);
};

// Conectar Gmail
const connectGmail = async () => {
setLoading(true);
setError(null);
await promptAsync();
};

// Desconectar Gmail
const disconnectGmail = async () => {
try {
if (accessToken) {
await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + accessToken);
}
await SecureStore.deleteItemAsync(STORAGE_KEY);
} catch (e) {}
setAccessToken(null);
setConnected(false);
setPendingTx([]);
setLastSync(null);
};

// Sincronizar emails de Mercado Pago
const syncEmails = async (daysBack = 30) => {
if (!accessToken) return;
setSyncing(true);
setError(null);
try {
// Fecha de búsqueda
const after = new Date();
after.setDate(after.getDate() - daysBack);
const afterUnix = Math.floor(after.getTime() / 1000);


  // Buscar emails de MP
  const query = encodeURIComponent(
    'from:no-reply@mail.mercadopago.com after:' + afterUnix
  );
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + query + '&maxResults=50',
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );

  if (listRes.status === 401) {
    setError('Sesión expirada. Reconectá tu Gmail.');
    setConnected(false);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setSyncing(false);
    return;
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  if (messages.length === 0) {
    setPendingTx([]);
    setSyncing(false);
    return;
  }

  // Obtener detalles de cada email
  const parsed = [];
  for (const msg of messages.slice(0, 30)) {
    try {
      const msgRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + msg.id + '?format=metadata&metadataHeaders=Subject&metadataHeaders=Date',
        { headers: { Authorization: 'Bearer ' + accessToken } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const dateStr = headers.find(h => h.name === 'Date')?.value || '';
      const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const result = parseSubject(subject);
      if (result) {
        parsed.push({
          id: msg.id,
          ...result,
          date,
          source: 'mercadopago',
          category: result.type === 'expense' ? 'otros' : 'otros_ingresos',
          rawSubject: subject,
        });
      }
    } catch (e) {}
  }

  // Ordenar por fecha desc
  parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
  setPendingTx(parsed);

  const now = new Date();
  setLastSync(now);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({
    accessToken,
    lastSync: now.toISOString(),
  }));
} catch (e) {
  setError('Error al leer emails. Intentá de nuevo.');
}
setSyncing(false);


};

return {
connected,
loading,
syncing,
error,
pendingTx,
lastSync,
request,
connectGmail,
disconnectGmail,
syncEmails,
setPendingTx,
};
}