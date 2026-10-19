import { useEffect, useState } from "react"
import LoadingToRedirect from "./loadingToRedirect"
import usefoodDelivery from "../globalState/fooddeliveryStore"
import { currentUser } from "../api/auth"

const ProtectRouteUser = ({element}) => {
  const [ok,setOk]= useState(false)
  const user = usefoodDelivery((state)=> state.user)
  const token = usefoodDelivery((state)=> state.token)

  useEffect(()=>{
    if(user && token){
      currentUser(token)
      .then((res)=> setOk(true))
      .catch((error)=> setOk(false))
    }
  },[])

  return ok ? element : <LoadingToRedirect/>
  
}
export default ProtectRouteUser