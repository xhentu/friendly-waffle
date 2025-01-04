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
def get_subjects(request):
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

            # Handle role-specific logic
            if user.role == "staff":
                StaffProfile.objects.create(user=user, salary=data.get("salary"))
            elif user.role == "teacher":
                TeacherProfile.objects.create(user=user, salary=data.get("salary"))
            elif user.role == "student":
                StudentProfile.objects.create(user=user)  # No grade reference
            elif user.role == "parent":
                parent = ParentProfile.objects.create(user=user)
                parent.students.set(data.get("linked_students", []))

            return JsonResponse({"success": True})
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
