from django.urls import path

from .views import internal_hrm_account_view, login_view, me_view, register_view

urlpatterns = [
    path("login/", login_view),
    path("me/", me_view),
    path("register/", register_view),
    path("internal-hrm-accounts/", internal_hrm_account_view),
]
