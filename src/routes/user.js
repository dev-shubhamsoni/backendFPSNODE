const route = require('express').Router()
const rateLimit = require('express-rate-limit');


// Define the rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 160, // Limit each IP to 100 requests per windowMs
    message: {
        status: 429,
        error: "Too many requests, please try again later."
    },
    standardHeaders: true, // Send rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
// route.use(limiter);

const {
    stateList,
    stateCities,
    cityList,
    salaryList,
    jobType,
    jobLevel,
    experience,
    resultType,
    categories,
    subCategories,
    careerPreferenceList,
    bannersCatSubCat,
    featuredData,
    CatWithSubCat,
    banners,
    testimonials,
    qualifications,
    bankDetails,
    skillSearch,
    blogList,
    blogsByCategory,
    featuredBlogs,
    blogDetail,
    blogCommentAdd,
    blogAddLike,
    getVersion,
    contactUs,
    contactInfo,
    languageList,  // Added from shubham-backend branch
    keywordSuggestion,  // Added from main branch
    educationType,
    filterCategories,
    filterSubCategories,
    filterCityList, 
    filterStateCities,
    filterStateList,
    appWelcome,
    filterCatFuncationData,
    stateWithCountry,
    relevantJobFeedback,
    appFeedback,
    areaByCity,
    addAreaByCity,
    getBannerType,
    getBaneerByType,
    testNotification,
    cityByKey,
    stateByKey,
    subjectByKey,
    ChatGptKey,
    scheduleNotification,
    birthdayNotification,
    faqListUser,
} = require('../controllers/common');



const { setNewPassword, userProfile,
    signInWithEmailAndPwd, registartionAdditionalInformation, uploadProfileImage, uploadResume, resumeList, viewResume, addEducation, addExperience, registartionOTP, mobileSendOTP, mobileVerifyOTP,
    changePassword, 
    forgetPassword, 
    resetPassword,
    registration,
    emailLogin,
    generateProfileLink,
    getSharedProfile,
    profileUpdate,
    verifyEmailLink,
    verifyEmailLinkApprove,
    authCheck,
    verifyToken,
    faculitySearchSave,
    faculitySearchList, 
} = require('../controllers/users/authetication');
const { registrationCallUsers, callLogLogin, uploadCallLogs, usersCallList, callUserProfile, callChangePassword } = require('../controllers/users/callLogs')
const {
    applyJob,
    searchJob,
    answerSecreenQuestions,
    appliedJobs,
    savedJobs,
    removeSavedJob,
    saveJob,
    filterJobs,
    jobDetail,
    appliedJobsStatus,
    appliedJobDetails,
    jobDetailById,
    allFavourite,
    addFavourite,
    removeFavourite
} = require('../controllers/users/jobs');

const { notificationList, notificationRead, notificationDelete, sendBulkNotification, sendCareerPreferencesNotification, sendFaculityCertificateNotification, sendFaculityCityPreferencesNotification, sendFaculityExperienceNotification, sendFaculityLanguageNotification, sendFaculityEducationNotification, sendFaculitySkillNotification, sendPackSubscriptionNotification, faculitySearchNotification } = require('../controllers/users/notifications');
const { packagesList, generateOrderId, packUpdate } = require('../controllers/users/packages');
const { facultyLanguage, facultyEducation, facultyCareerPreference, facultyCertificate, facultyCityPreference, facultyExperience, facultySkill, facultyAllData, facultySocialLink, saveFaculityExperience, updateFaculityExperience, deleteFaculityExperience, saveFaculityLangauge, updateFaculityLanguage, UpdatefacultyVideoLink, deleteFaculityLanguage, uploadProfileImageUser, saveFaculityEducation, updateFaculityEducation, deleteFaculityEducation, facultySkillSave, facultyCareerPreferenceSave, facultyCertificateSave, deleteFaculityCertificate, updateFaculityCertificate, facultySocialLinkSave, faculityWorkStatus, updateOtherDetails, profilePercentage, otherDetails } = require('../controllers/users/profile');
const { resumeTemplateList, useTemplate, purchaseResume, purchasedResumeList, purchasedResumeDetails } = require('../controllers/users/resume');

const { callMiddleware } = require('../middlewares/callMiddleware')
const { userMiddleware } = require('../middlewares/userMiddleware')
const { UserProfile, UserResume, UserLOGO } = require('../utils/filesPath')
const { uploadImage, uploadDocument } = require('../utils/fileUploader')

// Common Api's
route.get("/state", stateList)
    .get("/stateCities/:id", stateCities)
    .get("/allCities", cityList)
    .get("/allSalary", salaryList)
    .get("/jobType", jobType)
    .get("/languageList", languageList)
    .get("/jobLevel", jobLevel)
    .get("/jobExperience", experience)
    .get("/jobResultType", resultType)
    .get("/categories", categories)
    .get("/subCategories", subCategories)
    .get("/careerPreferenceList", careerPreferenceList)
    .get("/testimonials", testimonials)
    .get("/qualifications", qualifications)
    .get("/bankDetails", bankDetails)
    .get("/CatWithSubCat", CatWithSubCat)
    .get("/banners", banners)
    .post("/contact_us", contactUs)
    .get("/contact_info", contactInfo)
    .get("/keywordSuggestion", keywordSuggestion)
    .get("/educationType", educationType)
    .get("/cityByKey", cityByKey)
    .get("/stateByKey", stateByKey)
    .get("/subjectByKey", subjectByKey)
    // Profile Get Api's 
    .get("/facultyLanguage", userMiddleware(), facultyLanguage)
    .get("/facultyEducation", userMiddleware(), facultyEducation)
    .get("/facultyCareerPreference", userMiddleware(), facultyCareerPreference)
    .get("/facultyCertificate", userMiddleware(), facultyCertificate)
    .get("/facultyCityPreference", userMiddleware(), facultyCityPreference)
    .get("/facultyExperienceAllData", userMiddleware(), facultyExperience)
    .get("/facultySkill", userMiddleware(), facultySkill)
    .get("/facultySocialLink", userMiddleware(), facultySocialLink)
    .get("/facultyProfileAllData", userMiddleware(), facultyAllData)
    .get("/facultyProfilePercentage", userMiddleware(), profilePercentage)
    .get("/otherDetails", userMiddleware(), otherDetails)
    // Profile Post Api's
    .post("/skillSearch", skillSearch)
    .post("/facultyExperienceSave", userMiddleware(), saveFaculityExperience)
    .post("/facultyLanguageSave", userMiddleware(), saveFaculityLangauge)
    .post("/facultyEducationSave", userMiddleware(), saveFaculityEducation)
    .post("/facultySkillSave", userMiddleware(), facultySkillSave)
    .post("/facultyCareerPreferenceSave", userMiddleware(), facultyCareerPreferenceSave)
    .post("/facultySocialLinkSave", userMiddleware(), facultySocialLinkSave)
    .post("/facultyWorkStatus", userMiddleware(), faculityWorkStatus)
    .post("/facultyOtherDetails", userMiddleware(), uploadImage(UserLOGO).single('banner'), updateOtherDetails)   
    .post("/facultyCertificateSave", userMiddleware(), uploadDocument(UserResume).single("certificate_file"), facultyCertificateSave) 
    // Profile Patch Api's
    .patch("/facultyExperienceUpdate", userMiddleware(), updateFaculityExperience)
    .patch("/facultyEducationUpdate", userMiddleware(), updateFaculityEducation)
    .patch("/facultyLanguageUpdate", userMiddleware(), updateFaculityLanguage)
    .patch("/facultyCertificateUpdate", userMiddleware(), uploadDocument(UserResume).single("certificate_file"), updateFaculityCertificate) 
    .patch("/changepassword", changePassword)
    .patch("/facultyVideoLink", UpdatefacultyVideoLink)
    // Profile Delete Api's
    .delete("/facultyExperienceDelete", userMiddleware(), deleteFaculityExperience)
    .delete("/facultyLanguageDelete", userMiddleware(), deleteFaculityLanguage)
    .delete("/facultyEducationDelete", userMiddleware(), deleteFaculityEducation)
    .delete("/facultyCertificateDelete", userMiddleware(), deleteFaculityCertificate)
    // Jobs
    .get("/filterJobs", filterJobs)
    .get("/appliedJobs", appliedJobs)
    .get("/appliedJobsStatus", appliedJobsStatus)
    .get("/allFavourite", allFavourite)
    .post("/addFavourite", addFavourite)
    .post("/removeFavourite", removeFavourite)
    .post("/applyJob", applyJob)
    // Authentication
    .post("/authentication/registration", uploadDocument(UserResume).single("resume"), registration) 
    .post("/authentication/mobileSendOTP", mobileSendOTP)
    .post("/authentication/mobileVerifyOTP", mobileVerifyOTP)
    .post("/authentication/emailLogin", signInWithEmailAndPwd)
    .post("/authentication/profileUpdate", profileUpdate) 
    // Job Detail
    .get("/jobDetail", jobDetail)
    .get("/jobDetailID", jobDetailById)
    .get("/appliedJobDetails", appliedJobDetails)
    // Notification
    .get("/notification", notificationList)
    .get("/notification_read", notificationRead)
    .get("/notification_delete", notificationDelete)
    .get("/send_bulk_notification", sendBulkNotification)
    .get("/send_career_preferences_notification", sendCareerPreferencesNotification)
    .get("/send_faculity_certificate_notification", sendFaculityCertificateNotification)
    .get("/send_faculity_city_preferences_notification", sendFaculityCityPreferencesNotification)
    .get("/send_faculity_experience_notification", sendFaculityExperienceNotification)
    .get("/send_faculity_language_notification", sendFaculityLanguageNotification)
    .get("/send_faculity_education_notification", sendFaculityEducationNotification)
    .get("/send_faculity_skill_notification", sendFaculitySkillNotification)
    .get("/send_pack_subscription_notification", sendPackSubscriptionNotification)
    // .get("/send_pack_faculity_Search_notification", faculitySearchNotification)
    
    // Packages
    .get("/packages", packagesList)
    .post("/generateOrderId", generateOrderId)
    .post("/packUpdate", packUpdate)
    // featured Data
    .get("/featuredData", featuredData)
    // Upload Files 
    .post("/upload-image", uploadImage(UserLOGO).single('profile_image'), uploadProfileImageUser) 
    .post("/resume-upload", uploadDocument(UserResume).single("resume"), uploadResume) 
    // Blogs
    .get("/blogs", blogList)
    .get("/blogsByCategory", blogsByCategory)
    .get("/featuredBlogs", featuredBlogs)
    .post("/blogDetail", blogDetail)
    .post("/blogCommentAdd", blogCommentAdd)
    .post("/blogAddLike", blogAddLike)
    // Application versions
    .get("/getVersion", getVersion)
    // Forget password
    .post("/authentication/forgetPassword", forgetPassword)
    .post("/authentication/resetPassword", resetPassword)
    // Resume
    .get("/resumeTemplateList", resumeTemplateList)
    .get("/useTemplate", useTemplate)
    .get("/purchasedResumeList", purchasedResumeList)
    .get("/purchasedResumeDetails", purchasedResumeDetails)
    .post("/purchaseResume", purchaseResume)
    // Share profile
    .get("/generateProfileLink", generateProfileLink)
    .get("/getSharedProfile", getSharedProfile)
    .get("/authentication/verifyEmailLink", verifyEmailLink)
    .get("/authentication/verifyEmailLinkApprove", verifyEmailLinkApprove)
    // Filters Data
    .get("/filter_categories", filterCategories)
    .get("/filter_subCategories", filterSubCategories)
    .get("/filter_allCities", filterCityList)
    .get("/filter_stateCities/:id", filterStateCities)
    .get("/filter_stateList", filterStateList)
    .get("/app_welcome", appWelcome)
    .get("/authCheck", authCheck) 
    .post("/verifyToken", verifyToken) 
    .get("/filterCatFuncationData", filterCatFuncationData) 
    .get("/stateWithCountry",stateWithCountry)
    .get("/relevantJobFeedback",relevantJobFeedback)
    .post("/appFeedback",appFeedback)
    .post("/faculitySearchSave", faculitySearchSave) 
    .get("/faculitySearchList", faculitySearchList) 

    .get("/areaByCity",areaByCity)
    .post("/addAreaByCity",addAreaByCity)

    .get("/getBannerType",getBannerType)
    .get("/getBnneerByType",getBaneerByType)

    .get("/testNotification",testNotification)
    .get("/scheduleNotification",scheduleNotification)
    .get("/birthdayNotification",birthdayNotification)
    .get("/ChatGptKey",ChatGptKey)
    .get("/faq-list",faqListUser)
    // test

// .post("/authentication/registration-send-otp", registartionOTP)
// .post("/authentication/registration-verify-otp", registartion)
// .post("/profile/additional-information", userMiddleware(), registartionAdditionalInformation)
// .get("/profile", userMiddleware(), userProfile)
// .patch("/profile/set-password", userMiddleware(), setNewPassword)
// .post("/profile/profile-image", uploadImage(UserProfile).single('profile_image'), userMiddleware(), uploadProfileImage)
// .post("/profile/resume", uploadDocument(UserResume).single("resume"), userMiddleware(), uploadResume)
// .get("/profile/resume", userMiddleware(), resumeList)
// .post("/profile/add-eduction", userMiddleware(), addEducation)
// .post("/profile/add-experience", userMiddleware(), addExperience)
// .get("/profile/resume/:rs_id", userMiddleware(), viewResume)
// .post("/login/mobile-send-otp", mobileSendOTP)
// .post("/login/mobile-verify-otp", mobileVerifyOTP)
// .post("/login/signInWithMail", signInWithEmailAndPwd)
// .get("/job/search-job", userMiddleware(), searchJob)
// .post("/job/apply-job", userMiddleware(), applyJob)
// .post("/job/answer-screening-questions", userMiddleware(), answerSecreenQuestions)
// .get("/job/applied-jobs", userMiddleware(), appliedJobs)
// .post("/job/save-job", userMiddleware(), saveJob)
// .delete("/job/remove-job/:saved_id", userMiddleware(), removeSavedJob)
// .get("/job/saved-jobs", userMiddleware(), savedJobs)

/**
 * 
 * Call logs apis
 */

// .post("/call-log/registration", registrationCallUsers)
// .post("/call-log/login", callLogLogin)
// .post("/call-log/upload", callMiddleware(), uploadCallLogs)
// .get("/call-log/users", callMiddleware(), usersCallList)
// .post("/call-log/change-password", callMiddleware(), callChangePassword)
// .get("/call-log/profile", callMiddleware(), callUserProfile)


module.exports = route