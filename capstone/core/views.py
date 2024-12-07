import json
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q

from .models import (
    CustomUser, AdminProfile, StaffProfile, TeacherProfile, 
    StudentProfile, ParentProfile, SalaryPayment,
    AcademicYear, Grade, Class, Subject, Schedule, TeacherAssignment,
    StudentEnrollment, Attendance, Exam, ExamGrade, Fees, Notification,
    TeacherDailyAttendance, StaffDailyAttendance
)
# Create your views here.
def home(request):

    return HttpResponse('Hello')

def sign_in(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        print(username, password)

        # Authenticate the user
        user = authenticate(request, username=username, password=password)
        print('authenticate done:', user)
        
        if user is not None:  # Only proceed if authentication is successful
            login(request, user)
            print('login done')
            print(request.user)
            print("User authenticated successfully:", user)
            print("Is authenticated after login:", request.user.is_authenticated)  # Debugging statement
            
            # Redirect based on user role
            role = getattr(request.user, 'role', None)  # Use getattr to avoid errors
            if role == 'admin':
                return redirect('admin-dashboard')
            elif role == 'staff':
                return redirect('staff-dashboard')
            elif role == 'teacher':
                return redirect('teacher-dashboard')
            elif role == 'student':
                return redirect('student-dashboard')
            elif role == 'parent':
                return redirect('parent-dashboard')
            else:
                return render(request, 'core/sign_in.html', {'error': 'Role not assigned to user.'})
        else:
            print("Invalid login credentials.")
            return render(request, 'core/sign_in.html', {'error': 'Invalid username or password.'})

    return render(request, 'core/sign_in.html')


@login_required(login_url='/core/sign-in/')
def student_dashboard(request):
    user = request.user
    student_profile = StudentProfile.objects.get(user=user)
    
    # Get active academic year
    active_academic_year = AcademicYear.objects.filter(is_active=True).first()
    
    # Enrollments for the active academic year
    enrollments = StudentEnrollment.objects.filter(student=student_profile, academic_year=active_academic_year)
    
    # Attendance records for the active academic year
    attendance_records = Attendance.objects.filter(student=student_profile, academic_year=active_academic_year)
    
    # Exams and exam grades for the active academic year
    exam_grades = ExamGrade.objects.filter(student=student_profile, academic_year=active_academic_year)
    
    # Class details for the active academic year
    class_instance = enrollments.first().class_assigned if enrollments.exists() else None
    
    # Schedule for the student's class in the active academic year
    schedule = Schedule.objects.filter(class_instance=class_instance)
    
    # Notifications targeting the student’s class or grade in the active academic year
    # notifications = Notification.objects.filter(
    #     is_active=True,
    #     scope__in=['Class', 'Grade', 'School']
    # ).filter(
    #     class_target=class_instance  # For class-specific notifications
    # ) | Notification.objects.filter(
    #     grade_target=class_instance.grade  # For grade-specific notifications
    # ) | Notification.objects.filter(
    #     scope='School'  # For school-wide notifications
    # ).distinct()

    # Notifications targeting the student’s class, grade, or the whole school
    notifications = Notification.objects.filter(
        is_active=True,
        scope__in=['Class', 'Grade', 'School']
    ).filter(
        Q(scope='Class', class_target=class_instance) |
        Q(scope='Grade', grade_target=class_instance.grade) |
        Q(scope='School')
    ).distinct()

    return render(request, 'core/student_dashboard.html', {
        'student_profile': student_profile,
        'enrollments': enrollments,
        'attendance_records': attendance_records,
        'exam_grades': exam_grades,
        'class_instance': class_instance,
        'schedule': schedule,
        'notifications': notifications,
    })

@login_required
@require_http_methods(["POST"])
def log_out(request):
    logout(request)
    return HttpResponseRedirect(reverse('sign-in'))

@login_required
def staff_dashboard(request):
    user = request.user
    staff_profile = StaffProfile.objects.get(user=user)

    # Fetch data for dashboard
    context = {
        'staff_profile': staff_profile,
    }

    return render(request, 'core/staff_dashboard.html', context)

@login_required
def profile(request):
    user = request.user
    profile_data = {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "gender": user.gender,
        "religion": user.religion,
        "phone_number": user.phone_number,
        "address": user.address,
        "date_of_birth": user.date_of_birth,
    }

    # Additional data based on role
    if user.role == 'staff' and hasattr(user, 'staffprofile'):
        profile_data["salary"] = user.staffprofile.salary
    elif user.role == 'teacher' and hasattr(user, 'teacherprofile'):
        profile_data["salary"] = user.teacherprofile.salary
    elif user.role == 'parent' and hasattr(user, 'parentprofile'):
        profile_data["students"] = [
            student.user.username for student in user.parentprofile.students.all()
        ]

    return JsonResponse(profile_data)

@login_required
def academicYear(request):
    academic_years = AcademicYear.objects.all().values('id', 'year', 'is_active')
    
    return JsonResponse(list(academic_years), safe=False)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def academic_year_detail(request, id):
    try:
        academic_year = AcademicYear.objects.get(id=id)
    except AcademicYear.DoesNotExist:
        return JsonResponse({"error": "Academic Year not found"}, status=404)

    if request.method == "PUT":
        data = json.loads(request.body)
        academic_year.year = data.get("year", academic_year.year)
        academic_year.is_active = data.get("is_active", academic_year.is_active)
        academic_year.save()
        return JsonResponse({"message": "Academic Year updated successfully"})

    if request.method == "DELETE":
        academic_year.delete()
        return JsonResponse({"message": "Academic Year deleted successfully"})
