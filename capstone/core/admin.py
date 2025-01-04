from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, AdminProfile, StaffProfile, TeacherProfile, StudentProfile, ParentProfile, SalaryPayment,
    AcademicYear, Grade, Class, Subject, Schedule, TeacherAssignment, StudentEnrollment,
    Attendance, Exam, ExamGrade, Fees, Notification, TeacherDailyAttendance, StaffDailyAttendance
)

# Custom User Admin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'nrc_no', 'phone_number', 'gender', 'religion', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email', 'nrc_no', 'gender', 'religion', 'phone_number', 'address', 'date_of_birth')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role', {'fields': ('role',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'email')
        }),
    )
    search_fields = ('username', 'email')
    ordering = ('username',)

# Inline profiles for easy management
class AdminProfileInline(admin.StackedInline):
    model = AdminProfile
    can_delete = False
    verbose_name_plural = 'Admin Profile'

class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = False
    verbose_name_plural = 'Staff Profile'

class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False
    verbose_name_plural = 'Teacher Profile'

class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Student Profile'

class ParentProfileInline(admin.StackedInline):
    model = ParentProfile
    can_delete = False
    verbose_name_plural = 'Parent Profile'

# Admin for Profiles
@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'salary')

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'salary')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)

@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)

# Payment Administration
@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ('profile', 'payment_date', 'amount_paid')
    list_filter = ('payment_date',)
    search_fields = ('profile__username',)

# Academic Administration
@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('year', 'is_active')
    list_filter = ('is_active',)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'academic_year', 'is_active')
    list_filter = ('grade', 'academic_year', 'is_active')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'academic_year', 'is_active')
    list_filter = ('grade', 'academic_year', 'is_active')
    search_fields = ('name',)

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('class_instance', 'section', 'subject', 'day_of_week')
    list_filter = ('day_of_week', 'class_instance', 'subject')

@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'class_assigned', 'academic_year')
    list_filter = ('academic_year', 'class_assigned')

@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'grade', 'class_assigned', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'grade', 'class_assigned', 'is_active')

    search_fields = ('student__user__username', 'class_assigned__name', 'grade__name')
    ordering = ('academic_year', 'grade', 'class_assigned')

# Attendance
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'date', 'status')
    list_filter = ('date', 'status')

@admin.register(TeacherDailyAttendance)
class TeacherDailyAttendanceAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'date', 'status')
    list_filter = ('date', 'status')

@admin.register(StaffDailyAttendance)
class StaffDailyAttendanceAdmin(admin.ModelAdmin):
    list_display = ('staff', 'date', 'status')
    list_filter = ('date', 'status')

# Exams and Grades
@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'class_assigned', 'exam_date', 'academic_year')
    list_filter = ('exam_date', 'academic_year')

@admin.register(ExamGrade)
class ExamGradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'subject', 'grade')
    list_filter = ('academic_year',)

# Fees and Notifications
@admin.register(Fees)
class FeesAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount_due', 'amount_paid', 'fee_status', 'due_date', 'academic_year')
    list_filter = ('academic_year', 'due_date')
    search_fields = ('student__user__username',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'sender', 'scope', 'is_active', 'created_at')
    list_filter = ('scope', 'is_active', 'created_at')
    search_fields = ('title', 'message')
