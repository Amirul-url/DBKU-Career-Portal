from rest_framework import permissions


class CandidateApplicationPermission(permissions.BasePermission):
    staff_roles = {"admin", "hr", "reviewer", "superadmin"}

    def has_object_permission(self, request, view, obj):
        if request.user.role in self.staff_roles:
            return True
        return obj.applicant_id == request.user.id
