import { persistor, store } from "@/store";
import "@/styles/globals.css";
import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from "next/router";
import Dashboard from "@/component/Dashboard";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
{router.pathname === "/login" ? <Component {...pageProps} />:<Dashboard>
  <Component {...pageProps} /></Dashboard>}
          {/* <Component {...pageProps} />; */}
          <ToastContainer/>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )

}
