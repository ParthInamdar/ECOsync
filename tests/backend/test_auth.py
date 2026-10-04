def test_registration(client):
    response = client.post('/api/auth/register', json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert response.status_code == 201
    assert response.json['success'] is True

def test_login(client, init_db):
    response = client.post('/api/auth/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_invalid_login(client, init_db):
    response = client.post('/api/auth/login', json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json['success'] is False

def test_protected_route(client):
    # Try accessing a protected route without token
    response = client.get('/api/auth/me')
    assert response.status_code == 401

def test_protected_route_with_token(client, auth_headers):
    # Try accessing a protected route with a valid token
    response = client.get('/api/auth/me', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['user']['username'] == "testuser"
