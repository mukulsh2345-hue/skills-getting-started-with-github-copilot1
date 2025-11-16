import copy
from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)
import copy
from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_activities():
    """Make a deep copy of the in-memory activities before each test and restore it after."""
    orig = copy.deepcopy(activities)
    try:
        yield
    finally:
        activities.clear()
        activities.update(orig)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Basic sanity check: known activity should exist
    assert "Chess Club" in data


def test_signup_and_prevent_duplicate():
    activity = "Tennis Club"
    email = "pytest_student@example.com"

    # Ensure email not already present
    assert email not in activities[activity]["participants"]

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail with 400
    res2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert res2.status_code == 400


def test_unregister_participant():
    activity = "Chess Club"
    email = "to_remove@example.com"

    # Add a participant then remove
    activities[activity]["participants"].append(email)
    assert email in activities[activity]["participants"]

    res = client.delete(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]