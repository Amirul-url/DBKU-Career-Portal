from django.urls import path

from .views import applicant_profile_data_view, forgot_password_send_otp_view, forgot_password_verify_otp_view, internal_hrm_account_view, login_view, logout_view, me_view, register_view, reset_password_submit_view, superadmin_account_activities_view, superadmin_admin_account_detail_view, superadmin_admin_accounts_view, superadmin_applicant_profile_view, superadmin_applicants_view, superadmin_superadmin_account_detail_view, superadmin_superadmin_accounts_view

urlpatterns = [
    path("login/", login_view),
    path("logout/", logout_view),
    path("me/", me_view),
    path("register/", register_view),
    path("forgot-password/send-otp/", forgot_password_send_otp_view),
    path("forgot-password/verify-otp/", forgot_password_verify_otp_view),
    path("reset-password/submit/", reset_password_submit_view),
    path("internal-hrm-accounts/", internal_hrm_account_view),
    path("profile-data/", applicant_profile_data_view),
    path("applicants/", superadmin_applicants_view),
    path("applicants/<int:user_id>/profile/", superadmin_applicant_profile_view),
    path("account-activities/", superadmin_account_activities_view),
    path("admin-accounts/", superadmin_admin_accounts_view),
    path("admin-accounts/<int:user_id>/", superadmin_admin_account_detail_view),
    path("superadmin-accounts/", superadmin_superadmin_accounts_view),
    path("superadmin-accounts/<int:user_id>/", superadmin_superadmin_account_detail_view),
]
