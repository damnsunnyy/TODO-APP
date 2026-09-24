from django.urls import path
from .views import TodoListCreateView, TodoDetailView


urlpatterns = [
    path("", TodoListCreateView.as_view(), name="todo-list-create"),
    path("<int:pk>/", TodoDetailView.as_view(), name="todo-detail"),
]
