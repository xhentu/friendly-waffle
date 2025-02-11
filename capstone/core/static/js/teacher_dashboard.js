// importing profile module
import {
    profile
} from "./modules/profile.js";

import {
    viewTeacherSchedule,
    listAssignedClasses,
    viewClassTimetable,
    createSchedule,
    editSchedule,
    saveScheduleChanges,
    populateValidSubjects,
    deleteSchedule,
} from "./modules/teacher_schedule.js";

import {
    viewMyClassesForAttendance,
    markAttendance,
    viewStudentRoster,
    markClassAttendance,
    viewAttendanceHistory,
    viewAttendanceDetails,
    fetchAttendanceHistory,
} from "./modules/teacher_attendance.js";

import { 
    createExam,
    updateExamGrades,
    loadExamStudents,
    viewExamGrades,
    loadExamGrades,
} from "./modules/teacher_exam.js";
// declaring global modules
// profile modules
window.profile = profile;

// schedule modules
window.viewTeacherSchedule = viewTeacherSchedule;
window.listAssignedClasses = listAssignedClasses;
window.viewClassTimetable = viewClassTimetable;
window.createSchedule = createSchedule;
window.editSchedule = editSchedule;
window.saveScheduleChanges = saveScheduleChanges;
window.populateValidSubjects = populateValidSubjects;
window.deleteSchedule = deleteSchedule;

// attendance modules
window.viewMyClassesForAttendance = viewMyClassesForAttendance;
window.markAttendance = markAttendance;
window.viewStudentRoster = viewStudentRoster;
window.markClassAttendance = markClassAttendance;
window.viewAttendanceHistory = viewAttendanceHistory;
window.viewAttendanceDetails = viewAttendanceDetails;
window.fetchAttendanceHistory = fetchAttendanceHistory;

// exam modules
window.createExam = createExam;
window.updateExamGrades = updateExamGrades;
window.loadExamStudents = loadExamStudents;
window.viewExamGrades = viewExamGrades;
window.loadExamGrades = loadExamGrades;