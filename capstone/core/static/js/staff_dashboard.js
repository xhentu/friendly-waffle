// importing profile module
import {
    profile
} from "./modules/profile.js";

// importing academic year modules
import {
    getAcademicYears,
    editAcademicYear,
    deleteAcademicYear,
    createAcademicYear,
} from "./modules/staff_academic.js";

// importing classes modules
import {
    viewClasses,
    createClasses,
    editClass,
    deleteClass,
    getGrades,
    editGrade,
    deleteGrade,
    createGrades,
    getSubjects,
    createSubject,
    fetchClassesForGradeAndYear,
    editSubject,
    deleteSubject,
} from "./modules/staff_classes.js";

// importing user modules
import {
    viewUsers,
    editUser,
    submitEditUser,
    deleteUser,
    createUserForm,
    toggleRoleFields,
    submitUserForm,
    listAllStudents,
    enrollStudentPage,
    fetchAcademicYears,
    fetchGrades,
    fetchClasses,
    submitEnrollment,
    editEnrollment,
    listAllParentStudentRelationships,
    addParentRelationship,
    submitAddRelationship,
    editParentRelationship,
    submitEditRelationship,
    deleteParentRelationship,
    listAllTeachers,
    assignTeacherForm,
    fetchTeachers,
    fetchGradesForAcademicYear,
    fetchClassesAndSubjects,
    submitTeacherAssignment,
    deleteTeacherAssignment,
    manageFees,
    createSchoolFeesForm,
    createClassFees,
    createGradeFees,
    createBatchFeesForm,
    createStudentFee,
    createStudentFeeForm,
    submitSchoolFees,
    toggleBatchScope,
    submitBatchFees,
    fetchAvailableStudents,
    submitStudentFee,
} from "./modules/staff_users.js";

// importing notification modules
import {
    fetchNotifications,
    createNotificationForm,
    toggleScopeFields,
    fetchRecipientsForScope,
    // createNotification,
    // editNotification,
    // submitEditNotification,
    deleteNotification,
} from "./modules/staff_notifications.js";

document.addEventListener('DOMContentLoaded', () => {
    // Add any initialization logic here, if needed

});
// funny fucking reloadDashboard 
function reloadDashboard() {
    const main = document.getElementById('main');
    main.innerHTML = 'this is main';
}
// Helper function to get CSRF token
function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue || "";
}

// declaring global modules
// profile modules
window.profile = profile;

// academic modules
window.getAcademicYears = getAcademicYears;
window.editAcademicYear = editAcademicYear;
window.deleteAcademicYear = deleteAcademicYear;
window.createAcademicYear = createAcademicYear;

// classes modules
window.viewClasses = viewClasses;
window.createClasses = createClasses;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.getGrades = getGrades;
window.editGrade = editGrade;
window.deleteGrade = deleteGrade;
window.createGrades = createGrades;
window.getSubjects = getSubjects;
window.createSubject = createSubject;
window.fetchClassesForGradeAndYear = fetchClassesForGradeAndYear;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;

// user modules
window.viewUsers = viewUsers;
window.editUser = editUser;
window.submitEditUser = submitEditUser;
window.deleteUser = deleteUser;
window.createUserForm = createUserForm;
window.toggleRoleFields = toggleRoleFields
window.submitUserForm = submitUserForm;
window.listAllStudents = listAllStudents;
window.enrollStudentPage = enrollStudentPage;
window.fetchAcademicYears = fetchAcademicYears
window.fetchGrades = fetchGrades;
window.fetchClasses = fetchClasses;
window.submitEnrollment = submitEnrollment;
window.editEnrollment = editEnrollment;
window.listAllParentStudentRelationships = listAllParentStudentRelationships;
window.addParentRelationship = addParentRelationship;
window.submitAddRelationship = submitAddRelationship;
window.editParentRelationship = editParentRelationship;
window.submitEditRelationship = submitEditRelationship;
window.deleteParentRelationship = deleteParentRelationship;
window.listAllTeachers = listAllTeachers;
window.assignTeacherForm = assignTeacherForm;
window.fetchTeachers = fetchTeachers;
window.fetchGradesForAcademicYear = fetchGradesForAcademicYear;
window.fetchClassesAndSubjects = fetchClassesAndSubjects;
window.submitTeacherAssignment = submitTeacherAssignment;
window.deleteTeacherAssignment = deleteTeacherAssignment;
window.manageFees = manageFees;
window.createSchoolFeesForm = createSchoolFeesForm;
window.createClassFees = createClassFees;
window.createGradeFees = createGradeFees;
window.createBatchFeesForm = createBatchFeesForm;
window.createStudentFee = createStudentFee;
window.createStudentFeeForm = createStudentFeeForm;
window.submitSchoolFees = submitSchoolFees;
window.toggleBatchScope = toggleBatchScope;
window.submitBatchFees = submitBatchFees;
window.submitBatchFees = submitBatchFees;
window.fetchAvailableStudents = fetchAvailableStudents;
window.submitStudentFee = submitStudentFee;

// notification modules
window.fetchNotifications = fetchNotifications;
window.createNotificationForm = createNotificationForm;
window.toggleScopeFields = toggleScopeFields;
window.fetchRecipientsForScope = fetchRecipientsForScope;
// window.createNotification = createNotification;
// window.editNotification = editNotification;
// window.submitEditNotification = submitEditNotification;
window.deleteNotification = deleteNotification;