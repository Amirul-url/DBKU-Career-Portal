from django.urls import path

from .views import applicant_profile_data_view, internal_hrm_account_view, login_view, me_view, register_view, superadmin_applicant_profile_view, superadmin_applicants_view

urlpatterns = [
    path("login/", login_view),
    path("me/", me_view),
    path("register/", register_view),
    path("internal-hrm-accounts/", internal_hrm_account_view),
    path("profile-data/", applicant_profile_data_view),
    path("applicants/", superadmin_applicants_view),
    path("applicants/<int:user_id>/profile/", superadmin_applicant_profile_view),
]
