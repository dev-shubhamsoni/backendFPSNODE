const { instituteTypeList } = require('../controllers/admin/instituteType')
const { signInWithEmailAndPwd, profile, uploadProfileImage, updateProfile, updatePassword, registrationSendOTP, salesEnquiries, 
    registrationVerifyOTP, mobileLoginSendOTP, mobileLoginVerifyOTP, forgotPasswordWithMail, forgotPassword, 
    sendResetEJSPage, sendSuccessPassword, sendOTPForResetPassword, verifyOTPForResetPassword, emailVerificationSend, verifyEmail, 
    mobileSendOTP,
    mobileVerifyOTP,
    emailVerificationSendOtp, otherDetails,
    generateUserId} = require('../controllers/institutations/authentication')
const { dashbaord ,insgetCategories,getSubCategories, getAQuote, bankList, getAllSubCategories, employeeNotificationList, deActiveEmployeeNotification} = require('../controllers/institutations/dashboard')
const { workPlaceType, jobTypes, qualification, selectionProcess, questionsType, experinceLevel, createJob, 
    addScreenQuestion, jobList, jobDetails, applicationDetail, jobsHistory, processApplication, 
    salaryType, updateScreeningQuestion, boardLevel, updateJob, 
    appliedCandidateList,
    appliedCandidateProfile,
    updateCandidateStatus,
    createSheduledInteview,
    addToFavouriteJob,
    addEmployerBenefits,
    salaryList,
    currentOrganizationList,
    interviewStepList,
    lanuageList,
    getSheduledInteviewList,
    faculityProfileView,
    deleteScreenQuestion,
    screenQuestion,
    suggestedProfileList} = require('../controllers/institutations/jobs')
const { letterTemplateAdd, letterTemplateEdit, letterTemplateGet, letterTemplateStatusUpdate, letterTemplateGetById, letterAdd, letterEdit, letterGet, letterGetById, letterStatusUpdate, letterSendMail } = require('../controllers/institutations/letter')
const { plansList, validatePayment, createOrder, createPhonePeOrder, phonePeTransactionDetail, validateBankPayment } = require('../controllers/institutations/subscription')
const { stateList, stateCities, cityAutoComplete, salaryBreakdownType, benefitsList, brandLevel, faqListEmployer } = require('../controllers/common')
const { viewResume, suggestedProfileRequest, employerSalaryBreakdownSet, employerSalaryBreakdownGet } = require('../controllers/users/authetication')
const { instituteMiddleware, checkPlansLimit } = require('../middlewares/instituteMiddleware')
const {uploadImage} = require('../utils/fileUploader')
const { InstituteLOGO } = require('../utils/filesPath')
const { sendNotification } = require('../utils/firebaseHandler')
const { generateJobsId } = require('../controllers/users/jobs')

const route = require('express').Router()

route.post('/authentication/registration-send-otp',registrationSendOTP)
.post('/sales-enquiries',salesEnquiries)
.post('/authentication/registration-verify-otp',registrationVerifyOTP)
.post('/authentication/mobile-send-otp',mobileSendOTP)
.post('/authentication/mobile-verify-otp',mobileVerifyOTP)
.post('/authentication/forgot-password',forgotPasswordWithMail)
.get("/authentication/reset-password/:token",sendResetEJSPage)
.get("/authentication/success-password",sendSuccessPassword)
.post("/authentication/reset-password",forgotPassword)
.post("/authentication/forgot-password/otp-mobile",sendOTPForResetPassword)
.post("/authentication/forgot-password/veriy-otp-mobile",verifyOTPForResetPassword)
.post("/authentication/email-verification-send",emailVerificationSend)
.get("/authentication/verify-email/:token",verifyEmail)

.get("/institute-type",instituteTypeList)
.get("/state",stateList)
.get("/cities/:id",stateCities)
.post("/login/mobile-send-otp",mobileLoginSendOTP)
.post("/login/mobile-verify-otp",mobileLoginVerifyOTP)
.post("/login/signInwithEmail",signInWithEmailAndPwd)
.post('/email-send-otp',instituteMiddleware(),emailVerificationSendOtp)
.get("/profile",instituteMiddleware(),profile)
.post("/profile/upload-image",uploadImage(InstituteLOGO).single('profile_image'),instituteMiddleware(),uploadProfileImage)
.patch("/profile/update",instituteMiddleware(),updateProfile)
.patch("/profile/update-password",instituteMiddleware(),updatePassword)
.post("/profile/other-details",instituteMiddleware(),otherDetails)

.get("/dashboard",instituteMiddleware(),dashbaord)
.get("/getCategories",insgetCategories)
.get("/getSubCategories",getSubCategories)
.get("/getAllSubCategories",getAllSubCategories)

.get("/job/work-place",instituteMiddleware(),workPlaceType)
.get("/job/job-type",instituteMiddleware(),jobTypes)

.get("/job/qualification",instituteMiddleware(),qualification)

.get("/job/selection-process",instituteMiddleware(),selectionProcess)
.get("/job/salary-type",instituteMiddleware(),salaryType)
.get("/job/question-type",instituteMiddleware(),questionsType)
.get("/job/experience-level",instituteMiddleware(),experinceLevel)
.get("/job/board-level",instituteMiddleware(),boardLevel)
.post("/job/post",instituteMiddleware(),checkPlansLimit(),createJob)


.get("/job/:jobID/screen-question",instituteMiddleware(),screenQuestion)


.post("/job/add-screen-question",instituteMiddleware(),addScreenQuestion)
.delete("/job/delete-screen-question/:ques_id",instituteMiddleware(),deleteScreenQuestion)
.patch("/job/update-screen-question/:ques_id",instituteMiddleware(),updateScreeningQuestion)
.get('/job/jobs',instituteMiddleware(),jobList)
.patch("/job/jobs/:jobId",instituteMiddleware(),updateJob)
.get("/job/jobs/:jobId",jobDetails)
.get("/job/jobs/resume/:rs_id",instituteMiddleware(),viewResume)
.get("/job/jobs/:job_id/:apl_id",instituteMiddleware(),applicationDetail)
.get("/job/job-history",instituteMiddleware(),jobsHistory)
.patch("/job/process-application/:apl_id",instituteMiddleware(),processApplication)
.post("/job/add-favourite",instituteMiddleware(),addToFavouriteJob)
.post("/add-employer-benefits",addEmployerBenefits)
/**
 * applied Details
 */
.get("/job/:jobId/applied-candidate-list",instituteMiddleware(),appliedCandidateList)
.get("/job/applied-canditate-profile/:applyId",instituteMiddleware(),appliedCandidateProfile)
.patch("/job/applied-job-status",instituteMiddleware(),updateCandidateStatus)
.post("/job/sheduled-interview",instituteMiddleware(),createSheduledInteview)
.get("/job/:jobId/current-organization-list",instituteMiddleware(),currentOrganizationList)
.get("/job/sheduled-interview-list",instituteMiddleware(),getSheduledInteviewList)
.post("/suggested-profile/list",instituteMiddleware(),suggestedProfileList)
/**
 * Plans Details
 */

.get("/subscription-plan/list",instituteMiddleware(),plansList)
.post("/subscription-plan/order",instituteMiddleware(),createOrder)
.post("/subscription-plan/order/validate",instituteMiddleware(),validatePayment)
.post("/subscription-plan/order/bank-validate",instituteMiddleware(),validateBankPayment)

.post("/subscription-plan/phone-pe/order",createPhonePeOrder)
.post("/subscription-plan/phone-pe/transaction/:txtId",phonePeTransactionDetail)
.post("/notification",sendNotification)

.post("/get-a-quote",getAQuote)
.get("/bank/list",instituteMiddleware(), bankList)

.get("/salary",salaryList)
.get("/all-city",cityAutoComplete)
.get("/interview-steps/:CID",interviewStepList)
.get("/language-list",lanuageList)
.get("/new-applied-list",instituteMiddleware(), employeeNotificationList)
.delete("/notification-delete/:NID", instituteMiddleware(), deActiveEmployeeNotification)
.post("/faculity-profile-view", faculityProfileView)

/* letter and template */
.post("/letter-template", instituteMiddleware(), letterTemplateAdd)
.put("/letter-template/:templateID", instituteMiddleware(), letterTemplateEdit)
.get("/letter-template", instituteMiddleware(), letterTemplateGet)
.get("/letter-template/:templateID", instituteMiddleware(), letterTemplateGetById)
.patch("/letter-template/:templateID/:status", instituteMiddleware(), letterTemplateStatusUpdate)

.post("/letter", instituteMiddleware(), letterAdd)
.put("/letter/:letterID", instituteMiddleware(), letterEdit)
.get("/letter", instituteMiddleware(), letterGet)
.get("/letter/:letterID", instituteMiddleware(), letterGetById)
.patch("/letter/:letterID/:status", instituteMiddleware(), letterStatusUpdate)
.post("/letter/sendmail", instituteMiddleware(), letterSendMail)


.post("/suggested_profile_request", instituteMiddleware(), suggestedProfileRequest)
.get("/salary_breakdown_type",  salaryBreakdownType)
.post("/employer_salary_breakdown_store",  employerSalaryBreakdownSet)
.get("/employer_salary_breakdown_get",  employerSalaryBreakdownGet)
.get("/benefits-list",  benefitsList)
.get("/brand-level",  brandLevel)
.get("/faq-list",faqListEmployer)
.get("/generateJobsId", generateJobsId)
module.exports = route


// const { instituteTypeList } = require('../controllers/admin/instituteType')
// const { signInWithEmailAndPwd, profile, uploadProfileImage, updateProfile, updatePassword, registrationSendOTP, 
//     registrationVerifyOTP, mobileLoginSendOTP, mobileLoginVerifyOTP, forgotPasswordWithMail, forgotPassword, 
//     sendResetEJSPage, sendSuccessPassword, sendOTPForResetPassword, verifyOTPForResetPassword } = require('../controllers/institutations/authentication')
// const { dashbaord } = require('../controllers/institutations/dashboard')
// const { workPlaceType, jobTypes, selectionProcess, questionsType, experinceLevel, createJob, 
//     addScreenQuestion, jobList, jobDetails, applicationDetail, jobsHistory, processApplication, 
//     salaryType, updateScreeningQuestion, boardLevel, updateJob } = require('../controllers/institutations/jobs')
// const { plansList, validatePayment, createOrder, createPhonePeOrder, phonePeTransactionDetail } = require('../controllers/institutations/subscription')
// const { stateList, stateCities } = require('../controllers/state')
// const { viewResume } = require('../controllers/users/authetication')
// const { instituteMiddleware, checkPlansLimit } = require('../middlewares/instituteMiddleware')
// const {uploadImage} = require('../utils/fileUploader')
// const { InstituteLOGO } = require('../utils/filesPath')
// const { sendNotification } = require('../utils/firebaseHandler')

// const route = require('express').Router()

// route.post('/authentication/registration-send-otp',registrationSendOTP)
// .post('/authentication/registration-verify-otp',registrationVerifyOTP)
// .post('/authentication/forgot-password',forgotPasswordWithMail)
// .get("/authentication/reset-password/:token",sendResetEJSPage)
// .get("/authentication/success-password",sendSuccessPassword)
// .post("/authentication/reset-password",forgotPassword)
// .post("/authentication/forgot-password/otp-mobile",sendOTPForResetPassword)
// .post("/authentication/forgot-password/veriy-otp-mobile",verifyOTPForResetPassword)

// .get("/institute-type",instituteTypeList)
// .get("/state",stateList)
// .get("/cities/:id",stateCities)
// .post("/login/mobile-send-otp",mobileLoginSendOTP)
// .post("/login/mobile-verify-otp",mobileLoginVerifyOTP)
// .post("/login/signInwithEmail",signInWithEmailAndPwd)
// .get("/profile",instituteMiddleware(),profile)
// .post("/profile/upload-image",uploadImage(InstituteLOGO).single('profile_image'),instituteMiddleware(),uploadProfileImage)
// .patch("/profile/update",instituteMiddleware(),updateProfile)
// .patch("/profile/update-password",instituteMiddleware(),updatePassword)

// .get("/dashboard",instituteMiddleware(),dashbaord)

// .get("/job/work-place",instituteMiddleware(),workPlaceType)
// .get("/job/job-type",instituteMiddleware(),jobTypes)
// .get("/job/selection-process",instituteMiddleware(),selectionProcess)
// .get("/job/salary-type",instituteMiddleware(),salaryType)
// .get("/job/question-type",instituteMiddleware(),questionsType)
// .get("/job/experience-level",instituteMiddleware(),experinceLevel)
// .get("/job/board-level",instituteMiddleware(),boardLevel)
// .post("/job/post",instituteMiddleware(),checkPlansLimit(),createJob)
// .post("/job/add-screen-question",instituteMiddleware(),addScreenQuestion)
// .delete("/job/delete-screen-question",instituteMiddleware(),addScreenQuestion)
// .patch("/job/update-screen-question/:ques_id",instituteMiddleware(),updateScreeningQuestion)
// .get('/job/jobs',instituteMiddleware(),jobList)
// .patch("/job/jobs/:jobId",instituteMiddleware(),updateJob)
// .get("/job/jobs/:jobId",instituteMiddleware(),jobDetails)
// .get("/job/jobs/resume/:rs_id",instituteMiddleware(),viewResume)
// .get("/job/jobs/:job_id/:apl_id",instituteMiddleware(),applicationDetail)
// .get("/job/job-history",instituteMiddleware(),jobsHistory)
// .patch("/job/process-application/:apl_id",instituteMiddleware(),processApplication)

// /**
//  * Plans Details
//  */

// .get("/subscription-plan/list",instituteMiddleware(),plansList)
// .post("/subscription-plan/order",instituteMiddleware(),createOrder)
// .post("/subscription-plan/order/validate",instituteMiddleware(),validatePayment)

// .post("/subscription-plan/phone-pe/order",createPhonePeOrder)
// .post("/subscription-plan/phone-pe/transaction/:txtId",phonePeTransactionDetail)
// .post("/notification",sendNotification)


// module.exports = route