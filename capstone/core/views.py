import json
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.db.models import Q, F
from collections import defaultdict
from django.utils.timezone import now

from .models import (
    CustomUser, AdminProfile, StaffProfile, TeacherProfile, 
    StudentProfile, ParentProfile, SalaryPayment,
    AcademicYear, Grade, Class, Subject, Schedule, TeacherAssignment,
    StudentEnrollment, Attendance, Exam, ExamGrade, Fees, AdditionalFee, Notification,
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
def getAcademicYears(request):
    print("getAcademicYears endpoint accessed")  # Debug log
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
        print('loading json')
        data = json.loads(request.body)
        academic_year.year = data.get("year", academic_year.year)
        academic_year.is_active = data.get("is_active", academic_year.is_active)
        academic_year.save()
        print('done saving')
        return JsonResponse({"message": "Academic Year updated successfully"})

    if request.method == "DELETE":
        academic_year.delete()
        return JsonResponse({"message": "Academic Year deleted successfully"})

@csrf_exempt
@require_http_methods(["POST"])
def create_academic_year(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            new_year = AcademicYear.objects.create(
                year=data.get("year"),
                is_active=data.get("is_active", False),
            )
            return JsonResponse({"message": "Academic Year created successfully", "id": new_year.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

def get_classes_view(request):
    """
    Returns a JSON response with all classes and their related information.
    """
    classes = Class.objects.select_related('grade', 'academic_year').prefetch_related('timetable', 'subject_set').all()
    
    classes_data = [
        {
            "id": cls.id,
            "name": cls.name,
            "grade": cls.grade.name,
            "academic_year": cls.academic_year.year if cls.academic_year else None,
            "is_active": cls.is_active,
            "subjects": [
                {"id": subject.id, "name": subject.name}
                for subject in cls.subject_set.all()
            ],
            "timetable": [
                {
                    "id": schedule.id,
                    "section": schedule.section,
                    "day_of_week": schedule.day_of_week,
                    "subject": schedule.subject.name if schedule.subject else "No Subject",
                }
                for schedule in cls.timetable.all()
            ]
        }
        for cls in classes
    ]

    return JsonResponse(classes_data, safe=False)

def get_active_options(request):
    try:
        # Fetch active academic years
        active_academic_years = AcademicYear.objects.filter(is_active=True).values("id", "year")
        # Fetch active grades
        active_grades = Grade.objects.values("id", "name")  # Assuming Grade does not have `is_active`
        
        return JsonResponse({
            "academic_years": list(active_academic_years),
            "grades": list(active_grades)
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def create_class(request):
    if request.method == "POST":
        try:
            # Parse the JSON payload
            data = json.loads(request.body)
            class_name = data.get("name")
            academic_year_id = data.get("academic_year_id")
            grade_id = data.get("grade_id")
            
            # Validate data
            if not class_name or not academic_year_id or not grade_id:
                return JsonResponse({"error": "All fields are required"}, status=400)

            # Fetch related objects
            academic_year = AcademicYear.objects.get(id=academic_year_id)
            grade = Grade.objects.get(id=grade_id)

            # Create the class
            new_class = Class.objects.create(
                name=class_name,
                academic_year=academic_year,
                grade=grade
            )

            return JsonResponse({
                "message": "Class created successfully",
                "class": {
                    "id": new_class.id,
                    "name": new_class.name,
                    "academic_year": academic_year.year,
                    "grade": grade.name
                }
            }, status=201)
        except AcademicYear.DoesNotExist:
            return JsonResponse({"error": "Invalid Academic Year"}, status=404)
        except Grade.DoesNotExist:
            return JsonResponse({"error": "Invalid Grade"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)

def get_class_details(request, id):
    try:
        class_instance = Class.objects.get(id=id)
        active_academic_years = AcademicYear.objects.filter(is_active=True).values("id", "year")
        grades = Grade.objects.values("id", "name")

        return JsonResponse({
            "name": class_instance.name,
            "academic_year": {"id": class_instance.academic_year.id, "year": class_instance.academic_year.year},
            "grade": {"id": class_instance.grade.id, "name": class_instance.grade.name},
            "active_academic_years": list(active_academic_years),
            "grades": list(grades),
        })
    except Class.DoesNotExist:
        return JsonResponse({"error": "Class not found"}, status=404)

@csrf_exempt
def update_class(request, id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            class_instance = Class.objects.get(id=id)

            class_instance.name = data.get("name")
            class_instance.academic_year_id = data.get("academic_year_id")
            class_instance.grade_id = data.get("grade_id")
            class_instance.save()

            return JsonResponse({"message": "Class updated successfully"})
        except Class.DoesNotExist:
            return JsonResponse({"error": "Class not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        
@csrf_exempt
def delete_class(request, id):
    if request.method == "DELETE":
        try:
            class_instance = Class.objects.get(id=id)
            class_instance.delete()
            return JsonResponse({"message": "Class deleted successfully"})
        except Class.DoesNotExist:
            return JsonResponse({"error": "Class not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

def get_grades(request):
    """
    Returns a JSON response with all grades.
    """
    try:
        grades = Grade.objects.all().values("id", "name")
        return JsonResponse({"grades": list(grades)}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def edit_grade(request, id):
    """
    Updates a grade with the given ID.
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            grade = Grade.objects.get(id=id)
            grade.name = data.get("name", grade.name)
            grade.save()
            return JsonResponse({"message": "Grade updated successfully"}, status=200)
        except Grade.DoesNotExist:
            return JsonResponse({"error": "Grade not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def delete_grade(request, id):
    """
    Deletes a grade with the given ID.
    """
    if request.method == "DELETE":
        try:
            grade = Grade.objects.get(id=id)
            grade.delete()
            return JsonResponse({"message": "Grade deleted successfully"}, status=200)
        except Grade.DoesNotExist:
            return JsonResponse({"error": "Grade not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def create_grade(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            grade_name = data.get("name")
            if not grade_name:
                return JsonResponse({"error": "Grade name is required"}, status=400)
            grade = Grade.objects.create(name=grade_name)
            return JsonResponse({"message": "Grade created successfully", "grade": {"id": grade.id, "name": grade.name}}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def get_subjects_for_staff(request):
    if request.method == "GET":
        try:
            subjects = Subject.objects.select_related("grade", "academic_year").prefetch_related("classes").all()
            subject_list = [
                {
                    "id": subject.id,
                    "name": subject.name,
                    "grade": subject.grade.name,
                    "academic_year": subject.academic_year.year if subject.academic_year else None,
                    "classes": [cls.name for cls in subject.classes.all()],
                    "is_active": subject.is_active,
                }
                for subject in subjects
            ]
            return JsonResponse({"subjects": subject_list}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def create_subject(request):
    if request.method == "POST":
        try:
            # Parse and validate input
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON input"}, status=400)

            subject_name = data.get("name")
            grade_id = data.get("grade_id")
            academic_year_id = data.get("academic_year_id")
            class_ids = data.get("class_ids", [])

            # Validate required fields
            required_fields = ["name", "grade_id", "academic_year_id"]
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return JsonResponse({"error": f"Missing required fields: {', '.join(missing_fields)}"}, status=400)

            # Fetch related objects
            grade = get_object_or_404(Grade, id=grade_id)
            academic_year = get_object_or_404(AcademicYear, id=academic_year_id)

            # Validate class IDs
            valid_classes = Class.objects.filter(id__in=class_ids)
            if len(valid_classes) != len(class_ids):
                return JsonResponse({"error": "One or more class IDs are invalid."}, status=400)

            # Check for existing subject
            existing_subject = Subject.objects.filter(
                name=subject_name,
                grade=grade,
                academic_year=academic_year,
            ).first()
            if existing_subject:
                return JsonResponse({"error": "A subject with the same name, grade, and academic year already exists."}, status=400)

            # Create the subject
            new_subject = Subject.objects.create(
                name=subject_name,
                grade=grade,
                academic_year=academic_year,
            )

            # Assign classes to the subject
            new_subject.classes.set(valid_classes)

            return JsonResponse({
                "message": "Subject created successfully",
                "subject": {
                    "id": new_subject.id,
                    "name": new_subject.name,
                    "grade": grade.name,
                    "academic_year": academic_year.year,
                    "classes": [{"id": cls.id, "name": cls.name} for cls in valid_classes]
                }
            }, status=201)

        except Grade.DoesNotExist:
            return JsonResponse({"error": "Invalid grade"}, status=404)
        except AcademicYear.DoesNotExist:
            return JsonResponse({"error": "Invalid academic year"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)
    
@csrf_exempt
def get_active_subject_options(request):
    try:
        # Fetch active grades
        active_grades = Grade.objects.all().values("id", "name")

        # Fetch active academic years
        active_academic_years = AcademicYear.objects.filter(is_active=True).values("id", "year")

        return JsonResponse({
            "grades": list(active_grades),
            "academic_years": list(active_academic_years)
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_classes_for_grade_and_year(request):
    if request.method == "GET":
        grade_id = request.GET.get("grade_id")
        academic_year_id = request.GET.get("academic_year_id")
        try:
            # Fetch available classes for the selected grade and academic year
            classes = Class.objects.filter(
                grade_id=grade_id,
                academic_year_id=academic_year_id
            ).values("id", "name")

            return JsonResponse({"classes": list(classes)}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def edit_subject(request, subject_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)  # Parse the incoming JSON payload
            
            subject = Subject.objects.get(pk=subject_id)
            grade = Grade.objects.get(pk=data["grade_id"])
            academic_year = AcademicYear.objects.get(pk=data["academic_year_id"])
            classes = Class.objects.filter(id__in=data["class_ids"])

            # Update the subject fields
            subject.name = data["name"]
            subject.grade = grade
            subject.academic_year = academic_year
            subject.is_active = data["is_active"]
            subject.save()

            # Update the many-to-many relationship with classes
            subject.classes.set(classes)
            subject.save()

            return JsonResponse({"success": "Subject updated successfully!"})
        except Subject.DoesNotExist:
            return JsonResponse({"error": "Subject not found"}, status=404)
        except Grade.DoesNotExist:
            return JsonResponse({"error": "Grade not found"}, status=404)
        except AcademicYear.DoesNotExist:
            return JsonResponse({"error": "Academic Year not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def delete_subject(request, subject_id):
    if request.method == "DELETE":
        try:
            subject = Subject.objects.get(pk=subject_id)
            subject.delete()
            return JsonResponse({"success": "Subject deleted successfully!"})
        except Subject.DoesNotExist:
            return JsonResponse({"error": "Subject not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

def get_subject_details(request, subject_id):
    try:
        subject = Subject.objects.get(pk=subject_id)
        grades = Grade.objects.all()
        academic_years = AcademicYear.objects.all()
        classes = Class.objects.filter(grade=subject.grade)

        response = {
            "id": subject.id,
            "name": subject.name,
            "grade": {"id": subject.grade.id, "name": subject.grade.name},
            "grades": [{"id": g.id, "name": g.name} for g in grades],
            "academic_year": {"id": subject.academic_year.id, "year": subject.academic_year.year},
            "academic_years": [{"id": ay.id, "year": ay.year} for ay in academic_years],
            "classes": [{"id": c.id, "name": c.name} for c in classes],
            "selected_classes": [c.id for c in subject.classes.all()],
            "is_active": subject.is_active,
        }
        return JsonResponse(response)
    except Subject.DoesNotExist:
        return JsonResponse({"error": "Subject not found"}, status=404)

def get_users(request):
    if request.method == "GET":
        users = CustomUser.objects.all().values(
            "id", "username", "role", "email", "phone_number", "gender"
        )
        return JsonResponse(list(users), safe=False)
    return JsonResponse({"error": "Invalid request method"}, status=400)

def user_profile(request, user_id):
    # Placeholder logic for the user profile
    return render(request, "core/user_profile.html", {"user_id": user_id})

@csrf_exempt
def create_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Extract salary from roleSpecificData if present
            salary = data.get("roleSpecificData", {}).get("salary")

            # Create user
            user = CustomUser.objects.create_user(
                username=data["username"],
                email=data.get("email"),
                password=data["password"],
                role=data["role"],
                nrc_no=data.get("nrc_no"),
                gender=data.get("gender"),
                religion=data.get("religion"),
                phone_number=data.get("phone_number"),
                address=data.get("address"),
                date_of_birth=data.get("date_of_birth"),
            )

            # Log the user data
            print("Created User:", vars(user))

            # Handle role-specific logic
            if user.role == "staff":
                staff_profile = StaffProfile.objects.create(user=user, salary=salary)
                print("Created Staff Profile:", vars(staff_profile))
            elif user.role == "teacher":
                teacher_profile = TeacherProfile.objects.create(user=user, salary=salary)
                print("Created Teacher Profile:", vars(teacher_profile))
            elif user.role == "student":
                student_profile = StudentProfile.objects.create(user=user)
                print("Created Student Profile:", vars(student_profile))
            elif user.role == "parent":
                parent_profile = ParentProfile.objects.create(user=user)
                parent_profile.students.set(data.get("linked_students", []))
                print("Created Parent Profile:", vars(parent_profile))

            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method"})

@csrf_exempt
def get_user_details(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)
    user_data = {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone_number": user.phone_number,
        "gender": user.gender,
    }
    return JsonResponse(user_data)

@csrf_exempt
def edit_user(request, user_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user = CustomUser.objects.get(id=user_id)
            user.username = data["username"]
            user.email = data.get("email", "")
            user.role = data["role"]
            user.phone_number = data.get("phone_number", "")
            user.gender = data.get("gender", "")
            user.save()
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method"})

@csrf_exempt
def delete_user(request, user_id):
    if request.method == "DELETE":
        try:
            user = CustomUser.objects.get(id=user_id)
            user.delete()
            return JsonResponse({"success": True})
        except CustomUser.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method"})

def fetch_grades(request):
    grades = Grade.objects.values("id", "name")
    return JsonResponse(list(grades), safe=False)

def fetch_students_grouped_by_grade(request):
    enrollments = StudentEnrollment.objects.select_related("student", "grade")
    grouped_students = {}

    for enrollment in enrollments:
        grade_name = enrollment.grade.name
        if grade_name not in grouped_students:
            grouped_students[grade_name] = []
        grouped_students[grade_name].append({
            "id": enrollment.student.user.id,
            "username": enrollment.student.user.username,
        })

    return JsonResponse(grouped_students)


    classes = Class.objects.filter(grade_id=grade_id, academic_year_id=academic_year_id).values('id', 'name')
    return JsonResponse(list(classes), safe=False)

def fetch_academic_years(request):
    academic_years = AcademicYear.objects.values("id", "year", "is_active")
    return JsonResponse(list(academic_years), safe=False)

def fetch_all_students(request):
    """
    Fetch all students with their enrollment status, grade, and class.
    """
    enrolled_students = StudentEnrollment.objects.select_related(
        "grade", "class_assigned", "academic_year"
    ).values(
        "student_id", 
        "grade__name", 
        "class_assigned__name"
    )

    enrolled_dict = {enrollment["student_id"]: enrollment for enrollment in enrolled_students}

    students = StudentProfile.objects.select_related("user").values(
        "id", 
        "user__username"
    )

    # Add grade and class info to each student
    students_with_status = []
    for student in students:
        student_id = student["id"]
        enrollment = enrolled_dict.get(student_id, {})
        students_with_status.append({
            "id": student_id,
            "username": student["user__username"],
            "grade": enrollment.get("grade__name", None),
            "class": enrollment.get("class_assigned__name", None),
            "is_enrolled": bool(enrollment),
        })

    return JsonResponse(students_with_status, safe=False)

def fetch_classes_for_grade(request, grade_id, academic_year_id):
    classes = Class.objects.filter(grade_id=grade_id, academic_year_id=academic_year_id).values("id", "name")
    return JsonResponse(list(classes), safe=False)

@csrf_exempt
def enroll_student(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            student = StudentProfile.objects.get(id=data["student_id"])
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])
            grade = Grade.objects.get(id=data["grade_id"])
            class_assigned = Class.objects.get(id=data["class_id"])

            StudentEnrollment.objects.create(
                student=student,
                academic_year=academic_year,
                grade=grade,
                class_assigned=class_assigned,
            )
            return JsonResponse({"success": True, "message": "Student enrolled successfully."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

def get_enrollment_details(request, student_id):
    """
    Fetch details for a student's current enrollment and dropdown options.
    """
    student = get_object_or_404(StudentProfile, id=student_id)
    enrollment = StudentEnrollment.objects.filter(student=student).select_related(
        "academic_year", "grade", "class_assigned"
    ).first()

    academic_years = AcademicYear.objects.values("id", "year")
    grades = Grade.objects.values("id", "name")
    classes = Class.objects.filter(
        grade=enrollment.grade if enrollment else None
    ).values("id", "name") if enrollment else []

    return JsonResponse({
        "academic_years": list(academic_years),
        "grades": list(grades),
        "classes": list(classes),
        "current_academic_year": enrollment.academic_year_id if enrollment else None,
        "current_grade": enrollment.grade_id if enrollment else None,
        "current_class": enrollment.class_assigned_id if enrollment else None,
    })

@csrf_exempt
def edit_enrollment(request, student_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            student = StudentProfile.objects.get(id=student_id)
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])
            grade = Grade.objects.get(id=data["grade_id"])
            class_assigned = Class.objects.get(id=data["class_id"])

            # Update or create the enrollment record
            enrollment, created = StudentEnrollment.objects.update_or_create(
                student=student,
                defaults={
                    "academic_year": academic_year,
                    "grade": grade,
                    "class_assigned": class_assigned,
                },
            )

            if created:
                message = "Enrollment created successfully!"
            else:
                message = "Enrollment updated successfully!"

            return JsonResponse({"success": True, "message": message})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def delete_enrollment(request, student_id):
    if request.method == "DELETE":
        try:
            enrollment = StudentEnrollment.objects.get(student_id=student_id)
            enrollment.delete()
            return JsonResponse({"success": True, "message": "Enrollment deleted successfully."})
        except StudentEnrollment.DoesNotExist:
            return JsonResponse({"success": False, "error": "Enrollment not found."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def fetch_all_parent_student_relationships(request):
    """
    Fetch all parent-student relationships as a flat list.
    """
    try:
        relationships = []
        parents = ParentProfile.objects.select_related("user").prefetch_related("students__user").all()

        for parent in parents:
            if parent.students.exists():
                for student in parent.students.all():
                    relationships.append({
                        "parent_id": parent.id,
                        "parent_name": parent.user.username,
                        "student_id": student.id,
                        "student_name": student.user.username,
                    })
            else:
                # Parent with no students
                relationships.append({
                    "parent_id": parent.id,
                    "parent_name": parent.user.username,
                    "student_id": None,
                    "student_name": "N/A",
                })

        return JsonResponse(relationships, safe=False)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
def add_parent_relationship(request, parent_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            parent = ParentProfile.objects.get(id=parent_id)
            students = StudentProfile.objects.filter(id__in=data["student_ids"])
            parent.students.set(students)
            return JsonResponse({"success": True, "message": "Relationship added successfully."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def get_parent_relationship(request, parent_id):
    """
    Fetch all students and the students currently related to the parent.
    """
    try:
        parent = ParentProfile.objects.get(id=parent_id)
        related_students = parent.students.values_list("id", flat=True)
        all_students = StudentProfile.objects.select_related("user").values("id", username=F("user__username"))

        return JsonResponse({
            "related_students": list(related_students),
            "all_students": list(all_students),
        })
    except ParentProfile.DoesNotExist:
        return JsonResponse({"success": False, "error": "Parent not found."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
def edit_parent_relationship(request, parent_id):
    """
    Update the parent-student relationship.
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            parent = ParentProfile.objects.get(id=parent_id)
            students = StudentProfile.objects.filter(id__in=data["student_ids"])
            parent.students.set(students)  # Update relationship
            return JsonResponse({"success": True, "message": "Relationship updated successfully."})
        except ParentProfile.DoesNotExist:
            return JsonResponse({"success": False, "error": "Parent not found."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def delete_parent_student_relationship(request, parent_id, student_id):
    """
    Delete a specific parent-student relationship.
    """
    if request.method == "DELETE":
        try:
            parent = ParentProfile.objects.get(id=parent_id)
            student = StudentProfile.objects.get(id=student_id)
            parent.students.remove(student)  # Remove specific relationship
            return JsonResponse({"success": True, "message": "Relationship deleted successfully."})
        except ParentProfile.DoesNotExist:
            return JsonResponse({"success": False, "error": "Parent not found."})
        except StudentProfile.DoesNotExist:
            return JsonResponse({"success": False, "error": "Student not found."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def fetch_teacher_overview(request):
    assignments = TeacherAssignment.objects.select_related(
        "teacher__user", "subject", "class_assigned__grade", "academic_year"
    )

    teacher_data = defaultdict(list)
    for assignment in assignments:
        teacher_data[assignment.teacher.id].append({
            "subject": assignment.subject.name if assignment.subject else "N/A",
            "grade": assignment.class_assigned.grade.name if assignment.class_assigned else "N/A",
            "class": assignment.class_assigned.name if assignment.class_assigned else "N/A",
            "assignment_id": assignment.id,
        })

    teachers = TeacherProfile.objects.select_related("user").values("id", username=F("user__username"))
    response = []
    for teacher in teachers:
        response.append({
            "teacher_id": teacher["id"],
            "teacher_name": teacher["username"],
            "assignments": teacher_data.get(teacher["id"], []),
        })

    return JsonResponse(response, safe=False)

@csrf_exempt
def fetch_teachers(request):
    teachers = TeacherProfile.objects.select_related("user").values("id", username=F("user__username"))
    return JsonResponse(list(teachers), safe=False)

@csrf_exempt
def fetch_teacher_assignments(request):

    assignments = TeacherAssignment.objects.select_related(
        "teacher__user", "subject", "class_assigned__grade", "academic_year"
    )

    response = []
    for assignment in assignments:
        response.append({
            "teacher_id": assignment.teacher.id,
            "teacher_name": assignment.teacher.user.username,
            "subject": assignment.subject.name if assignment.subject else "N/A",
            "grade": assignment.class_assigned.grade.name if assignment.class_assigned else "N/A",
            "class": assignment.class_assigned.name if assignment.class_assigned else "N/A",
            "assignment_id": assignment.id,
            "academic_year": assignment.academic_year.year if assignment.academic_year else "N/A",
        })

    return JsonResponse(response, safe=False)

def fetch_grades_teacherAssignment(request, academic_year_id):
    # Find grades through related classes
    class_grades = Class.objects.filter(academic_year_id=academic_year_id).values_list("grade_id", flat=True)
    grades = Grade.objects.filter(id__in=class_grades).values("id", "name")
    return JsonResponse(list(grades), safe=False)

def fetch_classes(request):
    classes = Class.objects.select_related("grade").values("id", "name", "grade__name")
    return JsonResponse(
        [{"id": cls["id"], "name": cls["name"], "grade": cls["grade__name"]} for cls in classes],
        safe=False,
    )

@csrf_exempt
def fetch_classes_and_subjects(request, academic_year_id, grade_id):
    try:
        classes = Class.objects.filter(academic_year_id=academic_year_id, grade_id=grade_id).values("id", "name")
        subjects = Subject.objects.filter(academic_year_id=academic_year_id, grade_id=grade_id).values("id", "name")
        return JsonResponse({"classes": list(classes), "subjects": list(subjects)})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def assign_teacher(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            teacher = TeacherProfile.objects.get(id=data["teacher_id"])
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])
            class_assigned = Class.objects.get(id=data["class_id"])
            subject = Subject.objects.get(id=data["subject_id"])

            # Attempt to create the assignment
            TeacherAssignment.objects.create(
                teacher=teacher,
                academic_year=academic_year,
                class_assigned=class_assigned,
                subject=subject,
            )
            return JsonResponse({"success": True, "message": "Teacher assigned successfully."})
        except ValidationError as e:
            return JsonResponse({"success": False, "error": str(e)})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method"})

@csrf_exempt
def delete_teacher_assignment(request, assignment_id):

    if request.method == "DELETE":
        try:
            assignment = TeacherAssignment.objects.get(id=assignment_id)
            assignment.delete()
            return JsonResponse({"success": True, "message": "Assignment deleted successfully."})
        except TeacherAssignment.DoesNotExist:
            return JsonResponse({"success": False, "error": "Assignment not found."}, status=404)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=405)

@csrf_exempt
def create_class_fees(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            class_id = data["class_id"]
            description = data["description"]
            amount = data["amount"]
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])

            students = StudentEnrollment.objects.filter(class_assigned_id=class_id, academic_year=academic_year).values("student_id")

            for student in students:
                AdditionalFee.objects.create(
                    student_id=student["student_id"],
                    description=description,
                    amount=amount,
                    academic_year=academic_year,
                )

            return JsonResponse({"success": True, "message": "Fees created for all students in the class."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def create_grade_fees(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            grade_id = data["grade_id"]
            description = data["description"]
            amount = data["amount"]
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])

            students = StudentEnrollment.objects.filter(grade_id=grade_id, academic_year=academic_year).values("student_id")

            for student in students:
                AdditionalFee.objects.create(
                    student_id=student["student_id"],
                    description=description,
                    amount=amount,
                    academic_year=academic_year,
                )

            return JsonResponse({"success": True, "message": "Fees created for all students in the grade."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def create_student_fee(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            student_id = data["student_id"]
            description = data["description"]
            amount = data["amount"]
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])

            AdditionalFee.objects.create(
                student_id=student_id,
                description=description,
                amount=amount,
                academic_year=academic_year,
            )

            return JsonResponse({"success": True, "message": "Fee created for the student."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def create_school_fees(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            description = data["description"]
            amount = data["amount"]
            academic_year = AcademicYear.objects.get(id=data["academic_year_id"])

            students = StudentProfile.objects.all()
            for student in students:
                AdditionalFee.objects.create(
                    student=student,
                    description=description,
                    amount=amount,
                    academic_year=academic_year,
                )

            return JsonResponse({"success": True, "message": "Fees created for all students in the school."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request method."})

def fetch_available_students(request):
    students = StudentProfile.objects.select_related("user").values(
        "id", username=F("user__username")
    )
    return JsonResponse(list(students), safe=False)

@csrf_exempt
@login_required
def fetch_notifications(request):
    """
    Merged endpoint:
    - If query parameter view=personal is provided, return only notifications for which
      the logged-in user is a recipient.
    - Otherwise, if the user has a management role (admin, staff, teacher), return all notifications.
    """
    view_type = request.GET.get("view", "").lower()
    
    if view_type == "personal":
        notifications = Notification.objects.filter(recipients=request.user).values(
            "id", "title", "message", "scope", "is_active", "created_at", "sender_id"
        )
        return JsonResponse(list(notifications), safe=False)
    else:
        # For management views, only allow admins, staff, and teachers
        if request.user.role not in ["admin", "staff", "teacher"]:
            return JsonResponse({"error": "Access denied"}, status=403)
        notifications = Notification.objects.all().values(
            "id", "title", "message", "scope", "is_active", "created_at", "sender_id"
        )
        return JsonResponse(list(notifications), safe=False)

# Fetch available notification scopes based on user role
@csrf_exempt
def fetch_notification_scopes(request):
    role = request.user.role
    scopes = ["Personal"]

    if role in ["admin", "staff"]:
        scopes.extend(["School", "Grade", "Class", "Admin", "Staff", "Teacher", "Student", "Parent"])
    elif role == "teacher":
        scopes.extend(["Grade", "Class"])

    return JsonResponse({"scopes": scopes})

# Fetch recipients based on selected scope
@csrf_exempt
def fetch_notification_recipients(request):
    scope = request.GET.get("scope")
    
    if scope == "School":
        recipients = CustomUser.objects.all()
    elif scope in ["Admin", "Staff", "Teacher", "Student", "Parent"]:
        recipients = CustomUser.objects.filter(role=scope.lower())
    elif scope == "Grade":
        grade_id = request.GET.get("grade_id")
        if not grade_id:
            return JsonResponse({"error": "Missing grade_id"}, status=400)
        recipients = CustomUser.objects.filter(studentprofile__grade_id=grade_id)
    elif scope == "Class":
        class_id = request.GET.get("class_id")
        if not class_id:
            return JsonResponse({"error": "Missing class_id"}, status=400)
        recipients = CustomUser.objects.filter(studentprofile__class_id=class_id)
    elif scope == "Personal":
        recipients = CustomUser.objects.all()
    else:
        return JsonResponse({"error": "Invalid scope"}, status=400)
    
    return JsonResponse(list(recipients.values("id", "username")), safe=False)

# Create a new notification
@csrf_exempt
def create_notification(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            notification = Notification.objects.create(
                title=data["title"],
                message=data["message"],
                scope=data["scope"],
                sender=request.user
            )

            recipient_ids = data.get("recipients", [])
            notification.recipients.set(CustomUser.objects.filter(id__in=recipient_ids))
            notification.save()
            return JsonResponse({"success": True, "message": "Notification created successfully."})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)

# Delete a notification
@csrf_exempt
def delete_notification(request, notification_id):
    try:
        notification = get_object_or_404(Notification, id=notification_id)
        if request.user.role not in ["admin", "staff"] and notification.sender != request.user:
            return JsonResponse({"error": "Unauthorized action"}, status=403)

        notification.delete()
        return JsonResponse({"success": True, "message": "Notification deleted successfully."})

    except Notification.DoesNotExist:
        return JsonResponse({"error": "Notification not found."})

# teacher parts
def teacher_dashboard(request):
    user = request.user
    teacher_profile = TeacherProfile.objects.get(user=user)

    # Fetch data for dashboard
    context = {
        'teachcer_profile': teacher_profile,
    }
    return render(request, 'core/teacher_dashboard.html', context)

def get_teacher_schedule(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    teacher = request.user.teacherprofile
    day = request.GET.get('day', None)

    assignments = TeacherAssignment.objects.filter(teacher=teacher)
    subject_ids = assignments.values_list('subject_id', flat=True)
    class_ids = assignments.values_list('class_assigned_id', flat=True)

    # Fetch schedules for the given day
    schedules = Schedule.objects.filter(
        subject_id__in=subject_ids,
        class_instance_id__in=class_ids,
        day_of_week=day if day else 'Monday'
    ).select_related('class_instance', 'subject')

    # Schedule data with grade
    schedule_data = [
        {
            "section": schedule.section,
            "class_name": schedule.class_instance.name,
            "grade": schedule.class_instance.grade.name,  # Add grade
            "subject_name": schedule.subject.name,
            "day": schedule.day_of_week,
            "time": dict(Schedule.SECTION_CHOICES).get(schedule.section),  # Add time
        }
        for schedule in schedules
    ]

    return JsonResponse({'schedules': schedule_data})

def get_assigned_classes(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    teacher = request.user.teacherprofile
    assignments = TeacherAssignment.objects.filter(teacher=teacher).select_related('class_assigned')

    class_data = [
        {
            "id": assignment.class_assigned.id,
            "name": assignment.class_assigned.name,
            "grade": assignment.class_assigned.grade.name,
        }
        for assignment in assignments
    ]

    return JsonResponse({'classes': class_data})

def get_class_schedule(request, class_id):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    class_instance = get_object_or_404(Class, id=class_id)
    schedules = Schedule.objects.filter(class_instance=class_instance).select_related('subject', 'class_instance')

    timetable = {}
    for schedule in schedules:
        day = schedule.day_of_week
        section = schedule.section
        if day not in timetable:
            timetable[day] = {}
        timetable[day][section] = {
            "id": schedule.id,  # Include the schedule ID
            "subject_name": schedule.subject.name if schedule.subject else "No Subject",
        }

    return JsonResponse({'timetable': timetable})

@csrf_exempt
def create_schedule(request):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        try:
            data = json.loads(request.body)
            class_instance = Class.objects.get(id=data['class_id'])
            subject = Subject.objects.get(id=data['subject_id'])
            day_of_week = data['day_of_week']
            section = data['section']

            # Check if the section already has a schedule
            if Schedule.objects.filter(class_instance=class_instance, day_of_week=day_of_week, section=section).exists():
                return JsonResponse({'error': 'Schedule already exists for this section'}, status=400)

            # Create the schedule
            Schedule.objects.create(
                class_instance=class_instance,
                subject=subject,
                day_of_week=day_of_week,
                section=section,
            )
            return JsonResponse({'message': 'Schedule created successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_schedule_details(request, schedule_id):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    schedule = get_object_or_404(Schedule, id=schedule_id)
    data = {
        'id': schedule.id,
        'class_id': schedule.class_instance.id,
        'day_of_week': schedule.day_of_week,
        'section': schedule.section,
        'subject_id': schedule.subject.id if schedule.subject else None,
    }

    return JsonResponse(data)

@csrf_exempt
def edit_schedule(request, schedule_id):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        schedule = get_object_or_404(Schedule, id=schedule_id)

        try:
            data = json.loads(request.body)
            schedule.day_of_week = data.get('day_of_week', schedule.day_of_week)
            schedule.section = data.get('section', schedule.section)
            subject_id = data.get('subject_id')
            
            if subject_id:
                subject = Subject.objects.get(id=subject_id)
                # Validate subject grade matches class grade
                if subject.grade != schedule.class_instance.grade:
                    return JsonResponse({
                        'error': f"Subject '{subject.name}' belongs to Grade {subject.grade.name}, "
                                 f"but the class belongs to Grade {schedule.class_instance.grade.name}."
                    }, status=400)
                schedule.subject = subject
            
            schedule.save()
            return JsonResponse({'message': 'Schedule updated successfully'})
        except Subject.DoesNotExist:
            return JsonResponse({'error': 'Invalid subject selected'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_subjects(request):
    class_id = request.GET.get('class_id')

    try:
        if class_id:
            # Fetch the class and filter subjects by grade
            class_instance = Class.objects.get(id=class_id)
            subjects = Subject.objects.filter(grade=class_instance.grade).values('id', 'name')
        else:
            # Fetch all subjects (fallback)
            subjects = Subject.objects.all().values('id', 'name')

        return JsonResponse(list(subjects), safe=False)
    except Class.DoesNotExist:
        return JsonResponse({'error': 'Class not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def delete_schedule(request, schedule_id):

    if request.method == "DELETE":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        schedule = get_object_or_404(Schedule, id=schedule_id)
        schedule.delete()
        return JsonResponse({'message': 'Schedule deleted successfully'})
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

def fetch_students_by_class(request, class_id):

    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    # Get the class instance
    class_instance = get_object_or_404(Class, id=class_id)

    # Fetch students enrolled in the specified class
    enrolled_students = StudentEnrollment.objects.filter(
        class_assigned=class_instance
    ).select_related(
        "student__user", "grade"
    ).values(
        "student__id",
        "student__user__username",
        "grade__name",
        "class_assigned__name",
    )

    # Format the response
    students_with_status = [
        {
            "id": student["student__id"],
            "username": student["student__user__username"],
            "grade": student["grade__name"],
            "class": student["class_assigned__name"],
        }
        for student in enrolled_students
    ]

    return JsonResponse(students_with_status, safe=False)

@csrf_exempt
def mark_attendance(request):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        try:
            data = json.loads(request.body)
            class_id = data.get('class_id')
            section = data.get('section')
            date = data.get('date')
            subject_id = data.get('subject_id')
            academic_year_id = data.get('academic_year_id')
            present_students = list(map(int, data.get('present_students', [])))

            # Get class instance and academic year
            class_instance = get_object_or_404(Class, id=class_id)
            academic_year = get_object_or_404(AcademicYear, id=academic_year_id)

            # Get all enrolled students in the class
            enrolled_students = list(StudentEnrollment.objects.filter(
                class_assigned=class_instance
            ).values_list("student_id", flat=True))

            # Calculate absent students dynamically
            absent_students = list(set(enrolled_students) - set(present_students))

            # Create or update attendance record
            attendance, created = Attendance.objects.get_or_create(
                class_instance=class_instance,
                section=section,
                date=date,
                academic_year=academic_year,
            )

            # Update attendance lists
            attendance.present_students.set(StudentProfile.objects.filter(id__in=present_students))
            attendance.absent_students.set(StudentProfile.objects.filter(id__in=absent_students))
            attendance.total_students = len(enrolled_students)
            attendance.save()

            return JsonResponse({
                'message': 'Attendance marked successfully',
                'present_count': attendance.present_students.count(),
                'absent_count': attendance.absent_students.count(),
                'total_students': attendance.total_students
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_class_attendance_details(request, class_id):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    class_instance = get_object_or_404(Class, id=class_id)
    academic_year = class_instance.academic_year
    students = StudentEnrollment.objects.filter(class_assigned=class_instance).select_related('student__user')
    subjects = Subject.objects.filter(grade=class_instance.grade, academic_year=academic_year)

    student_data = [
        {"id": student.student.id, "username": student.student.user.username}
        for student in students
    ]

    subject_data = [
        {"id": subject.id, "name": subject.name}
        for subject in subjects
    ]

    sections = ["1st Section", "2nd Section", "3rd Section", "4th Section"]

    return JsonResponse({
        'students': student_data,
        'subjects': subject_data,
        'sections': sections,
        'academic_year_id': academic_year.id,
    })

def get_attendance_history(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    teacher = request.user.teacherprofile
    class_id = request.GET.get("class_id")
    date = request.GET.get("date")

    assigned_classes = TeacherAssignment.objects.filter(teacher=teacher).values_list("class_assigned_id", flat=True)

    attendance_records = Attendance.objects.filter(class_instance_id__in=assigned_classes)

    if class_id:
        attendance_records = attendance_records.filter(class_instance_id=class_id)
    
    if date:
        attendance_records = attendance_records.filter(date=date)

    attendance_data = [
        {
            "id": record.id,
            "class_name": record.class_instance.name,
            "section": record.section,
            "date": record.date.strftime("%Y-%m-%d"),
            "total_students": record.total_students,
            "present_count": record.present_students.count(),
            "absent_count": record.absent_students.count(),
        }
        for record in attendance_records
    ]

    return JsonResponse({"attendance": attendance_data})

def get_attendance_details(request, attendance_id):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    attendance = get_object_or_404(Attendance, id=attendance_id)

    data = {
        "class_name": attendance.class_instance.name,
        "section": attendance.section,
        "date": attendance.date.strftime("%Y-%m-%d"),
        "total_students": attendance.total_students,
        "present_count": attendance.present_students.count(),
        "absent_count": attendance.absent_students.count(),
        "present_students": [
            {"id": student.id, "username": student.user.username} for student in attendance.present_students.all()
        ],
        "absent_students": [
            {"id": student.id, "username": student.user.username} for student in attendance.absent_students.all()
        ],
    }

    return JsonResponse(data)

@csrf_exempt
def create_exam(request):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        try:
            data = json.loads(request.body)
            name = data.get('name')
            subject_id = data.get('subject_id')
            class_ids = data.get('class_ids', [])  # Multiple classes
            exam_date = data.get('exam_date')
            academic_year_id = data.get('academic_year_id')

            if not all([name, subject_id, class_ids, exam_date, academic_year_id]):
                return JsonResponse({'error': 'All fields are required'}, status=400)

            # Fetch related objects
            subject = get_object_or_404(Subject, id=subject_id)
            academic_year = get_object_or_404(AcademicYear, id=academic_year_id)
            classes = Class.objects.filter(id__in=class_ids)

            # Create Exam
            exam = Exam.objects.create(
                name=name,
                subject=subject,
                exam_date=exam_date,
                academic_year=academic_year
            )

            # Assign multiple classes to the exam
            exam.classes_assigned.set(classes)

            return JsonResponse({'message': 'Exam created successfully'})
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_academic_years(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    academic_years = AcademicYear.objects.values("id", "year")
    return JsonResponse(list(academic_years), safe=False)

def get_classes(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    classes = Class.objects.values("id", "name", "grade__name")
    class_list = [{"id": cls["id"], "name": f"{cls['name']} - {cls['grade__name']}"} for cls in classes]

    return JsonResponse(class_list, safe=False)

def get_exam_filters(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    academic_years = list(AcademicYear.objects.values("id", "year"))
    grades = list(Grade.objects.values("id", "name"))
    classes = list(Class.objects.values("id", "name", "grade_id"))
    subjects = list(Subject.objects.values("id", "name", "grade_id"))

    return JsonResponse({
        "academic_years": academic_years,
        "grades": grades,
        "classes": classes,
        "subjects": subjects
    })

from .filters import ExamFilter  # ✅ Import ExamFilter

def search_exams(request):
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    exam_filter = ExamFilter(request.GET, queryset=Exam.objects.all())
    exams = exam_filter.qs.values("id", "name", "subject__name", "academic_year__year")

    return JsonResponse(list(exams), safe=False)

def get_exam_students(request, exam_id):

    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    exam = get_object_or_404(Exam, id=exam_id)
    class_id = request.GET.get("class_id")

    if not class_id or not class_id.isdigit():
        return JsonResponse({'error': 'Invalid or missing class_id'}, status=400)

    class_instance = get_object_or_404(Class, id=int(class_id))

    # Get students ONLY from the selected class and academic year
    enrolled_students = StudentEnrollment.objects.filter(
        class_assigned=class_instance,
        academic_year=exam.academic_year
    ).select_related("student__user", "class_assigned", "class_assigned__grade")

    # Fetch existing grades for this exam & class
    existing_grades = {grade.student.id: grade.grade for grade in ExamGrade.objects.filter(exam=exam)}

    student_data = [
        {
            "id": student.student.id,
            "username": student.student.user.username,
            "grade": existing_grades.get(student.student.id, None)  # Show existing grade if available
        }
        for student in enrolled_students
    ]

    return JsonResponse({
        'students': student_data,
        'exam_name': exam.name,
        'subject': exam.subject.name,
        'grade': class_instance.grade.name,
        'class_name': class_instance.name
    })

@csrf_exempt
def update_exam_grades(request):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.role != 'teacher':
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        try:
            data = json.loads(request.body)
            exam_id = data.get("exam_id")
            grades = data.get("grades", [])

            exam = get_object_or_404(Exam, id=exam_id)

            for entry in grades:
                student = get_object_or_404(StudentProfile, id=entry["student_id"])
                grade_value = float(entry["grade"])

                # Validate grade range
                if grade_value < 0 or grade_value > 100:
                    raise ValidationError(f"Invalid grade {grade_value}. Must be between 0-100.")

                # Create or update the grade record
                exam_grade, created = ExamGrade.objects.update_or_create(
                    student=student,
                    exam=exam,
                    subject=exam.subject,
                    academic_year=exam.academic_year,
                    defaults={"grade": grade_value}
                )

            return JsonResponse({"message": "Grades updated successfully!"})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)

def get_exam_grades(request, exam_id):
    """
    Fetch students and their grades for the selected exam and class.
    """
    if not request.user.is_authenticated or request.user.role != 'teacher':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    exam = get_object_or_404(Exam, id=exam_id)
    class_id = request.GET.get("class_id")

    if not class_id:
        return JsonResponse({'error': 'Missing class_id'}, status=400)

    # Get students enrolled in the selected class and academic year
    enrolled_students = StudentEnrollment.objects.filter(
        class_assigned_id=class_id,
        academic_year=exam.academic_year
    ).select_related("student__user", "class_assigned", "class_assigned__grade")

    # Fetch existing grades for this exam & class
    existing_grades = {grade.student.id: grade.grade for grade in ExamGrade.objects.filter(exam=exam)}

    student_data = [
        {
            "id": student.student.id,
            "username": student.student.user.username,
            "grade": existing_grades.get(student.student.id, None)
        }
        for student in enrolled_students
    ]

    return JsonResponse({
        'students': student_data,
        'exam_name': exam.name,
        'subject': exam.subject.name,
        'grade': enrolled_students[0].class_assigned.grade.name if enrolled_students else "N/A",
        'class_name': enrolled_students[0].class_assigned.name if enrolled_students else "N/A",
    })
