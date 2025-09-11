import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import accountMasterReducer from './slices/accountMasterSlice';
import staffReducer from './slices/staffSlice';
import assignTaskReducer from './slices/assignTaskSlice';
import leadReducer from './slices/leadSlice';
import purchaseReducer from './slices/purchaseSlice';
import companyReducer from './slices/compnaySlice';
import partyReducer from './slices/partySlice';
import productItemReducer from './slices/productItemSlice';
import fileUploadReducer from "./slices/fileUploadSlice";
import orderReducer from "./slices/orderSlice";
import qpOrderReducer from "./slices/qpOrderSlice";
import packagingOptionReducer from "./slices/packagingOptionSlice"
import statusReducer from "./slices/statusSlice";
import roleReducer from "./slices/roleSlice";
import materialReducer from "./slices/materialSlice";
import roleDepartmentReducer from '@/store/slices/roleDepartmentSlice';
import performanceInvoiceReducer from '@/store/slices/performanceInvoiceSlice';
import companyNameReducer from '@/store/slices/companyNameSlice';
import vendorReducer from '@/store/slices/vendorSlice';
import inventoryReducer from '@/store/slices/inventorySlice';
import binderTypeReducer from '@/store/slices/binderTypeSlice';
import marketDataReducer from '@/store/slices/marketDataSlice';
import kantanReducer from '@/store/slices/kantanSlice';
// Persist configuration
export const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user'], // Persist both token and user
  version: 1,
};

// Create persisted reducer for auth
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Configure the store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    accountMasters: accountMasterReducer,
    staff: staffReducer,
    assignTasks: assignTaskReducer,
    leads: leadReducer, // Add leadReducer
    purchase: purchaseReducer,
    company: companyReducer,
    party: partyReducer,
    productItems: productItemReducer,
    fileUpload: fileUploadReducer,
    orders: orderReducer,
    qpOrders: qpOrderReducer,
    packagingOptions: packagingOptionReducer,
    status: statusReducer,
    roles: roleReducer,
    materials: materialReducer,
    roleDepartments: roleDepartmentReducer,
    performanceInvoices: performanceInvoiceReducer,
    companyNames: companyNameReducer,
    vendors: vendorReducer,
    inventory: inventoryReducer,
    binderType: binderTypeReducer,
    markets: marketDataReducer,
    kantans: kantanReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;