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

]