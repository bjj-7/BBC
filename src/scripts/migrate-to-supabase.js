import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { createClient } from "@supabase/supabase-js";

// Load env vars
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// MUST use service role key to bypass RLS for data migration
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function migrateData() {
  console.log("Starting data migration from Firestore to Supabase...");

  // 1. Migrate Products
  console.log("Migrating products...");
  const productsSnap = await getDocs(collection(db, "products"));
  const products = [];
  productsSnap.forEach(doc => {
    const data = doc.data();
    products.push({
      id: doc.id,
      name: data.name,
      category: data.category || null,
      subcategory: data.subcategory || null,
      price: data.price || 0,
      stock: data.stock || 0,
      description: data.description || null,
      imageUrl: data.imageUrl || null
    });
  });

  if (products.length > 0) {
    const { error } = await supabase.from('products').upsert(products);
    if (error) console.error("Error inserting products:", error);
    else console.log(`Successfully migrated ${products.length} products.`);
  }

  // 2. Migrate Settings
  console.log("Migrating settings...");
  const settingsSnap = await getDoc(doc(db, "settings", "general"));
  if (settingsSnap.exists()) {
    const data = settingsSnap.data();
    const settings = {
      id: 'general',
      heroSubtitle: data.heroSubtitle,
      offersTitle: data.offersTitle,
      offersDiscount: data.offersDiscount,
      offersDesc: data.offersDesc,
      bestsellerIds: data.bestsellerIds || [],
      bestsellersTitle: data.bestsellersTitle,
      bestsellersSubtitle: data.bestsellersSubtitle,
      featuredIds: data.featuredIds || [],
      featuredTitle: data.featuredTitle,
      featuredSubtitle: data.featuredSubtitle,
      exploreCategories: data.exploreCategories || [],
      exploreTitle: data.exploreTitle,
      exploreSubtitle: data.exploreSubtitle,
      sectionLayout: data.sectionLayout || [],
      managedCategories: data.managedCategories || [],
      managedSubcategories: data.managedSubcategories || [],
      categoryMapping: data.categoryMapping || {}
    };

    const { error } = await supabase.from('settings').upsert(settings);
    if (error) console.error("Error inserting settings:", error);
    else console.log(`Successfully migrated general settings.`);
  }

  // We are not migrating Auth users programmatically here because moving passwords 
  // requires Firebase Admin SDK to export hashes, which is complex. 
  // We recommend users sign in with Google again (OAuth maps by email automatically).
  // Also, we skip orders and productRequests for now because they reference auth.users(id), 
  // which will be different in Supabase Auth. 
  console.log("\nMigration completed! Note: Orders and Product Requests were not migrated as they depend on User IDs which change during Auth migration.");
}

migrateData().then(() => process.exit(0)).catch(console.error);
