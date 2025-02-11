from django.contrib import admin
from .models import (
    CustomUser,
    AdminProfile,
    StaffProfile,
    TeacherProfile,
    SalaryPayment,
    StudentProfile,
    ParentProfile,
    AcademicYear,
    Grade,
    Class,
    Subject,
    Schedule,
    TeacherAssignment,
    StudentEnrollment,
    Attendance,
    Exam,
    ExamGrade,
    Fees,
    AdditionalFee,
    Notification,
    TeacherDailyAttendance,
    StaffDailyAttendance,
)

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'gender', 'date_of_birth')
    search_fields = ('username', 'email', 'role')
    list_filter = ('role', 'gender', 'religion')

@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'salary')
    search_fields = ('user__username',)
    list_filter = ('salary',)

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'salary')
    search_fields = ('user__username',)
    list_filter = ('salary',)

@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ('profile', 'payment_date', 'amount_paid')
    search_fields = ('profile__username',)
    list_filter = ('payment_date',)

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)

@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('year', 'is_active')
    search_fields = ('year',)
    list_filter = ('is_active',)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'academic_year', 'is_active', 'fee')
    search_fields = ('name', 'grade__name', 'academic_year__year')
    list_filter = ('grade', 'academic_year', 'is_active')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'academic_year', 'is_active')
    search_fields = ('name', 'grade__name', 'academic_year__year')
    list_filter = ('grade', 'academic_year', 'is_active')

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('class_instance', 'section', 'day_of_week', 'subject')
    search_fields = ('class_instance__name', 'subject__name')
    list_filter = ('day_of_week', 'class_instance')

@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'class_assigned', 'academic_year')
    search_fields = ('teacher__user__username', 'subject__name', 'class_assigned__name', 'academic_year__year')
    list_filter = ('academic_year', 'class_assigned')

@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'grade', 'class_assigned', 'academic_year', 'is_active', 'enrollment_date')
    search_fields = ('student__user__username', 'class_assigned__name', 'grade__name', 'academic_year__year')
    list_filter = ('academic_year', 'grade', 'class_assigned', 'is_active')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    # Display key details in the list view
    list_display = (
        'class_instance',    # Name of the class
        'section',           # Section (e.g., "1st Section")
        'date',              # Date of attendance
        'academic_year',     # Academic year
        'present_count',     # Count of present students
        'absent_count',      # Count of absent students
        'total_students',    # Total students in the class
        'created_at',        # Record creation time
        'updated_at',        # Record last updated time
    )
    
    # Filters for narrowing down records
    list_filter = (
        'class_instance',    # Filter by class
        'section',           # Filter by section
        'date',              # Filter by date
        'academic_year',     # Filter by academic year
    )
    
    # Enable search functionality
    search_fields = (
        'class_instance__name',   # Search by class name
        'section',                # Search by section
    )
    
    # Ordering by most recent attendance records
    ordering = ('-date', 'class_instance', 'section')

    # Allow inline editing of many-to-many fields
    filter_horizontal = ('present_students', 'absent_students')  # Makes managing students easier

    # Add a date hierarchy for quick navigation
    date_hierarchy = 'date'

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "grade", "exam_date", "academic_year")  # ✅ No class_assigned here
    list_filter = ("grade", "academic_year")
    search_fields = ("name", "subject__name", "grade__name")
    filter_horizontal = ("classes_assigned",)

@admin.register(ExamGrade)
class ExamGradeAdmin(admin.ModelAdmin):
    list_display = ("student", "exam", "subject", "grade", "academic_year")  # Show student exam grades
    list_filter = ("exam", "academic_year")  # Allow filtering by exam & year
    search_fields = ("student__user__username", "exam__name", "subject__name")  # Allow search functionality

from django.contrib.admin import SimpleListFilter

class FeeStatusFilter(SimpleListFilter):
    title = 'Fee Status'
    parameter_name = 'fee_status'

    def lookups(self, request, model_admin):
        return [
            ('complete', 'Complete'),
            ('partially_paid', 'Partially Paid'),
            ('not_paid', 'Not Paid'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'complete':
            return [fee for fee in queryset if fee.fee_status == 'Complete']
        elif self.value() == 'partially_paid':
            return [fee for fee in queryset if fee.fee_status == 'Partially Paid']
        elif self.value() == 'not_paid':
            return [fee for fee in queryset if fee.fee_status == 'Not Paid']
        return queryset

@admin.register(Fees)
class FeesAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount_due', 'amount_paid', 'due_date', 'academic_year', 'fee_status')
    search_fields = ('student__user__username',)
    list_filter = ('academic_year', FeeStatusFilter)

@admin.register(AdditionalFee)
class AdditionalFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'description', 'amount', 'academic_year')
    search_fields = ('student__user__username', 'description')
    list_filter = ('academic_year',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'sender', 'scope', 'is_active', 'created_at')
    search_fields = ('title', 'sender__user__username')
    list_filter = ('scope', 'is_active', 'created_at')

@admin.register(TeacherDailyAttendance)
class TeacherDailyAttendanceAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'date', 'status')
    search_fields = ('teacher__user__username',)
    list_filter = ('date', 'status')

@admin.register(StaffDailyAttendance)
class StaffDailyAttendanceAdmin(admin.ModelAdmin):
    list_display = ('staff', 'date', 'status')
    search_fields = ('staff__user__username',)
    list_filter = ('date', 'status')
