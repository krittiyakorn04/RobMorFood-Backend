# API Endpoints Summary fooddelivery

--Store
## Authentication

| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/store/auth/login`                        | POST   | Login store         | `{ "username,email,social": "Pmkt@gmail.com", "password": "1234" }` |
| `/api/store/auth/register`                     | POST   | Register store      | `{ "storeName": "Test1", "phone":"067xxxxxxx", "Notice":"text", 																					"category":"Test1", "address":"roi-et", "dayOpen":"["MON","TUE","WED"]", 																				"timeOpen":"08:00", "timeClose":"20:00", "promptpayNumber":"067xxxxxxx"}`, 					 															"bankName":"Test1", "bankAccount":"Test1", "bankAccountName":"Test1", "deliveryZones": [{"nameZone":"", "fee": 0 }] }` 												 |                                          
| `/api/store/current-restau`                         | GET   | Get current store  | None                                                                |

##createStore

| Endpoint                            | Method | Description            | Body                        |
|-------------------------------------|--------|------------------------|-----------------------------|
| `/api/store/profile`                              | GET   | Get store             | None                        |
| `/api/store/profile`                              | PUT   | Update stores         | `{ "storeName": "Test1", "phone":"067xxxxxxx", "Notice":"text", 																						"category":"Test1", "address":"roi-et", "dayOpen":"["MON","TUE","WED"]", 																				"timeOpen":"08:00", "timeClose":"20:00", "promptpayNumber":"067xxxxxxx"}`, 																				"bankName":"Test1", "bankAccount":"Test1", "bankAccountName":"Test1" ,  }` 										| 
| `/api/store/delivery-zones/:id`                   | PUT      | `{ "deliveryZones": [{"nameZone":"", "fee": 0 }] }`
DELETE /api/store/delivery-zones/:id
update password
| `/api/store/rainSurchargeActive`                  | PATCH    | `{ "rainSurchargeActive": false , "rainSurcharge":5 }`
| `/api/store/storeStatus`                  	    | PATCH    | `{ "status": CLOSED}`
| `/api/store/orderMode`                            | PATCH    | `{ "orderMode": REALTIME}`
ปุ่มลบร้านแต่จริงๆเก็บไว้แต่เปลี่ยนสถานะ

## MenuCategory

| Endpoint                            | Method | Description            | Body                        |
|-------------------------------------|--------|------------------------|-----------------------------|
| `/api/store/category`                     | GET    | Get categories          | None |
| `/api/store/category`                     | POST   | Create category         | `{ "category": [{ "name": "ของทอด" }, { "name": "เครื่องดื่ม" }]`  |
| `/api/store/category`                     | PUT    | Update                  | `{ "category": [{ "id": 1, "name": "ของทอด" }, { "id": 2, "name": "เครื่องดื่ม" }] }`  |
| `/api/store/category/:id`                 | DELETE | Delete category by ID   | None                        |

## Menu

| Endpoint                            | Method | Description            | Body                        |
|-------------------------------------|--------|------------------------|-----------------------------|
| `/api/store/Menu/:id`                         | GET    | Get Menus (read)          | None                        |
| `/api/store/Menu`                             | POST   | Create Menu         | `{"categoryId": 1, "menuItem ": "ข้าวมันไก่", "description": "เนื้อนุ่ม น้ำจิ้มเข้มข้น", "price": 57, 
				 						    "MenuOption":[{ "label":"ความเผ็ด", "required": true, "maxRequire": 2, "OptionChoice": [{ "name":"เผ็ดมาก", "extraPrice": 5 }] }]  ` |
| `/api/store/Menu/:id`                         | PUT    | update Menu         |  `{"categoryId": 1, "menuItem ": "ข้าวมันไก่", "description": "เนื้อนุ่ม น้ำจิ้มเข้มข้น", "price": 57, "isAvailable": true, 
				 						    "MenuOption":[{ "label":"ความเผ็ด", "required": true, "maxRequire": 2, "OptionChoice": [{ "name":"เผ็ดมาก", "extraPrice": 5 }] }]  `                            |
| `/api/store/Menu/:id`                         | DELETE | Delete Menu by ID   	| None                        |
| `/api/store/Menu/availability/:id`            | PATCH  | availability Menu		| `{ "isAvailable":"true" }`
| `/api/menuby`                      		| GET     | Get menus by filters   | `{ "sort": "price", "order": "asc", "limit": 2 }` or `{ "sort": "quantity", "order": "desc", "limit": 2 }` |
| `/api/search/filters`               		| GET     | Search with filters    | `{ "query": "กระเพรา" }`, `{ "price": [100, 600] }`, or `{ "category": [1, 2] }`        |

## orderRound

| Endpoint                            | Method | Description            | Body                        |
|-------------------------------------|--------|------------------------|-----------------------------|
| `/api/store/OrderRound`             | POST   | Create OrderRound         | `{"OrderRound": [{ "id": "1" , "startTime":"13:00", "endTime":"14:00" }] }`       |

| `/api/store/Order-Round`             | GET    | Get OrderRounds          | None                        |
| `/api/store/Order-Round`             | PUT    | Update                  | None                        |
| `/api/store/Order-Round:id`          | DELETE | Delete OrderRound by ID   | None                        |
| `/api/store/pattern/`		      | PATCH  |    |`{ "patternManual": false } `                       |
| `/api/store/order-round/order-limit | PATCH  |    |`{ "hasOrderLimit": false, "maxOrders": 10  }`                        |
| `/api/store/roundStatust/:id            | PATCH  |    |`{ "status": OPEN }`                        |

## Order

| Endpoint                            | Method | Description            | Body                        |
|-------------------------------------|--------|------------------------|-----------------------------|
| `/api/store/order`                     | GET    | Get           | None                      |
| `/api/store/order/:id`                 | GET    | Get          | None                      |
| `/api/store/orderStatus/:id            | PATCH  |    |`{ "status": "PENDING" }`                        |

## Delivery
| `/api/store/delivery`                | GET    | Get Delivery          | None                      |
| `/api/store/delivery/:id`                | GET    |           | None                      |
| `/api/store/orderStatus/:id            | PATCH  |    |`{ "status": "PENDING" }`                        |


## Payment 
| `/api/store/paymentStatus/:id            | PATCH  |    |`{ "status": "PENDING" }`                        |
| `/api/store/payment/:id                   | POST  |    |`{ "rejectedReason": "xxxx" }`                        |


-- User

## Authentication

| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/user/auth/login`                        | POST   | Login user         | `{ "username,email,social": "Pmkt@gmail.com", "password": "1234" }` |
| `/api/user/auth/register`                     | POST   | Register user      | `{ "username,email,social": "Pmkt@gmail.com", "password": "1234" }, "phone":""}` |                                          
| `/api/store/current-user`                         | GET   | Get current store  | None                                                                |

##Address
| `/api/user/address`                           | POST   | Login address         | `{ "Address":[ {"id" : 1 ,"label": "", "address": "" } }]` |
| `/api/user/address`                           | POST   | updete address         | `{ "Address":[ {"id" : 1 ,"label": "", "address": "" } }]` |
| `/api/user/address/:id`                       |DELETE  | DELETE address         | None |

## profile
| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/user/profile`                                 | PUT   | updete user      | `{ "username": "Pmkt@gmail.com""phone":"" }}` |                                          
                                                              
##cart
/api/user/cart	POST	Add to cart	{ "Cart": [{ "id": 1, "count": 2, "options": [{ "MenuOptionid":5 "optionChoiceId":5  }], "note":""}] }
/api/user/cart	GET	Get cart	None
/api/user/cart	DELETE	Delete cart	None

##Order
| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/user/order`                                 | GET   | get order     | None` 
|  /api/user/order	   			POST	Place an order	None
| `/api/user/order/:id/Status`                      | PATCH   |      | ` { "status":DELIVERY } `
| `/api/user/payment/:id/method`                | PATCH   |    | `{ "PaymentMethod" : }`
| `/api/user/payment/:id`                      | POST   | Upload payment slip     | ` {"slipImageUrl" :""} ``


##Delivery
| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/user/delivery`                                 | GET   | get delivery     | None`
| `/api/user/delivery/:id`                      | GET   | get delivery     | None`
 
##Review
| Endpoint                            | Method | Description        | Body                                                 |
|-------------------------------------|--------|--------------------|------------------------------------------------------|
| `/api/user/review/:id`                                 | GET   | get delivery     | None`
| `/api/user/update/:id`
| `/api/user/review/:id`                      | DELETE   | get delivery     | None`
 

--admin
| Endpoint                            | Method | Description               | Body                              |
|-------------------------------------|--------|---------------------------|-----------------------------------|
| `/api/admin/:id/customerStatus`                   | PATCH    | Update order status        | `{ "customerStatus":  }` |
| `/api/admin//:id/merchantStatus`                 | PATCH    | Get all orders             | `{ "accountStatus":  }`             |






