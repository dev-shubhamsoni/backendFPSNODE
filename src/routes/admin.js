const route = require('express').Router()
const { adminLogin, adminRolesList, addSubAdmins, addPermission, allPermissions } = require('../controllers/admin/authentication')
const { addInstituteType, instituteTypeList, addBoardLevel,addBoardLeveltest , updateBoardLevelupdate,deleteBoardLeveltest} = require('../controllers/admin/instituteType')
const { planType, usersType, createNormalPlan, planList } = require('../controllers/admin/subscriptionPlans')
const { addState, stateList, addCity, cityList, stateCities } = require('../controllers/common')
const { callLogDashboard, callUserList, usersCallList, downloadCallLogCSV } = require('../controllers/users/callLogs')
const { createBlogPost ,getAllBlogs,updateBlogPost} = require('../controllers/admin/blog')
const { addCategory,getCategories,updateCategory ,getSubCategories} = require('../controllers/admin/Category')

route.post("/authentication",adminLogin)
.post('/state',addState)
.get('/state',stateList)
.get("/state/:id",stateCities)

.post("/city",addCity)
.get("/city",cityList)

.post("/institute-type",addInstituteType)
.get("/institute-type",instituteTypeList)
.post("/job/add-board-level",addBoardLevel)




//anujapi 
.post("/job/add-board-leveltest",addBoardLeveltest)
.patch("/job/add-board-level_update",updateBoardLevelupdate)
.delete("/job/deleteBoardLeveltest",deleteBoardLeveltest)


.get("/getCategories",getCategories)
.post("/addCategory",addCategory)
.put("/updateCategory/:id",updateCategory)



.get("/getSubCategories",getSubCategories)
.post("/addCategory",addCategory)
.put("/updateCategory/:id",updateCategory)


.post("/createBlogPost",createBlogPost)
.get("/blogList",getAllBlogs)
 .put("/updateBlogPost/:blogid",updateBlogPost)

//------------------------------------


.get("/sub-admin/roles",adminRolesList)
.post("/sub-admin",addSubAdmins)

.post("/permission",addPermission)
.get("/permission",allPermissions)

.get("/subscription-plan/plans-type",planType)
.get("/subscription-plan/users-type",usersType)
.post("/subscription-plan/add-normal",createNormalPlan)
.get("/subscription-plan/list",planList)


.get("/call-log/dashboard",callLogDashboard)
.get("/call-log/users",callUserList)
.get("/call-log/users/:u_id",usersCallList)
.get("/call-log/download-csv",downloadCallLogCSV)

module.exports = route