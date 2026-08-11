import { ReactNode, FC } from "react";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store";
import { isSSR } from "@/helpers/getters";
import { Provider } from "react-redux";

type ProviderProps = {
  children: ReactNode;
};

const ReduxProvider: FC<ProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      {isSSR() ? (
        children
      ) : (
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      )}
    </Provider>
  );
};

export default ReduxProvider;
