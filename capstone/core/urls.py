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

    path('get-subjects/', views.get_subjects, name="getSubjects"),
    path('create-subject/', views.create_subject, name='create-subject'),
    path('get-active-subject-options/', views.get_active_subject_options, name='get-active-subject-options'),
    path("get-classes-for-grade-and-year/", views.get_classes_for_grade_and_year, name="get_classes_for_grade_and_year"),
    path("create-subject/", views.create_subject, name="create_subject"),
    path('get-subject/<int:subject_id>/', views.get_subject_details, name='get-subject'),
    path('edit-subject/<int:subject_id>/', views.edit_subject, name='edit-subject'),
    path('delete-subject/<int:subject_id>/', views.delete_subject, name='delete-subject'),
    # Users
    path("get-users/", views.get_users, name="get_users"),
    path("user-profile/<int:user_id>/", views.user_profile, name="user_profile"),
    path("create-user/", views.create_user, name="create_user"),
    path("fetch-grades/", views.fetch_grades, name="fetch-grades"),
    path("fetch-students-grouped-by-grade/", views.fetch_students_grouped_by_grade, name="fetch-students-grouped-by-grade"),
    path("fetch-all-students/", views.fetch_all_students, name="fetch-all-students"),
    path("fetch-academic-years/", views.fetch_academic_years, name="fetch-academic-years"),
    path("fetch-grades/", views.fetch_grades, name="fetch-grades"),
    path("fetch-classes-for-grade/<int:grade_id>/<int:academic_year_id>/", views.fetch_classes_for_grade, name="fetch-classes-for-grade"),
    path("enroll-student/", views.enroll_student, name="enroll-student"),
    path("get-enrollment-details/<int:student_id>/", views.get_enrollment_details, name="get-enrollment-details"),
]