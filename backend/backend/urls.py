from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/",
        include(
            [
                path("", include("authapp.urls")),
                path("", include("rfq.urls")),
                path("", include("rfqchannels.urls")),
                path("", include("item.urls")),
                path("", include("team.urls")),
                path("", include("series.urls")),
                path("", include("quotation.urls")),
                # path("", include("job_execution.urls")),
            ]
        ),
    ),
    path("documentation/", include("documentation.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
