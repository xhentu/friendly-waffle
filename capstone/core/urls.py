from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView

urlpatterns = [
    # Home and Authentication
    path('', views.home, name='home'),
    path('sign-in/', views.sign_in, name='sign-in'), # done
    path('log-out/', LogoutView.as_view(next_page='sign-in'), name='log-out'),
    path('profile', views.profile, name='profile'), 

    # Student Dashboard
    path('student-dashboard', views.student_dashboard, name='student-dashboard'),

    # Staff Dashboard
    path('staff-dashboard/', views.staff_dashboard, name='staff-dashboard'), 
    path('getAcademicYears/', views.getAcademicYears, name='getAcademicYears'),
    path('academic-years/add/', views.create_academic_year, name='create-academic-year'),
    path('academic-years/<int:id>/', views.academic_year_detail, name='academic_year_detail'),

    path('view-classes/', views.get_classes_view, name='view-classes'),
    path('get-active-options/', views.get_active_options, name='get-active-options'),
    path('create-class/', views.create_class, name='create-class'),
    path('update-class/<int:id>/', views.update_class, name='editClass'),
    path('get-class-details/<int:id>/', views.get_class_details, name='get-class-details'),
    path('delete-class/<int:id>/', views.delete_class, name="deleteClass"),

    path('get-grades/', views.get_grades, name="get-grades"),
    path('create-grade/', views.create_grade, name="create-grade"),
    path('edit-grade/<int:id>/', views.edit_grade, name="edit-grade"),
    path('delete-grade/<int:id>/', views.delete_grade, name="delete-grade"),

    path('get-subjects-forStaff/', views.get_subjects_for_staff, name="get-Subjects-forStaff"),
    path('create-subject/', views.create_subject, name='create-subject'),
    path('get-active-subject-options/', views.get_active_subject_options, name='get-active-subject-options'),
    path("get-classes-for-grade-and-year/", views.get_classes_for_grade_and_year, name="get_classes_for_grade_and_year"),
    path("create-subject/", views.create_subject, name="create_subject"),
    path('get-subject/<int:subject_id>/', views.get_subject_details, name='get-subject'),
    path('edit-subject/<int:subject_id>/', views.edit_subject, name='edit-subject'),
    path('delete-subject/<int:subject_id>/', views.delete_subject, name='delete-subject'),
    # Users
    path("get-users/", views.get_users, name="get-users"),
    path("get-user-details/<int:user_id>/", views.get_user_details, name="get-user-details"),
    path("edit-user/<int:user_id>/", views.edit_user, name="edit-user"),
    path("delete-user/<int:user_id>/", views.delete_user, name="delete-user"),
    path("user-profile/<int:user_id>/", views.user_profile, name="user_profile"),
    path("create-user/", views.create_user, name="create_user"),
    path("fetch-grades/", views.fetch_grades, name="fetch-grades"),
    path("fetch-students-grouped-by-grade/", views.fetch_students_grouped_by_grade, name="fetch-students-grouped-by-grade"),
    # enroll students
    path("fetch-all-students/", views.fetch_all_students, name="fetch-all-students"),
    path("fetch-academic-years/", views.fetch_academic_years, name="fetch-academic-years"),
    path("fetch-grades/", views.fetch_grades, name="fetch-grades"),
    path("fetch-classes-for-grade/<int:grade_id>/<int:academic_year_id>/", views.fetch_classes_for_grade, name="fetch-classes-for-grade"),
    path("enroll-student/", views.enroll_student, name="enroll-student"),
    path("get-enrollment-details/<int:student_id>/", views.get_enrollment_details, name="get-enrollment-details"),
    path("edit-enrollment/<int:student_id>/", views.edit_enrollment, name="edit-enrollment"),
    path("delete-enrollment/<int:student_id>/", views.delete_enrollment, name="delete-enrollment"),
    # parent-student relationships
    path("fetch-parent-student-relationships/", views.fetch_all_parent_student_relationships, name="fetch-parent-student-relationships"),
    path("delete-parent-student-relationship/<int:parent_id>/<int:student_id>/", views.delete_parent_student_relationship, name="delete-parent-student-relationship"),
    path("get-parent-relationship/<int:parent_id>/", views.get_parent_relationship, name="get-parent-relationship"),
    path("edit-parent-relationship/<int:parent_id>/", views.edit_parent_relationship, name="edit-parent-relationship"),
    path("add-parent-relationship/<int:parent_id>/", views.add_parent_relationship, name="add-parent-relationship"),
    # assign teachers
    path("fetch-teacher-overview/", views.fetch_teacher_overview, name="fetch-teacher-overview"),
    path("fetch-teachers/", views.fetch_teachers, name="fetch-teachers"),
    path("fetch-teacher-assignments/", views.fetch_teacher_assignments, name="fetch-teacher-assignments"),
    path("fetch-academic-years/", views.fetch_academic_years, name="fetch-academic-years"),
    path("fetch-grades-teacherAssignment/<int:academic_year_id>/", views.fetch_grades_teacherAssignment, name="fetch-grades-teacherAssignment"),
    path("fetch-classes-and-subjects/<int:academic_year_id>/<int:grade_id>/", views.fetch_classes_and_subjects, name="fetch-classes-and-subjects"),
    path("assign-teacher/", views.assign_teacher, name="assign-teacher"),
    path("delete-teacher-assignment/<int:assignment_id>/", views.delete_teacher_assignment, name="delete-teacher-assignment"),

    path("create-class-fees/", views.create_class_fees, name="create-class-fees"),
    path("create-grade-fees/", views.create_grade_fees, name="create-grade-fees"),
    path("create-student-fee/", views.create_student_fee, name="create-student-fee"),
    path("create-school-fees/", views.create_school_fees, name="create-school-fees"),
    path("fetch-classes/", views.fetch_classes, name="fetch-classes"),
    path("fetch-available-students/", views.fetch_available_students, name="fetch-available-students"),
    # notification case
    path("fetch-notifications/", views.fetch_notifications, name="fetch_notifications"),
    path("fetch-notification-scopes/", views.fetch_notification_scopes, name="fetch_notification_scopes"),
    path("fetch-notification-recipients/", views.fetch_notification_recipients, name="fetch_notification_recipients"),
    path("fetch-notification-recipients/<str:scope>/", views.fetch_notification_recipients, name="fetch_notification_recipients_with_scope"),
    path("create-notification/", views.create_notification, name="create_notification"),

    # teacher dashboard
    path('teacher-dashboard/', views.teacher_dashboard, name='teacher-dashboard'),
    # teacher schedules
    path('get-teacher-schedule/', views.get_teacher_schedule, name='get-teacher-schedule'),
    path('get-assigned-classes/', views.get_assigned_classes, name='get-assigned-classes'),
    path('get-class-schedule/<int:class_id>/', views.get_class_schedule, name = 'get-class-schedule'),
    path('create-schedule/', views.create_schedule, name='create-schedule'),
    path('get-schedule-details/<int:schedule_id>/', views.get_schedule_details, name='get-schedule-details'),
    path('edit-schedule/<int:schedule_id>/', views.edit_schedule, name='edit-schedule'),
    path('get-subjects/', views.get_subjects, name = "get-subjects"),
    path('delete-schedule/<int:schedule_id>/', views.delete_schedule, name='delete-schedule'),

    # teacher attendance for classes cases
    path("get-student-roster/<int:class_id>/", views.fetch_students_by_class, name="get-student-roster"),
    path("get-class-attendance-details/<int:class_id>/", views.get_class_attendance_details, name = "get-class-attendance-details"),
    path("mark-attendance/", views.mark_attendance, name = "mark-attendance"),
    path("get-attendance-history/", views.get_attendance_history, name="get-attendance-history"),
    path("get-attendance-history/", views.get_attendance_history, name="get-attendance-history"),
    path("get-attendance-details/<int:attendance_id>/", views.get_attendance_details, name="get-attendance-details"),

    # teacher exam cases
    path("create-exam/", views.create_exam, name="create-exam"),
    path("get-academic-years/", views.get_academic_years, name="get-academic-years"),
    path("get-classes/", views.get_classes, name="get-classes"),
    path("get-exam-filters/", views.get_exam_filters, name="get-exam-filters"),
    path("search-exams/", views.search_exams, name="search-exams"),
    path("get-exam-students/<int:exam_id>/", views.get_exam_students, name="get-exam-students"),
    path("update-exam-grades/", views.update_exam_grades, name="update-exam-grades"),
    path("get-exam-grades/<int:exam_id>/", views.get_exam_grades, name="get-exam-grades"),

]