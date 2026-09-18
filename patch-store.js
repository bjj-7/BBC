import fs from 'fs';

let content = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

const imports = `import {
  addProductAction,
  updateProductAction,
  deleteProductAction,
  updateStoreSettingsAction,
  getAllOrdersAction,
  getUserOrdersAction,
  updateOrderStatusAction,
  cancelOrderAction,
  getAllProductRequestsAction,
  createProductRequestAction,
  createOrderAction
} from '../../app/actions';\n`;

content = content.replace(/import \{ supabase \} from '\.\.\/supabase\/config';/, "import { supabase } from '../supabase/config';\n" + imports);

// replace addProduct
content = content.replace(
  /addProduct:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+updateProduct:)/,
  'addProduct: async ($1) => {\n    await addProductAction($1);\n    // Refresh products\n    const { data } = await supabase.from(\'products\').select(\'*\');\n    if (data) set({ products: data as Product[] });\n  },'
);

// replace updateProduct
content = content.replace(
  /updateProduct:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+deleteProduct:)/,
  'updateProduct: async ($1) => {\n    await updateProductAction($1);\n    // Refresh products\n    const { data } = await supabase.from(\'products\').select(\'*\');\n    if (data) set({ products: data as Product[] });\n  },'
);

// replace deleteProduct
content = content.replace(
  /deleteProduct:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+updateStoreSettings:)/,
  'deleteProduct: async ($1) => {\n    await deleteProductAction($1);\n    // Refresh products\n    const { data } = await supabase.from(\'products\').select(\'*\');\n    if (data) set({ products: data as Product[] });\n  },'
);

// replace updateStoreSettings
content = content.replace(
  /updateStoreSettings:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+createOrder:)/,
  'updateStoreSettings: async ($1) => {\n    await updateStoreSettingsAction($1);\n    set({ storeSettings: $1 });\n  },'
);

// replace createOrder
content = content.replace(
  /createOrder:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+getUserOrders:)/,
  'createOrder: async ($1) => {\n    return await createOrderAction($1);\n  },'
);

// replace getUserOrders
content = content.replace(
  /getUserOrders:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+getAllOrders:)/,
  'getUserOrders: async ($1) => {\n    return await getUserOrdersAction();\n  },'
);

// replace getAllOrders
content = content.replace(
  /getAllOrders:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?(?=\s+updateOrderStatus:)/,
  'getAllOrders: async () => {\n    return await getAllOrdersAction();\n  },'
);

// replace updateOrderStatus
content = content.replace(
  /updateOrderStatus:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+cancelOrder:)/,
  'updateOrderStatus: async ($1) => {\n    const [orderId, status] = arguments;\n    await updateOrderStatusAction(orderId, status);\n  },'
);

// replace cancelOrder
content = content.replace(
  /cancelOrder:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+createProductRequest:)/,
  'cancelOrder: async ($1) => {\n    await cancelOrderAction($1.id!);\n  },'
);

// replace createProductRequest
content = content.replace(
  /createProductRequest:\s*async\s*\(([^)]+)\)\s*=>\s*\{[\s\S]*?(?=\s+getAllProductRequests:)/,
  'createProductRequest: async ($1) => {\n    await createProductRequestAction($1);\n  },'
);

// replace getAllProductRequests
content = content.replace(
  /getAllProductRequests:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?(?=\s+loginWithGoogle:)/,
  'getAllProductRequests: async () => {\n    return await getAllProductRequestsAction();\n  },'
);


fs.writeFileSync('src/store/useAppStore.ts', content);
