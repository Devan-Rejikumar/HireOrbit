import admin from 'firebase-admin';

const validateFirebaseEnv = () => {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
  ];
  
  const hasPrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64;
  
  if (!hasPrivateKey) {
    required.push('FIREBASE_PRIVATE_KEY or FIREBASE_PRIVATE_KEY_BASE64');
  }
  
  const missing = required.filter(key => !process.env[key] && key !== 'FIREBASE_PRIVATE_KEY or FIREBASE_PRIVATE_KEY_BASE64');
  
  if (missing.length > 0 || !hasPrivateKey) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.length > 0 ? missing.join(', ') : ''}${!hasPrivateKey ? 'FIREBASE_PRIVATE_KEY or FIREBASE_PRIVATE_KEY_BASE64' : ''}`
    );
  }
};

if (!admin.apps.length) {
  try {
    validateFirebaseEnv();
    let privateKey: string;
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
    } else {
      privateKey = process.env.FIREBASE_PRIVATE_KEY!;
    }

    privateKey = privateKey.replace(/\\n/g, '\n');
    
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {

    console.error('Firebase initialization failed:', error instanceof Error ? error.message : error);
    throw error; 
  }
}

export default admin;

