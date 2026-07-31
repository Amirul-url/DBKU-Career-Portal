from rest_framework.routers import DefaultRouter

from .views import CandidateApplicationViewSet

router = DefaultRouter()
router.register(r"", CandidateApplicationViewSet, basename="applications")

urlpatterns = router.urls

