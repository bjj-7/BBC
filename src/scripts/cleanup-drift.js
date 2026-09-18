import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

// Dev script — run with: node --env-file=.env src/scripts/cleanup-drift.js [--fix]
// Requires Node 20.6+ for --env-file support. The .env file must contain
// VITE_FIREBASE_* variables (same ones used by the Vite app).
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("ERROR: Missing Firebase env vars. Run with: node --env-file=.env src/scripts/cleanup-drift.js");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDrift() {
  console.log("Fetching database state...");
  
  const settingsRef = doc(db, 'settings', 'general');
  const settingsSnap = await getDoc(settingsRef);
  const settings = settingsSnap.exists() ? settingsSnap.data() : {};
  
  const productsSnap = await getDocs(collection(db, 'products'));
  const products = [];
  productsSnap.forEach(doc => {
    products.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${products.length} products.`);
  
  const productIds = new Set(products.map(p => p.id));
  const productCategories = new Set(products.map(p => p.category).filter(Boolean));
  const productSubcategories = new Set(products.map(p => p.subcategory).filter(Boolean));

  let hasDrift = false;
  const updates = {};

  // Check bestsellerIds
  if (settings.bestsellerIds) {
    const validBestsellerIds = settings.bestsellerIds.filter(id => productIds.has(id));
    if (validBestsellerIds.length !== settings.bestsellerIds.length) {
      console.log(`[Drift] bestsellerIds has stale data. Expected ${validBestsellerIds.length}, got ${settings.bestsellerIds.length}.`);
      updates.bestsellerIds = validBestsellerIds;
      hasDrift = true;
    }
  }

  // Check featuredIds
  if (settings.featuredIds) {
    const validFeaturedIds = settings.featuredIds.filter(id => productIds.has(id));
    if (validFeaturedIds.length !== settings.featuredIds.length) {
      console.log(`[Drift] featuredIds has stale data. Expected ${validFeaturedIds.length}, got ${settings.featuredIds.length}.`);
      updates.featuredIds = validFeaturedIds;
      hasDrift = true;
    }
  }
  
  if (settings.categoryMapping) {
    const newMapping = { ...settings.categoryMapping };
    let mappingChanged = false;
    
    // We only clean up categories from mapping if they don't exist in products AND managedCategories
    const allValidCategories = new Set([
      ...productCategories,
      ...(settings.managedCategories || [])
    ]);
    
    const allValidSubcategories = new Set([
      ...productSubcategories,
      ...(settings.managedSubcategories || [])
    ]);

    // Check exploreCategories
    if (settings.exploreCategories) {
      const newExploreCategories = settings.exploreCategories.map(cat => {
        if (cat.name && !allValidCategories.has(cat.name)) {
          console.log(`[Drift] exploreCategories has invalid category: ${cat.name}`);
          return { ...cat, name: "" }; // clear it
        }
        return cat;
      });
      if (JSON.stringify(newExploreCategories) !== JSON.stringify(settings.exploreCategories)) {
        updates.exploreCategories = newExploreCategories;
        hasDrift = true;
      }
    }

    // Check unused managedCategories
    if (settings.managedCategories) {
      const unusedCategories = settings.managedCategories.filter(cat => !productCategories.has(cat));
      if (unusedCategories.length > 0) {
        console.log(`[Drift] managedCategories has unused categories: ${unusedCategories.join(', ')}`);
        // If we want to strictly clean them up:
        const validManagedCategories = settings.managedCategories.filter(cat => productCategories.has(cat) || settings.categoryMapping?.[cat]);
        if (validManagedCategories.length !== settings.managedCategories.length) {
          updates.managedCategories = validManagedCategories;
          hasDrift = true;
        }
      }
    }

    // Check unused managedSubcategories
    if (settings.managedSubcategories) {
      const unusedSubcategories = settings.managedSubcategories.filter(subcat => !productSubcategories.has(subcat));
      if (unusedSubcategories.length > 0) {
        console.log(`[Drift] managedSubcategories has unused subcategories: ${unusedSubcategories.join(', ')}`);
        // Also check if it's used in categoryMapping
        const isSubcatUsedInMapping = (subcat) => {
          if (!settings.categoryMapping) return false;
          for (const key in settings.categoryMapping) {
            if (settings.categoryMapping[key].includes(subcat)) return true;
          }
          return false;
        };
        const validManagedSubcategories = settings.managedSubcategories.filter(subcat => productSubcategories.has(subcat) || isSubcatUsedInMapping(subcat));
        if (validManagedSubcategories.length !== settings.managedSubcategories.length) {
          updates.managedSubcategories = validManagedSubcategories;
          hasDrift = true;
        }
      }
    }

    for (const cat in newMapping) {
      if (!allValidCategories.has(cat)) {
        console.log(`[Drift] Category mapping has unused category: ${cat}`);
        delete newMapping[cat];
        mappingChanged = true;
      } else {
        const validSubcats = newMapping[cat].filter(subcat => allValidSubcategories.has(subcat));
        if (validSubcats.length !== newMapping[cat].length) {
          console.log(`[Drift] Category mapping for ${cat} has stale subcategories.`);
          newMapping[cat] = validSubcats;
          mappingChanged = true;
        }
      }
    }
    if (mappingChanged) {
      updates.categoryMapping = newMapping;
      hasDrift = true;
    }
  }

  // Check ProductRequests
  const requestsSnap = await getDocs(collection(db, 'productRequests'));
  const requests = [];
  requestsSnap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
  
  const staleRequests = requests.filter(req => !productIds.has(req.productId));
  if (staleRequests.length > 0) {
    console.log(`[Drift] Found ${staleRequests.length} stale product requests referencing deleted products.`);
    hasDrift = true;
    updates.deleteRequests = staleRequests.map(r => r.id);
  }

  // Check products with missing/invalid categories
  const productsWithoutCategory = products.filter(p => !p.category || p.category.trim() === '');
  if (productsWithoutCategory.length > 0) {
    console.log(`[Drift] Found ${productsWithoutCategory.length} products without a valid category.`);
    hasDrift = true;
    updates.productsToFix = productsWithoutCategory.map(p => p.id);
  }

  if (hasDrift) {
    console.log("Drift detected. Suggested updates:");
    console.log(JSON.stringify(updates, null, 2));
    
    // Check command line arg for actual fix
    if (process.argv.includes('--fix')) {
      console.log("Applying fixes...");
      await updateDoc(settingsRef, updates);
      console.log("Fixes applied successfully.");
    } else {
      console.log("Run with --fix to apply updates.");
    }
  } else {
    console.log("No drift detected.");
  }
}

checkDrift().then(() => process.exit(0)).catch(console.error);
