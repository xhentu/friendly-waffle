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
    # CRUD for Students
    # path('students/', views.student_list, name='student-list'),
    # path('students/<int:pk>/', views.student_detail, name='student-detail'),
    # path('students/create/', views.student_create, name='student-create'),
    # path('students/<int:pk>/edit/', views.student_edit, name='student-edit'),
    # path('students/<int:pk>/delete/', views.student_delete, name='student-delete'),

    # CRUD for Classes
    # path('classes/', views.class_list, name='class-list'),
    # path('classes/<int:pk>/', views.class_detail, name='class-detail'),
    # path('classes/create/', views.class_create, name='class-create'),
    # path('classes/<int:pk>/edit/', views.class_edit, name='class-edit'),
    # path('classes/<int:pk>/delete/', views.class_delete, name='class-delete'),

    # CRUD for Subjects
    # path('subjects/', views.subject_list, name='subject-list'),
    # path('subjects/<int:pk>/', views.subject_detail, name='subject-detail'),
    # path('subjects/create/', views.subject_create, name='subject-create'),
    # path('subjects/<int:pk>/edit/', views.subject_edit, name='subject-edit'),
    # path('subjects/<int:pk>/delete/', views.subject_delete, name='subject-delete'),

    # CRUD for Teachers
    # path('teachers/', views.teacher_list, name='teacher-list'),
    # path('teachers/<int:pk>/', views.teacher_detail, name='teacher-detail'),
    # path('teachers/create/', views.teacher_create, name='teacher-create'),
    # path('teachers/<int:pk>/edit/', views.teacher_edit, name='teacher-edit'),
    # path('teachers/<int:pk>/delete/', views.teacher_delete, name='teacher-delete'),

    # CRUD for Notifications
    # path('notifications/', views.notification_list, name='notification-list'),
    # path('notifications/<int:pk>/', views.notification_detail, name='notification-detail'),
    # path('notifications/create/', views.notification_create, name='notification-create'),
    # path('notifications/<int:pk>/edit/', views.notification_edit, name='notification-edit'),
    # path('notifications/<int:pk>/delete/', views.notification_delete, name='notification-delete'),
]