import { useEffect, useState } from "react";
import LoadingToRedirect from "./loadingToRedirect";
import usefoodDelivery from "../globalState/fooddeliveryStore";
import { currentRestau } from "../api/auth";

const ProtectRouteStore = ({ element }) => {
  const [ok, setOk] = useState(false);

  const user = usefoodDelivery((state) => state.user);
  const token = usefoodDelivery((state) => state.token);


  useEffect(() => {
    if (!user || !token) {
      setOk(false);
      return;
    }

    // MERCHANT
    if (user.role === "MERCHANT") {
      currentRestau(token)
        .then(() => {
          setOk(true);
        })
        .catch((error) => {
          console.log("currentRestau error =", error);
          setOk(false);
        });

      return;
    }

    // DELIVERY
    if (user.role === "DELIVERY") {
      setOk(true);
      return;
    }

    setOk(false);
  }, [user, token]);

  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteStore;
